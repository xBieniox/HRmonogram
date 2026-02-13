from datetime import datetime, timedelta
# Importy Flaskowe są tu opcjonalne, jeśli klasa jest czysto logiczna, 
# ale zostawiam je, aby nie psuć Twoich zależności w innych miejscach projektu.
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import ShiftTemplate

class LaborCodeValidator:
    
    @staticmethod
    def parse_shift(shift_str, date_obj):
        """
        Pomocnicza funkcja parsująca string '08:00-16:00' na obiekty datetime.
        
        """
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

            # Obsługa zmiany nocnej (np. 22:00-06:00)
            if end_dt <= start_dt:
                end_dt += timedelta(days=1)

            return start_dt, end_dt
        except Exception:
            return None, None

    @staticmethod
    def validate_shift(current_shift, current_date, prev_shift=None, prev_date=None):
        """
        Sprawdza zgodność z Kodeksem Pracy dla pojedynczej zmiany.
        
        """
        violations = []
        
        curr_start, curr_end = LaborCodeValidator.parse_shift(current_shift, current_date)
        if not curr_start:
            return [] 

        # 1. LIMIT DOBOWY (Art. 129, 135) 
        duration = (curr_end - curr_start).total_seconds() / 3600
        if duration > 12: 
            violations.append(f"Przekroczony limit dobowy (Art. 135): zmiana trwa {duration}h (max 12h).")
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

    @staticmethod
    def validate_weekly_norms(user_shifts):
        """
        max 48h z nadgodzinami.
        
        """
        violations = []
        weekly_hours = {}

        for date_obj, shift_str in user_shifts:
            start, end = LaborCodeValidator.parse_shift(shift_str, date_obj)
            if start and end:
                duration = (end - start).total_seconds() / 3600
                
                year, week, _ = start.isocalendar()
                key = (year, week)
                weekly_hours[key] = weekly_hours.get(key, 0) + duration

        for (year, week), total in weekly_hours.items():
           
            if total > 48:
                violations.append(f"Przekroczona norma tygodniowa w tygodniu {week}/{year}: {total}h (Limit: 48h).")
        
        return violations

    @staticmethod
    def validate_sundays(user_shifts):
        """
        wolna niedziela co najmniej raz na 4 tygodnie.
        
        """
        violations = []
        sunday_shifts = []

        # Znajdź wszystkie pracujące niedziele
        for date_obj, shift_str in user_shifts:
            if date_obj.weekday() == 6 and shift_str: # 6 = Niedziela
                sunday_shifts.append(date_obj)
        
        sunday_shifts.sort()

        if len(sunday_shifts) < 4:
            return []

        # Sprawdzamy sekwencje 4 kolejnych pracujących niedziel
        for i in range(len(sunday_shifts) - 3):
            first = sunday_shifts[i]
            fourth = sunday_shifts[i+3]
            
            # Jeśli 4-ta pracująca niedziela jest 21 dni (3 tygodnie) po pierwszej,
            # to znaczy, że pracował 4 niedziele pod rząd.
            delta = (fourth - first).days
            if delta == 21:
                violations.append(f"Brak wolnej niedzieli w okresie 4 tygodni (od {first.strftime('%Y-%m-%d')}).")

        return violations