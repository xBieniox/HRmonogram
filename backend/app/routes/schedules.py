from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Schedule, User, WorkSchedule, ShiftPreference, ShiftTemplate
from datetime import datetime, timedelta
from sqlalchemy import desc, extract
from app.routes.labor_code_validator import LaborCodeValidator 
import json
import calendar

bp = Blueprint('schedules', __name__)

def calculate_schedule_dates(ws):
    prefs = ws.get_preferences()
    sched_type = 'monthly'
    if prefs and 'schedule_type' in prefs:
        sched_type = prefs['schedule_type']
    elif ws.shift_preference:
        sched_type = ws.shift_preference.schedule_type

    start = ws.start_date
    if sched_type == 'weekly':
        end = start + timedelta(days=6)
    else:
        last_day = calendar.monthrange(start.year, start.month)[1]
        end = start.replace(day=last_day)
    
    return start, end, sched_type

def get_schedule_templates(ws):
    # 1. Próbujemy pobrać ze snapshota (grafik historyczny/zatwierdzony)
    templates = ws.get_templates()
    
    # 2. Jeśli brak (stary grafik), pobieramy aktualne z bazy
    if not templates:
        db_templates = ShiftTemplate.query.filter_by(object_id=ws.object_id).all()
        templates = [{
            "abbreviation": t.abbreviation,
            "start_time": t.start_time,
            "end_time": t.end_time
        } for t in db_templates]
    return templates

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

@bp.route('/schedules/active/<int:object_id>', methods=['GET'])
@jwt_required()
def get_active_schedules(object_id):
    today = datetime.now().date()
    view_mode = request.args.get('view', 'active') 
    
    all_schedules = WorkSchedule.query.filter_by(object_id=object_id).order_by(desc(WorkSchedule.start_date)).all()
    
    results = []
    for ws in all_schedules:
        start, end_date, sched_type = calculate_schedule_dates(ws)
        
        status = "archived"
        if start <= today <= end_date:
            status = "active"
        elif start > today:
            status = "future"

        should_include = False
        if view_mode == 'history':
            if status == 'archived':
                should_include = True
        else:
            if status in ['active', 'future']:
                should_include = True

        if should_include:
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

@bp.route('/work_schedules/<int:schedule_id>', methods=['GET'])
@jwt_required()
def get_work_schedule_details(schedule_id):
    ws = WorkSchedule.query.get_or_404(schedule_id)
    start, end_date, sched_type = calculate_schedule_dates(ws)

    shifts_map = {}
    for s in ws.shifts:
        key = f"{s.employee_id}_{s.date.strftime('%Y-%m-%d')}"
        shifts_map[key] = s.shift

    return jsonify({
        "id": ws.id,
        "title": ws.title,
        "type": sched_type,
        "start_date": ws.start_date.strftime('%Y-%m-%d'),
        "end_date": end_date.strftime('%Y-%m-%d'),
        "shifts": shifts_map
    })

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

        if isinstance(current_identity, dict):
            creator_id = current_identity.get('id')
        elif isinstance(current_identity, int):
            creator_id = current_identity
        elif isinstance(current_identity, str):
            user = User.query.filter_by(email=current_identity).first()
            if user: creator_id = user.id

        start_dt = datetime.strptime(start_date_str, '%Y-%m-%d').date()

        pref = ShiftPreference.query.filter_by(object_id=forced_object_id).first()
        if not pref:
            pref = ShiftPreference(object_id=forced_object_id)
            db.session.add(pref)
            db.session.flush()

        work_schedule = None

        if schedule_id:
            work_schedule = WorkSchedule.query.get(schedule_id)
            if not work_schedule:
                return jsonify(message="Grafik nie został znaleziony."), 404
            
            if work_schedule.title != schedule_name:
                duplicate = WorkSchedule.query.filter_by(object_id=forced_object_id, title=schedule_name).first()
                if duplicate:
                    return jsonify(message=f"Nazwa '{schedule_name}' jest już zajęta w tym obiekcie!"), 409
            
            work_schedule.title = schedule_name
            work_schedule.start_date = start_dt
        
        else:
            existing = WorkSchedule.query.filter_by(object_id=forced_object_id, title=schedule_name).first()
            if existing:
                return jsonify(message=f"Grafik o nazwie '{schedule_name}' już istnieje w tym obiekcie!"), 409

            snapshot_pref_data = {
                "schedule_type": pref.schedule_type,
                "daily_hours_limit": pref.daily_hours_limit,
                "min_employees_per_shift": pref.min_employees_per_shift,
                "holidays_included": pref.holidays_included,
                "work_days": pref.get_work_days()
            }
            
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
                snapshot_preferences=json.dumps(snapshot_pref_data),
                snapshot_templates=json.dumps(snapshot_templates_data)
            )
            db.session.add(work_schedule)
            db.session.flush()

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
                        employee_id=employee_id,
                        date=target_date,
                        shift=val_str,
                        object_id=forced_object_id,
                        work_schedule_id=work_schedule.id 
                    )
                    db.session.add(new_entry)
        
        db.session.commit()
        return jsonify(message="Schedule saved successfully", schedule_id=work_schedule.id), 200

    except Exception as e:
        db.session.rollback()
        return jsonify(message=f"Server error: {str(e)}"), 500

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

