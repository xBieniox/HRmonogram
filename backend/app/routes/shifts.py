from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import ShiftTemplate

bp = Blueprint('shifts', __name__)

# Pobranie wszystkich skrótów zmian dla danego obiektu
@bp.route('/shifts/<int:object_id>', methods=['GET'])
@jwt_required()
def get_shifts(object_id):
    shifts = ShiftTemplate.query.filter_by(object_id=object_id).all()
    return jsonify([
        {'id': shift.id, 'abbreviation': shift.abbreviation, 'start_time': shift.start_time, 'end_time': shift.end_time}
        for shift in shifts
    ])

# Dodanie nowego skrótu zmiany
@bp.route('/shifts', methods=['POST'])
@jwt_required()
def add_shift():
    data = request.json

    print("Received data:", data)  # 👈 Dodajemy logowanie

    # Sprawdzenie czy wszystkie wymagane dane są przesłane
    if not all(k in data for k in ['object_id', 'abbreviation', 'start_time', 'end_time']):
        print("Error: Missing required fields")  # 👈 Logowanie błędu
        return jsonify(message="Missing required fields"), 400

    try:
        shift = ShiftTemplate(
            object_id=data['object_id'],
            abbreviation=data['abbreviation'],
            start_time=data['start_time'],
            end_time=data['end_time']
        )
        db.session.add(shift)
        db.session.commit()

        print(f"Shift added successfully: {shift.abbreviation} ({shift.start_time} - {shift.end_time})")  # 👈 Log sukcesu

        return jsonify(message="Shift template added successfully", shift_id=shift.id), 201

    except Exception as e:
        print("Error adding shift:", str(e))  # 👈 Logowanie błędu
        return jsonify(message="Error adding shift", error=str(e)), 500



# Aktualizacja skrótu zmiany
@bp.route('/shifts/<int:shift_id>', methods=['PUT'])
@jwt_required()
def update_shift(shift_id):
    data = request.json
    shift = ShiftTemplate.query.get_or_404(shift_id)
    shift.abbreviation = data.get('abbreviation', shift.abbreviation)
    shift.start_time = data.get('start_time', shift.start_time)
    shift.end_time = data.get('end_time', shift.end_time)
    
    db.session.commit()
    return jsonify(message="Shift template updated successfully")


# Usunięcie skrótu zmiany
@bp.route('/shifts/<int:shift_id>', methods=['DELETE'])
@jwt_required()
def delete_shift(shift_id):
    shift = ShiftTemplate.query.get_or_404(shift_id)
    db.session.delete(shift)
    db.session.commit()
    return jsonify(message="Shift template deleted successfully")

