from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import ShiftTemplate

class LaborCodeValidator:
    
    @staticmethod
    def parse_shift(shift_str, date_obj):
        """Pomocnicza funkcja parsująca string '08:00-16:00' na obiekty datetime."""
        if not shift_str or '-' not in shift_str:
            return None, None

        try:
            start_str, end_str = shift_str.split('-')
            
            # Obsługa formatów H:MM i HH:MM
            def to_time(s):
                parts = s.strip().split(':')
                h = int(parts[0])
                m = int(parts[1]) if len(parts) > 1 else 0
                return h, m

            sh, sm = to_time(start_str)
            eh, em = to_time(end_str)

            start_dt = datetime.combine(date_obj, datetime.min.time()) + timedelta(hours=sh, minutes=sm)
            end_dt = datetime.combine(date_obj, datetime.min.time()) + timedelta(hours=eh, minutes=em)

            # Obsługa zmiany nocnej (np. 22:00 - 06:00), koniec jest następnego dnia
            if end_dt <= start_dt:
                end_dt += timedelta(days=1)

            return start_dt, end_dt
        except Exception:
            return None, None

    @staticmethod
    def validate_shift(current_shift, current_date, prev_shift=None, prev_date=None):
        """
        Sprawdza zgodność z Kodeksem Pracy dla pojedynczej zmiany.
        Zwraca listę naruszeń (stringów).
        """
        violations = []
        
        # Parsowanie obecnej zmiany
        curr_start, curr_end = LaborCodeValidator.parse_shift(current_shift, current_date)
        if not curr_start:
            return [] # Pusty grafik lub błędny format (walidowany gdzie indziej)

        # 1. LIMIT DOBOWY (Art. 129, 135) 
        duration = (curr_end - curr_start).total_seconds() / 3600
        if duration > 12: # Zakładamy równoważny, ale ostrzegamy powyżej 12h
            violations.append(f"Przekroczony limit dobowy (Art. 135): zmiana trwa {duration}h (max 12h/16h/24h).")
        if duration > 24:
             violations.append("Błąd krytyczny: Zmiana dłuższa niż 24h.")

        # Jeśli mamy poprzednią zmianę, sprawdzamy relacje między dniami
        if prev_shift and prev_date:
            prev_start, prev_end = LaborCodeValidator.parse_shift(prev_shift, prev_date)
            
            if prev_start and prev_end:
                # 2. ODPOCZYNEK DOBOWY (Art. 132) 
                # Czas od końca poprzedniej zmiany do początku obecnej
                rest_time = (curr_start - prev_end).total_seconds() / 3600
                
                # Jeśli zmiana zaczyna się przed końcem poprzedniej (błąd logiczny)
                if rest_time < 0:
                     violations.append("Błąd logiczny: Nowa zmiana zaczyna się przed końcem poprzedniej.")
                # Jeśli odpoczynek < 11h
                elif rest_time < 11:
                    violations.append(f"Naruszenie odpoczynku dobowego (Art. 132): Tylko {rest_time:.2f}h przerwy (wymagane min. 11h).")

                # 3. DOBA PRACOWNICZA (Art. 128) 
                # Kolejna praca nie może zaczynać się w tej samej dobie (24h od startu poprzedniej)
                hours_since_prev_start = (curr_start - prev_start).total_seconds() / 3600
                if hours_since_prev_start < 24:
                    violations.append(f"Naruszenie doby pracowniczej (Art. 128): Praca zaczęta w tej samej dobie ({hours_since_prev_start:.1f}h od poprzedniego startu).")

        return violations