@bp.route('/schedules/<int:schedule_id>/publish', methods=['PUT'])
@jwt_required()
def toggle_publish_schedule(schedule_id):
    target_schedule = WorkSchedule.query.get_or_404(schedule_id)
    
    if not target_schedule.is_published:
        t_start, t_end, _ = calculate_schedule_dates(target_schedule)
        
        overlapping_schedules = WorkSchedule.query.filter(
            WorkSchedule.object_id == target_schedule.object_id,
            WorkSchedule.is_published == True,
            WorkSchedule.id != target_schedule.id
        ).all()

        for existing in overlapping_schedules:
            e_start, e_end, _ = calculate_schedule_dates(existing)
            
            if t_start <= e_end and t_end >= e_start:
                target_emp_ids = {s.employee_id for s in target_schedule.shifts}
                existing_emp_ids = {s.employee_id for s in existing.shifts}
                
                common_employees = target_emp_ids.intersection(existing_emp_ids)
                
                if common_employees:
                    return jsonify(
                        message=f"Konflikt! Pracownicy powtarzają się w innym opublikowanym grafiku: '{existing.title}' w tym samym czasie ({e_start} - {e_end})."
                    ), 409

    target_schedule.is_published = not target_schedule.is_published
    db.session.commit()
    status_msg = "opublikowany" if target_schedule.is_published else "ukryty (szkic)"
    return jsonify(message=f"Grafik został {status_msg}.", is_published=target_schedule.is_published), 200

@bp.route('/schedules/settings/<int:object_id>', methods=['GET'])
@jwt_required()
def get_schedule_settings(object_id):
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

@bp.route('/schedules/settings/<int:object_id>', methods=['POST'])
@jwt_required()
def save_schedule_settings(object_id):
    data = request.json
    pref_data = data.get('preference')
    templates_data = data.get('templates', [])

    if not pref_data:
        return jsonify(message="Brak danych preferencji"), 400

    pref = ShiftPreference.query.filter_by(object_id=object_id).first()
    if not pref:
        pref = ShiftPreference(object_id=object_id)
        db.session.add(pref)
    
    pref.schedule_type = pref_data.get('schedule_type', 'monthly')
    pref.daily_hours_limit = pref_data.get('daily_hours_limit', 8)
    pref.min_employees_per_shift = pref_data.get('min_employees_per_shift', 1)
    pref.holidays_included = pref_data.get('holidays_included', False)
    pref.set_work_days(pref_data.get('work_days', [])) 

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

@bp.route('/schedules/context', methods=['GET'])
@jwt_required()
def get_schedule_context():
    object_id = request.args.get('object_id')
    schedule_id = request.args.get('schedule_id')

    if schedule_id:
        schedule = WorkSchedule.query.get(schedule_id)
        if schedule:
            prefs = schedule.get_preferences()
            templates = schedule.get_templates()
            
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

@bp.route('/schedules/<int:schedule_id>', methods=['DELETE'])
@jwt_required()
def delete_work_schedule(schedule_id):
    work_schedule = WorkSchedule.query.get_or_404(schedule_id)
    try:
        db.session.delete(work_schedule)
        db.session.commit()
        return jsonify(message="Grafik został pomyślnie usunięty."), 200
    except Exception as e:
        db.session.rollback()
        return jsonify(message=f"Błąd serwera: {str(e)}"), 500

