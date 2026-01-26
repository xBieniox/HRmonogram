from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import Object, Department, User

bp = Blueprint('objects', __name__)

# --- OBIEKTY ---

@bp.route('/objects', methods=['GET'])
@jwt_required()
def get_objects():
    objects = Object.query.all()
    return jsonify([{'id': obj.id, 'name': obj.name, 'location': obj.location} for obj in objects])

# W pliku backend/app/routes/objects.py

@bp.route('/objects', methods=['POST'])
@jwt_required()
def create_object():
    data = request.json
    name = data.get('name')
    location = data.get('location')

    if not name:
        return jsonify(message="Nazwa obiektu jest wymagana"), 400

    # === NOWE ZABEZPIECZENIE: Sprawdzamy czy nazwa jest zajęta ===
    existing_object = Object.query.filter_by(name=name).first()
    
    if existing_object:
        # Kod 409 oznacza Conflict (konflikt danych)
        return jsonify(message=f"Obiekt o nazwie '{name}' już istnieje! Wybierz inną nazwę."), 409
    # =============================================================

    new_object = Object(name=name, location=location)
    
    try:
        db.session.add(new_object)
        db.session.commit()
        return jsonify({'message': 'Object created successfully', 'id': new_object.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify(message=f"Błąd serwera: {str(e)}"), 500

@bp.route('/objects/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_object(id):
    obj = Object.query.get_or_404(id)
    db.session.delete(obj)
    db.session.commit()
    return jsonify({'message': 'Object deleted successfully'}), 200

# --- TO JEST KLUCZOWY ENDPOINT DLA KREATORA GRAFIKU ---
@bp.route('/objects/<int:object_id>/employees', methods=['GET'])
@jwt_required()
def get_employees_for_object(object_id):
    users = User.query.filter_by(object_id=object_id).all()
    return jsonify([
        {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'department_id': user.department_id,
            # --- DODANO TO POLE ---
            # Dzięki temu frontend wie, że to "Kuchnia", a nie "Dział nr 1"
            'department': user.department.name if user.department else "Pozostali"
        }
        for user in users
    ])

@bp.route('/objects', methods=['GET'])
@jwt_required()
def get_objects_list():
    objects = Object.query.all()
    return jsonify([
        {'id': obj.id, 'name': obj.name}
        for obj in objects
    ])


# --- DEPARTAMENTY ---

@bp.route('/objects/<int:object_id>/departments', methods=['GET'])
@jwt_required()
def get_departments_for_object(object_id):
    departments = Department.query.filter_by(object_id=object_id).all()
    return jsonify([
        {'id': dep.id, 'name': dep.name, 'object_id': dep.object_id}
        for dep in departments
    ])

@bp.route('/objects/<int:object_id>/departments', methods=['POST'])
@jwt_required()
def create_department_for_object(object_id):
    data = request.json
    name = data.get('name')
    
    if not name:
        return jsonify(message="Nazwa departamentu jest wymagana"), 400

    # 1. Sprawdzamy, czy departament o tej nazwie istnieje W TYM KONKRETNYM OBIEKCIE
    existing_dept = Department.query.filter_by(object_id=object_id, name=name).first()
    
    if existing_dept:
        # Jeśli tak -> Błąd 409 (Conflict)
        return jsonify(message=f"Departament '{name}' już istnieje w tym obiekcie!"), 409

    # 2. Jeśli nie -> Tworzymy (nawet jak inny obiekt ma taką samą nazwę)
    new_department = Department(name=name, object_id=object_id)
    
    try:
        db.session.add(new_department)
        db.session.commit()
        return jsonify({'message': 'Department created successfully', 'id': new_department.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify(message=f"Błąd bazy danych: {str(e)}"), 500

@bp.route('/departments/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_department(id):
    dep = Department.query.get_or_404(id)
    db.session.delete(dep)
    db.session.commit()
    return jsonify({'message': 'Department deleted successfully'}), 200

@bp.route('/departments', methods=['GET'])
@jwt_required()
def get_departments():
    departments = Department.query.all()
    return jsonify([
        {'id': dep.id, 'name': dep.name}
        for dep in departments
    ])

@bp.route('/objects/<int:object_id>/departments/<int:department_id>/employees', methods=['GET'])
@jwt_required()
def get_employees_for_department(object_id, department_id):
    users = User.query.filter_by(object_id=object_id, department_id=department_id).all()
    return jsonify([
        {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            # Tutaj też warto dodać nazwę, dla spójności
            'department': user.department.name if user.department else "Pozostali"
        }
        for user in users
    ])