from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import Schedule, User

bp = Blueprint('schedules', __name__)

@bp.route('/schedules', methods=['GET'])
@jwt_required()
def get_schedules():
    schedules = Schedule.query.all()
    return jsonify([
        {
            'id': sched.id,
            'employeeId': sched.employee_id,
            'employeeName': sched.employee.name,
            'date': sched.date.strftime('%Y-%m-%d'),
            'shift': sched.shift
        }
        for sched in schedules
    ])

@bp.route('/schedules', methods=['POST'])
@jwt_required()
def add_schedule():
    data = request.json
    schedule = Schedule(
        employee_id=data['employeeId'],
        date=data['date'],
        shift=data['shift']
    )
    db.session.add(schedule)
    db.session.commit()
    return jsonify(message='Schedule added successfully')

@bp.route('/schedules/current', methods=['GET'])
@jwt_required()
def get_current_schedule():
    object_id = request.args.get('object_id', type=int)
    schedules = Schedule.query.filter_by(object_id=object_id).all()
    return jsonify({
        'schedule': [
            {
                'id': sched.id,
                'employeeName': sched.employee.name,
                'date': sched.date.strftime('%Y-%m-%d'),
                'shift': sched.shift,
            }
            for sched in schedules
        ]
    })
@bp.route('/objects/<int:object_id>/schedules', methods=['GET'])
@jwt_required()
def get_object_schedules(object_id):
    # Sprawdź, czy użytkownik ma dostęp
    schedules = Schedule.query.filter_by(object_id=object_id).all()
    return jsonify([
        {
            'id': sched.id,
            'employeeName': sched.employee.name,
            'date': sched.date.strftime('%Y-%m-%d'),
            'shift': sched.shift
        }
        for sched in schedules
    ])
