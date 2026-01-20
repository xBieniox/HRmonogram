from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import WorkSchedule

bp = Blueprint('createschedules', __name__)

@bp.route('/createschedules', methods=['POST'])
@jwt_required()
def create_schedule():
    current_user = get_jwt_identity()  # Pobranie ID zalogowanego użytkownika

    data = request.json
    if not all(key in data for key in ['title', 'object_id', 'start_date', 'shift_preference_id']):
        return jsonify(message="Missing required fields"), 400

    schedule = WorkSchedule(
        title=data['title'],
        object_id=data['object_id'],
        department_id=data.get('department_id'),
        start_date=data['start_date'],
        shift_preference_id=data['shift_preference_id'],
        created_by=current_user['id']  # Przypisujemy ID użytkownika, który tworzy grafik
    )

    db.session.add(schedule)
    db.session.commit()

    return jsonify(message="Schedule created successfully", schedule_id=schedule.id), 201
