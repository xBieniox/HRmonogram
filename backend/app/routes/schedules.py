from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
# WAŻNE: Dodano ShiftTemplate do importów
from app.models import Schedule, User, WorkSchedule, ShiftPreference, ShiftTemplate
from datetime import datetime, timedelta
from sqlalchemy import desc, extract
from app.routes.labor_code_validator import LaborCodeValidator 
import json

bp = Blueprint('schedules', __name__)

# --- 1. POBIERANIE DANYCH DO KALENDARZA ---
@bp.route('/schedules/<int:object_id>/<string:month>', methods=['GET'])
@jwt_required()
def get_monthly_schedules(object_id, month):
    try:
        year, m = map(int, month.split('-'))
        
        schedules = Schedule.query.filter(
            Schedule.object_id == object_id,
            extract('year', Schedule.date) == year,
            extract('month', Schedule.date) == m
        ).all()

        return jsonify([
            {
                'id': sched.id,
                'employee_id': sched.employee_id,
                'date': sched.date.strftime('%Y-%m-%d'),
                'shift': sched.shift
            }
            for sched in schedules
        ])
    except ValueError:
        return jsonify(message="Invalid date format"), 400


# --- 2. POBIERANIE LISTY GRAFIKÓW ---
@bp.route('/schedules/active/<int:object_id>', methods=['GET'])
@jwt_required()
def get_active_schedules(object_id):
    today = datetime.now().date()
    
    all_schedules = WorkSchedule.query.filter_by(object_id=object_id).order_by(desc(WorkSchedule.start_date)).all()
    
    results = []
    for ws in all_schedules:
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
            "status": status,
            "is_published": ws.is_published
        })

    return jsonify(results)


# --- 3. MASOWY ZAPIS (ZATWIERDZANIE GRAFIKU) ---
@bp.route('/schedules/bulk_save', methods=['POST'])
@jwt_required()
def bulk_save_schedule():
    data = request.json
    shifts_data = data.get('shifts', {})
    forced_object_id = data.get('object_id')
    schedule_name = data.get('schedule_name', 'Bez nazwy')
    start_date_str = data.get('start_date')
    schedule_id = data.get('schedule_id') 
    
    if not shifts_data or not forced_object_id or not start_date_str:
        return jsonify(message="Missing data"), 400

    try:
        current_identity = get_jwt_identity()
        creator_id = None
        # ... (Logika pobierania creator_id bez zmian - skopiuj ze starego kodu lub zostaw jak jest) ...
        if isinstance(current_identity, dict): creator_id = current_identity.get('id')
        elif isinstance(current_identity, int): creator_id = current_identity
        elif isinstance(current_identity, str):
             user = User.query.filter_by(email=current_identity).first()
             if user: creator_id = user.id
        # ...

        start_dt = datetime.strptime(start_date_str, '%Y-%m-%d').date()

        # A. Pobierz GLOBALNE Preferencje (Master) - potrzebne przy tworzeniu
        pref = ShiftPreference.query.filter_by(object_id=forced_object_id).first()
        if not pref:
            # Tworzymy domyślne jeśli nie istnieją, żeby system nie padł
            pref = ShiftPreference(object_id=forced_object_id)
            db.session.add(pref)
            db.session.flush()

        work_schedule = None

        if schedule_id:
            # --- TRYB EDYCJI ---
            work_schedule = WorkSchedule.query.get(schedule_id)
            if not work_schedule: return jsonify(message="Grafik nie znaleziony"), 404
            
            # W edycji NIE NADPISUJEMY snapshota. Grafik pamięta swoje zasady.
            # Jedynie aktualizujemy nazwę/datę jeśli trzeba
            if work_schedule.title != schedule_name:
                dup = WorkSchedule.query.filter_by(object_id=forced_object_id, title=schedule_name).first()
                if dup: return jsonify(message=f"Nazwa '{schedule_name}' zajęta!"), 409
            
            work_schedule.title = schedule_name
            work_schedule.start_date = start_dt
        
        else:
            # --- TRYB TWORZENIA (TWORZYMY MIGAWKĘ) ---
            existing = WorkSchedule.query.filter_by(object_id=forced_object_id, title=schedule_name).first()
            if existing: return jsonify(message=f"Grafik '{schedule_name}' już istnieje!"), 409

            # 1. Przygotuj dane do snapshota (JSON)
            snapshot_pref_data = {
                "schedule_type": pref.schedule_type,
                "daily_hours_limit": pref.daily_hours_limit,
                "min_employees_per_shift": pref.min_employees_per_shift,
                "holidays_included": pref.holidays_included,
                "work_days": pref.get_work_days()
            }
            
            # 2. Pobierz aktualne szablony i zrób z nich snapshota
            current_templates = ShiftTemplate.query.filter_by(object_id=forced_object_id).all()
            snapshot_templates_data = [{
                "abbreviation": t.abbreviation,
                "start_time": t.start_time,
                "end_time": t.end_time
            } for t in current_templates]

            work_schedule = WorkSchedule(
                title=schedule_name,
                object_id=forced_object_id,
                start_date=start_dt,
                shift_preference_id=pref.id,
                created_by=creator_id,
                # ZAPISUJEMY JSONY:
                snapshot_preferences=json.dumps(snapshot_pref_data),
                snapshot_templates=json.dumps(snapshot_templates_data)
            )
            db.session.add(work_schedule)
            db.session.flush()

        # C. Zapis zmian (shifts) - BEZ ZMIAN w logice
        # ... (Skopiuj pętlę for key, shift_val in shifts_data.items() z poprzedniego kodu) ...
        # Dla pewności wklejam skróconą wersję:
        for key, shift_val in shifts_data.items():
            try:
                parts = key.split('_')
                if len(parts) != 2: continue
                employee_id = int(parts[0])
                date_str = parts[1]
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except: continue

            entry = Schedule.query.filter_by(employee_id=employee_id, date=target_date).first()
            val_str = str(shift_val).strip() if shift_val is not None else ""

            if val_str == "":
                if entry: db.session.delete(entry)
            else:
                if entry:
                    entry.shift = val_str
                    entry.object_id = forced_object_id
                    entry.work_schedule_id = work_schedule.id
                else:
                    new_entry = Schedule(
                        employee_id=employee_id, date=target_date, shift=val_str,
                        object_id=forced_object_id, work_schedule_id=work_schedule.id
                    )
                    db.session.add(new_entry)
        
        db.session.commit()
        return jsonify(message="Schedule saved", schedule_id=work_schedule.id), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error: {e}")
        return jsonify(message=f"Error: {str(e)}"), 500


