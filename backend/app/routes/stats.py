from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models import User, Object, WorkSchedule
from datetime import datetime, timedelta
from sqlalchemy import desc
import calendar

bp = Blueprint('stats', __name__)

def calculate_end_date(ws):
    """
    Pomocnicza funkcja do obliczenia daty końca grafiku
    na podstawie jego typu (miesięczny/tygodniowy).
    """
    # Próbujemy pobrać preferencje ze snapshota lub relacji
    sched_type = 'monthly' # Domyślnie
    prefs = ws.get_preferences()
    
    if prefs and 'schedule_type' in prefs:
        sched_type = prefs['schedule_type']
    elif ws.shift_preference:
        sched_type = ws.shift_preference.schedule_type

    start = ws.start_date
    
    if sched_type == 'weekly':
        # Tygodniowy: start + 6 dni
        return start + timedelta(days=6)
    else:
        # Miesięczny: ostatni dzień miesiąca daty startu
        last_day = calendar.monthrange(start.year, start.month)[1]
        return start.replace(day=last_day)

@bp.route('/stats/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        # 1. Podstawowe liczniki
        total_employees = User.query.filter(User.role.in_(['employee', 'local_hr'])).count()
        total_objects = Object.query.count()
        
        # 2. Statusy obiektów
        today = datetime.now().date()
        
        objects = Object.query.all()
        objects_status = []
        
        active_schedules_count = 0
        missing_schedules_count = 0

        for obj in objects:
            # Pobieramy najnowszy OPUBLIKOWANY grafik dla danego obiektu
            latest_sched = WorkSchedule.query.filter_by(object_id=obj.id, is_published=True)\
                .order_by(desc(WorkSchedule.start_date)).first()
            
            status = "missing"
            last_schedule_info = "Brak"
            
            if latest_sched:
                # Obliczamy datę końcową tego grafiku
                end_date = calculate_end_date(latest_sched)
                
                # Formatowanie daty do wyświetlenia
                last_schedule_info = f"{latest_sched.start_date.strftime('%Y-%m-%d')} - {end_date.strftime('%Y-%m-%d')}"

                # SPRAWDZENIE: Czy dzisiaj mieści się w zakresie tego grafiku?
                if latest_sched.start_date <= today <= end_date:
                    status = "ok"
                    active_schedules_count += 1
                elif latest_sched.start_date > today:
                    status = "future" # Mamy grafik, ale dopiero się zacznie (jest OK, ale nie aktywny dziś)
                    # Opcjonalnie: możemy to traktować jako OK lub doliczać do braków bieżących
                    # Tutaj uznajemy, że "brak bieżącego", ale informujemy
                else:
                    status = "outdated" # Data końca minęła
                    missing_schedules_count += 1
            else:
                missing_schedules_count += 1

            objects_status.append({
                "id": obj.id,
                "name": obj.name,
                "location": obj.location,
                "status": status,
                "last_schedule": last_schedule_info
            })

        return jsonify({
            "employees_count": total_employees,
            "objects_count": total_objects,
            "active_schedules": active_schedules_count,
            "missing_schedules": missing_schedules_count,
            "objects_status": objects_status
        }), 200

    except Exception as e:
        print(f"Błąd w /stats/dashboard: {e}")
        return jsonify(message="Internal Server Error"), 500