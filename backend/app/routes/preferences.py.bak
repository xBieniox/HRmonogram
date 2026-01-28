from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import ShiftPreference, ShiftTemplate
import json

bp = Blueprint('preferences', __name__)

@bp.route('/preferences/<int:object_id>', methods=['GET'])
@jwt_required()
def get_preferences(object_id):
    preference = ShiftPreference.query.filter_by(object_id=object_id).first()
    
    # Pobieramy szablony
    templates = ShiftTemplate.query.filter_by(object_id=object_id).all()
    templates_data = []
    for t in templates:
        templates_data.append({
            "abbreviation": t.abbreviation,
            "start_time": t.start_time,
            "end_time": t.end_time
        })

    if not preference:
        return jsonify({
            "id": None,
            "object_id": object_id,
            "schedule_type": "monthly",
            "work_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "daily_hours_limit": 8,
            "min_employees_per_shift": 1,
            "holidays_included": False,
            "shift_templates": templates_data
        })

    return jsonify({
        'id': preference.id,
        'object_id': preference.object_id,
        'schedule_type': preference.schedule_type,
        'work_days': preference.get_work_days(),
        'daily_hours_limit': preference.daily_hours_limit,
        'min_employees_per_shift': preference.min_employees_per_shift,
        'holidays_included': preference.holidays_included,
        'shift_templates': templates_data
    })

@bp.route('/preferences/<int:object_id>', methods=['PUT'])
@jwt_required()
def update_preferences(object_id):
    data = request.json
    preference = ShiftPreference.query.filter_by(object_id=object_id).first()

    # 1. Aktualizacja Preferencji Ogólnych
    if not preference:
        preference = ShiftPreference(
            object_id=object_id,
            work_days=json.dumps(data.get('work_days', ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])),
            schedule_type=data.get('schedule_type', "monthly"),
            daily_hours_limit=data.get('daily_hours_limit', 8),
            min_employees_per_shift=data.get('min_employees_per_shift', 1),
            holidays_included=data.get('holidays_included', False)
        )
        db.session.add(preference)
    else:
        if 'work_days' in data:
            preference.set_work_days(data['work_days'])
        if 'schedule_type' in data:
            preference.schedule_type = data['schedule_type']
        if 'daily_hours_limit' in data:
            preference.daily_hours_limit = data['daily_hours_limit']
        if 'min_employees_per_shift' in data:
            preference.min_employees_per_shift = data['min_employees_per_shift']
        if 'holidays_included' in data:
            preference.holidays_included = data['holidays_included']

    # 2. Aktualizacja Szablonów Zmian (Shift Templates)
    if 'shift_templates' in data:
        # Najprostsza strategia: usuń stare i dodaj nowe (synchronizacja)
        ShiftTemplate.query.filter_by(object_id=object_id).delete()
        
        for t in data['shift_templates']:
            if t.get('abbreviation') and t.get('start_time') and t.get('end_time'):
                new_template = ShiftTemplate(
                    object_id=object_id,
                    abbreviation=t['abbreviation'],
                    start_time=t['start_time'],
                    end_time=t['end_time']
                )
                db.session.add(new_template)

    db.session.commit()
    return jsonify(message="Preferences and templates updated successfully")