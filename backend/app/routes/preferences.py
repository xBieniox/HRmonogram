from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import ShiftPreference
import json

bp = Blueprint('preferences', __name__)

# Pobieranie preferencji dla danego obiektu
@bp.route('/preferences/<int:object_id>', methods=['GET'])
@jwt_required()
def get_preferences(object_id):
    preference = ShiftPreference.query.filter_by(object_id=object_id).first()
    
    if not preference:
        return jsonify({
            "id": None,
            "object_id": object_id,
            "schedule_type": "weekly",
            "work_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "max_hours_per_employee": 40,  # Domyślna wartość
            "min_employees_per_shift": 1,  # Domyślna wartość
            "holidays_included": False
        })

    return jsonify({
        'id': preference.id,
        'object_id': preference.object_id,
        'schedule_type': preference.schedule_type,
        'work_days': preference.get_work_days(),
        'max_hours_per_employee': preference.max_hours_per_employee,
        'min_employees_per_shift': preference.min_employees_per_shift,
        'holidays_included': preference.holidays_included
    })

# Aktualizacja preferencji dla danego obiektu
@bp.route('/preferences/<int:object_id>', methods=['PUT'])
@jwt_required()
def update_preferences(object_id):
    data = request.json
    preference = ShiftPreference.query.filter_by(object_id=object_id).first()

    if not preference:
        preference = ShiftPreference(
            object_id=object_id,
            work_days=json.dumps(data.get('work_days', ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])),
            schedule_type=data.get('schedule_type', "weekly"),
            max_hours_per_employee=data.get('max_hours_per_employee', 40),  # Nowe pole
            min_employees_per_shift=data.get('min_employees_per_shift', 1),  # Nowe pole
            holidays_included=data.get('holidays_included', False)
        )
        db.session.add(preference)
    else:
        if 'work_days' in data:
            preference.set_work_days(data['work_days'])
        if 'schedule_type' in data:
            preference.schedule_type = data['schedule_type']
        if 'max_hours_per_employee' in data:
            preference.max_hours_per_employee = data['max_hours_per_employee']
        if 'min_employees_per_shift' in data:
            preference.min_employees_per_shift = data['min_employees_per_shift']
        if 'holidays_included' in data:
            preference.holidays_included = data['holidays_included']

    db.session.commit()
    return jsonify(message="Preferences updated successfully")
