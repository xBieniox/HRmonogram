from flask import Blueprint, request, jsonify
from app import db
from app.models import Object, Department, User

bp = Blueprint('objects', __name__)

# Obiekty
@bp.route('/objects', methods=['GET'])
def get_objects():
    objects = Object.query.all()
    return jsonify([{'id': obj.id, 'name': obj.name, 'location': obj.location} for obj in objects])

@bp.route('/objects', methods=['POST'])
def create_object():
    data = request.json
    new_object = Object(name=data['name'], location=data.get('location'))
    db.session.add(new_object)
    db.session.commit()
    return jsonify({'message': 'Object created successfully'}), 201

@bp.route('/objects/<int:id>', methods=['DELETE'])
def delete_object(id):
    obj = Object.query.get_or_404(id)
    db.session.delete(obj)
    db.session.commit()
    return jsonify({'message': 'Object deleted successfully'}), 200

@bp.route('/objects/<int:object_id>/employees', methods=['GET'])
def get_employees_for_object(object_id):
    users = User.query.filter_by(object_id=object_id).all()
    return jsonify([
        {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'department_id': user.department_id
        }
        for user in users
    ])

@bp.route('/objects', methods=['GET'])
def get_objects_list():
    objects = Object.query.all()
    return jsonify([
        {'id': obj.id, 'name': obj.name}
        for obj in objects
    ])




@bp.route('/objects/<int:object_id>/departments', methods=['GET'])
def get_departments_for_object(object_id):
    departments = Department.query.filter_by(object_id=object_id).all()
    return jsonify([
        {'id': dep.id, 'name': dep.name, 'object_id': dep.object_id}
        for dep in departments
    ])

@bp.route('/objects/<int:object_id>/departments', methods=['POST'])
def create_department_for_object(object_id):
    data = request.json
    new_department = Department(name=data['name'], object_id=object_id)
    db.session.add(new_department)
    db.session.commit()
    return jsonify({'message': 'Department created successfully'}), 201

@bp.route('/departments/<int:id>', methods=['DELETE'])
def delete_department(id):
    dep = Department.query.get_or_404(id)
    db.session.delete(dep)
    db.session.commit()
    return jsonify({'message': 'Department deleted successfully'}), 200

@bp.route('/departments', methods=['GET'])
def get_departments():
    departments = Department.query.all()
    return jsonify([
        {'id': dep.id, 'name': dep.name}
        for dep in departments
    ])



@bp.route('/objects/<int:object_id>/departments/<int:department_id>/employees', methods=['GET'])
def get_employees_for_department(object_id, department_id):
    users = User.query.filter_by(object_id=object_id, department_id=department_id).all()
    return jsonify([
        {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role
        }
        for user in users
    ])