# --- 4. POJEDYNCZA EDYCJA ---
@bp.route('/schedules/update', methods=['POST'])
@jwt_required()
def update_schedule_entry():
    data = request.json
    employee_id = data.get('employee_id')
    date_str = data.get('date')
    shift_val = data.get('shift')

    if not employee_id or not date_str:
        return jsonify(message="Missing data"), 400

    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        warnings = []
        if shift_val:
            prev_date = target_date - timedelta(days=1)
            prev_entry = Schedule.query.filter_by(employee_id=employee_id, date=prev_date).first()
            prev_shift_val = prev_entry.shift if prev_entry else None
            
            warnings = LaborCodeValidator.validate_shift(
                current_shift=shift_val,
                current_date=target_date,
                prev_shift=prev_shift_val,
                prev_date=prev_date
            )

        entry = Schedule.query.filter_by(employee_id=employee_id, date=target_date).first()

        if not shift_val or str(shift_val).strip() == "":
            if entry:
                db.session.delete(entry)
                db.session.commit()
            return jsonify(message="Shift removed", warnings=[]), 200

        if entry:
            entry.shift = shift_val
        else:
            employee = User.query.get(employee_id)
            new_entry = Schedule(
                employee_id=employee_id, 
                date=target_date, 
                shift=shift_val,
                object_id=employee.object_id if employee else None
            )
            db.session.add(new_entry)
        
        db.session.commit()
        return jsonify(message="Schedule updated", warnings=warnings), 200

    except Exception as e:
        db.session.rollback()
        return jsonify(message=str(e)), 500


# --- 5. PUBLIKACJA ---
@bp.route('/schedules/<int:schedule_id>/publish', methods=['PUT'])
@jwt_required()
def toggle_publish_schedule(schedule_id):
    schedule = WorkSchedule.query.get_or_404(schedule_id)
    new_status = not schedule.is_published
    schedule.is_published = new_status
    db.session.commit()
    status_msg = "opublikowany" if new_status else "ukryty (szkic)"
    return jsonify(message=f"Grafik został {status_msg}.", is_published=new_status), 200


# --- 6. POBIERANIE USTAWIEŃ I SZABLONÓW ---
@bp.route('/schedules/settings/<int:object_id>', methods=['GET'])
@jwt_required()
def get_schedule_settings(object_id):
    # 1. Pobierz preferencje
    pref = ShiftPreference.query.filter_by(object_id=object_id).first()
    
    pref_data = {
        "schedule_type": "monthly",
        "daily_hours_limit": 8,
        "work_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "min_employees_per_shift": 1,
        "holidays_included": False
    }

    if pref:
        pref_data = {
            "schedule_type": pref.schedule_type,
            "daily_hours_limit": pref.daily_hours_limit,
            "work_days": pref.get_work_days(),
            "min_employees_per_shift": pref.min_employees_per_shift,
            "holidays_included": pref.holidays_included
        }

    # 2. Pobierz szablony
    templates = ShiftTemplate.query.filter_by(object_id=object_id).all()
    templates_data = [{
        "id": t.id,
        "abbreviation": t.abbreviation,
        "start_time": t.start_time,
        "end_time": t.end_time
    } for t in templates]

    return jsonify({
        "preference": pref_data,
        "templates": templates_data
    })