# --- DLA PRACOWNIKA: Pobieranie listy dostępnych grafików (Historia / Nadchodzące) ---
@bp.route('/schedules/my-list', methods=['GET'])
@jwt_required()
def get_my_schedules_list():
    current_identity = get_jwt_identity()
    user_id = current_identity.get('id') if isinstance(current_identity, dict) else current_identity
    user = User.query.get(user_id)
    
    if not user or not user.object_id:
        return jsonify(message="Brak obiektu"), 404

    schedules = WorkSchedule.query.filter_by(
        object_id=user.object_id, is_published=True
    ).order_by(desc(WorkSchedule.start_date)).all()

    today = datetime.now().date()
    response_data = { "current": [], "upcoming": [], "history": [] }

    for ws in schedules:
        t_start, t_end, _ = calculate_schedule_dates(ws)
        
        item = {
            "id": ws.id,
            "title": ws.title,
            "start_date": t_start.strftime('%Y-%m-%d'),
            "end_date": t_end.strftime('%Y-%m-%d')
        }

        if t_start <= today <= t_end:
            response_data["current"].append(item)
        elif t_start > today:
            response_data["upcoming"].append(item)
        else:
            response_data["history"].append(item)

    return jsonify(response_data)

# --- DLA PRACOWNIKA: Pobieranie konkretnego grafiku (z walidacją dostępu) ---
@bp.route('/schedules/employee-view/<int:schedule_id>', methods=['GET'])
@jwt_required()
def get_employee_schedule_details(schedule_id):
    current_identity = get_jwt_identity()
    user_id = current_identity.get('id') if isinstance(current_identity, dict) else current_identity
    user = User.query.get(user_id)

    ws = WorkSchedule.query.get_or_404(schedule_id)

    # Zabezpieczenie: Pracownik widzi tylko SWÓJ obiekt i tylko OPUBLIKOWANE
    if ws.object_id != user.object_id or not ws.is_published:
        return jsonify(message="Brak dostępu do tego grafiku."), 403

    t_start, t_end, _ = calculate_schedule_dates(ws)
    
    shifts_map = {}
    for s in ws.shifts:
        key = f"{s.employee_id}_{s.date.strftime('%Y-%m-%d')}"
        shifts_map[key] = s.shift

    employees = User.query.filter_by(object_id=user.object_id).all()
    employees_list = [{"id": e.id, "name": e.name} for e in employees]
    
    # Pobieramy legendę (szablony)
    templates = get_schedule_templates(ws)

    return jsonify({
        "id": ws.id,
        "title": ws.title,
        "start_date": t_start.strftime('%Y-%m-%d'),
        "end_date": t_end.strftime('%Y-%m-%d'),
        "shifts": shifts_map,
        "employees": employees_list,
        "templates": templates, # Legenda
        "user_id": user.id
    })

# --- DLA PRACOWNIKA: Pobieranie aktualnego (domyślnego) ---
@bp.route('/schedules/my-current', methods=['GET'])
@jwt_required()
def get_my_current_schedule():
    current_identity = get_jwt_identity()
    user_id = current_identity.get('id') if isinstance(current_identity, dict) else current_identity
    
    user = User.query.get(user_id)
    if not user or not user.object_id:
        return jsonify(message="Nie jesteś przypisany do żadnego obiektu."), 404

    schedules = WorkSchedule.query.filter_by(
        object_id=user.object_id, 
        is_published=True
    ).order_by(desc(WorkSchedule.start_date)).all()

    today = datetime.now().date()
    active_schedule = None
    active_end_date = None
    
    for ws in schedules:
        t_start, t_end, _ = calculate_schedule_dates(ws)
        if t_start <= today <= t_end:
            active_schedule = ws
            active_end_date = t_end
            break
    
    if not active_schedule:
        return jsonify(message="Brak opublikowanego grafiku na bieżący okres."), 404

    shifts_map = {}
    for s in active_schedule.shifts:
        key = f"{s.employee_id}_{s.date.strftime('%Y-%m-%d')}"
        shifts_map[key] = s.shift

    employees = User.query.filter_by(object_id=user.object_id).all()
    employees_list = [{"id": e.id, "name": e.name} for e in employees]
    
    # Dodajemy legendę
    templates = get_schedule_templates(active_schedule)

    return jsonify({
        "id": active_schedule.id,
        "title": active_schedule.title,
        "start_date": active_schedule.start_date.strftime('%Y-%m-%d'),
        "end_date": active_end_date.strftime('%Y-%m-%d'),
        "shifts": shifts_map,
        "user_id": user.id,
        "employees": employees_list,
        "templates": templates 
    })