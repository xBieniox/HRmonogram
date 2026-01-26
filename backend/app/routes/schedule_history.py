from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import WorkSchedule, Schedule
from datetime import datetime, timedelta
from sqlalchemy import desc

bp = Blueprint('schedule_history', __name__)

# --- 1. POBIERANIE LISTY GRAFIKÓW (Dla Historii) ---
@bp.route('/schedules/active/<int:object_id>', methods=['GET'])
@jwt_required()
def get_history_list(object_id):
    """
    Zwraca listę nagłówków grafików (kafelki w Historii).
    """
    today = datetime.now().date()
    
    # Pobieramy wszystkie grafiki dla obiektu
    all_schedules = WorkSchedule.query.filter_by(object_id=object_id).order_by(desc(WorkSchedule.start_date)).all()
    
    results = []
    for ws in all_schedules:
        # Dynamiczne obliczanie daty końca
        sched_type = ws.shift_preference.schedule_type if ws.shift_preference else 'monthly'
        start = ws.start_date
        
        end_date = None
        if sched_type == 'weekly':
             end_date = start + timedelta(days=6)
        else:
             import calendar
             last_day = calendar.monthrange(start.year, start.month)[1]
             end_date = start.replace(day=last_day)
        
        status = "archived"
        if start <= today <= end_date:
            status = "active"
        elif start > today:
            status = "future"

        results.append({
            "id": ws.id,
            "title": ws.title,
            "type": sched_type,
            "start_date": start.strftime('%Y-%m-%d'),
            "end_date": end_date.strftime('%Y-%m-%d'),
            "status": status
        })

    return jsonify(results)

# --- 2. POBIERANIE SZCZEGÓŁÓW KONKRETNEGO GRAFIKU (PODGLĄD) ---
@bp.route('/work_schedules/<int:schedule_id>', methods=['GET'])
@jwt_required()
def get_work_schedule_details(schedule_id):
    """
    Zwraca pełne dane grafiku (zmiany pracowników) na podstawie ID dokumentu.
    Idealne do podglądu (read-only) dla Admina i Pracownika.
    """
    ws = WorkSchedule.query.get_or_404(schedule_id)
    
    # Pobieramy zmiany tylko dla tego grafiku
    shifts = Schedule.query.filter_by(work_schedule_id=ws.id).all()
    
    # Obliczamy datę końcową
    sched_type = ws.shift_preference.schedule_type if ws.shift_preference else 'monthly'
    end_date = ws.start_date
    if sched_type == 'weekly':
        end_date = ws.start_date + timedelta(days=6)
    else:
        import calendar
        last_day = calendar.monthrange(ws.start_date.year, ws.start_date.month)[1]
        end_date = ws.start_date.replace(day=last_day)

    # Mapujemy zmiany na format dla Frontendu
    shifts_data = {}
    for s in shifts:
        key = f"{s.employee_id}_{s.date.strftime('%Y-%m-%d')}"
        shifts_data[key] = s.shift

    return jsonify({
        "id": ws.id,
        "title": ws.title,
        "start_date": ws.start_date.strftime('%Y-%m-%d'),
        "end_date": end_date.strftime('%Y-%m-%d'),
        "type": sched_type,
        "shifts": shifts_data
    })

# --- 3. USUWANIE GRAFIKU ---
@bp.route('/work_schedules/<int:schedule_id>', methods=['DELETE'])
@jwt_required()
def delete_work_schedule(schedule_id):
    ws = WorkSchedule.query.get_or_404(schedule_id)
    
    try:
        db.session.delete(ws)
        db.session.commit()
        return jsonify(message="Grafik został usunięty"), 200
    except Exception as e:
        db.session.rollback()
        return jsonify(message=f"Błąd usuwania: {str(e)}"), 500