# --- 7. ZAPISYWANIE USTAWIEŃ I SZABLONÓW ---
@bp.route('/schedules/settings/<int:object_id>', methods=['POST'])
@jwt_required()
def save_schedule_settings(object_id):
    data = request.json
    pref_data = data.get('preference')
    templates_data = data.get('templates', [])

    if not pref_data:
        return jsonify(message="Brak danych preferencji"), 400

    # 1. Zapis Preferencji
    pref = ShiftPreference.query.filter_by(object_id=object_id).first()
    if not pref:
        pref = ShiftPreference(object_id=object_id)
        db.session.add(pref)
    
    pref.schedule_type = pref_data.get('schedule_type', 'monthly')
    pref.daily_hours_limit = pref_data.get('daily_hours_limit', 8)
    pref.min_employees_per_shift = pref_data.get('min_employees_per_shift', 1)
    pref.holidays_included = pref_data.get('holidays_included', False)
    pref.set_work_days(pref_data.get('work_days', [])) 

    # 2. Zapis Szablonów (Usuń stare, dodaj nowe)
    existing_templates = ShiftTemplate.query.filter_by(object_id=object_id).all()
    for t in existing_templates:
        db.session.delete(t)
    
    for t_data in templates_data:
        new_template = ShiftTemplate(
            object_id=object_id,
            abbreviation=t_data['abbreviation'],
            start_time=t_data['start_time'],
            end_time=t_data['end_time']
        )
        db.session.add(new_template)

    db.session.commit()
    return jsonify(message="Ustawienia zapisane pomyślnie"), 200

# --- 8. POBIERANIE KONFIGURACJI DLA EDYTORA (Context) ---
@bp.route('/schedules/context', methods=['GET'])
@jwt_required()
def get_schedule_context():
    """
    Zwraca ustawienia i szablony odpowiednie dla danego kontekstu.
    Jeśli podano schedule_id -> zwraca dane ze SNAPSHOTA tego grafiku.
    Jeśli podano object_id (i brak schedule_id) -> zwraca dane GLOBALNE (Master).
    """
    object_id = request.args.get('object_id')
    schedule_id = request.args.get('schedule_id')

    # A. EDYCJA ISTNIEJĄCEGO GRAFIKU (Priorytet)
    if schedule_id:
        schedule = WorkSchedule.query.get(schedule_id)
        if schedule:
            # Próbujemy pobrać snapshota
            prefs = schedule.get_preferences()
            templates = schedule.get_templates()
            
            # Fallback: Jeśli grafik jest stary i nie ma snapshota (stworzony przed tą zmianą),
            # pobieramy aktualne globalne ustawienia
            if not prefs or not templates:
                current_pref = ShiftPreference.query.filter_by(object_id=schedule.object_id).first()
                current_templates = ShiftTemplate.query.filter_by(object_id=schedule.object_id).all()
                
                if current_pref:
                    prefs = {
                        "schedule_type": current_pref.schedule_type,
                        "daily_hours_limit": current_pref.daily_hours_limit,
                        "work_days": current_pref.get_work_days()
                    }
                
                templates = [{
                    "abbreviation": t.abbreviation, 
                    "start_time": t.start_time, 
                    "end_time": t.end_time
                } for t in current_templates]

            return jsonify({
                "source": "snapshot" if schedule.snapshot_preferences else "fallback_global",
                "preference": prefs,
                "templates": templates
            })

    # B. TWORZENIE NOWEGO GRAFIKU (Pobieramy Globalne)
    if object_id:
        pref = ShiftPreference.query.filter_by(object_id=object_id).first()
        templates_db = ShiftTemplate.query.filter_by(object_id=object_id).all()
        
        pref_data = {}
        if pref:
            pref_data = {
                "schedule_type": pref.schedule_type,
                "daily_hours_limit": pref.daily_hours_limit,
                "work_days": pref.get_work_days()
            }
        
        templates_data = [{
            "abbreviation": t.abbreviation, 
            "start_time": t.start_time, 
            "end_time": t.end_time
        } for t in templates_db]

        return jsonify({
            "source": "global_master",
            "preference": pref_data,
            "templates": templates_data
        })

    return jsonify(message="Missing params"), 400