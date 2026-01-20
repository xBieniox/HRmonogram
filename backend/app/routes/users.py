from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, bcrypt
from app.models import User, Contract
import string
import random

bp = Blueprint('users', __name__)

def generate_password(length=12):
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for _ in range(length))

# Tworzenie użytkownika
@bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    current_user = get_jwt_identity()
    if current_user['role'] != 'admin':
        return jsonify(message='Access denied'), 403

    data = request.json
    password = data.get('password') or generate_password()  # Generowanie hasła, jeśli brak
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Sprawdzenie poprawności kontraktu
    contract = None
    if data.get('contract_type'):
        contract = Contract.query.filter_by(name=data['contract_type']).first()
        if not contract:
            return jsonify(message="Invalid contract type"), 400

    new_user = User(
        email=data['email'],
        password_hash=hashed_password,
        name=data['name'],
        role=data['role'],
        object_id=data.get('object_id', None),  # Domyślnie None, jeśli brak
        department_id=data.get('department_id', None),  # Domyślnie None, jeśli brak
        contract_id=contract.id if contract else None,  # Ustawienie contract_id
        must_change_password=True  # Wymuszenie zmiany hasła
    )

    db.session.add(new_user)
    db.session.commit()
    return jsonify(message='User created successfully', password=password), 201

# Pobieranie szczegółowych danych użytkownika
@bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    contract = Contract.query.get(user.contract_id) if user.contract_id else None
    return jsonify({
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'role': user.role,
        'object_id': user.object_id,
        'department_id': user.department_id,
        'contract_type': contract.name if contract else None
    })

# Aktualizacja danych użytkownika
@bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    data = request.json
    user = User.query.get_or_404(user_id)

    user.name = data.get('name', user.name)
    user.email = data.get('email', user.email)
    user.object_id = data.get('object_id', user.object_id)
    user.department_id = data.get('department_id', user.department_id)

    # Sprawdzenie i ustawienie typu umowy
    if 'contract_type' in data and data['contract_type']:
        contract = Contract.query.filter_by(name=data['contract_type']).first()
        if contract:
            user.contract_id = contract.id
        else:
            return jsonify(message="Invalid contract type"), 400
    else:
        user.contract_id = None  # Jeśli brak typu umowy, ustaw na None

    db.session.commit()
    return jsonify(message='User updated successfully')

# Resetowanie hasła użytkownika
@bp.route('/users/<int:user_id>/reset-password', methods=['POST'])
@jwt_required()
def reset_password(user_id):
    user = User.query.get_or_404(user_id)
    new_password = generate_password()
    user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')

    db.session.commit()
    return jsonify(message='Password reset successfully', new_password=new_password)

# Pobieranie listy pracowników
@bp.route('/employees', methods=['GET'])
@jwt_required()
def get_employees():
    current_user = get_jwt_identity()
    if current_user['role'] not in ['admin', 'global_hr']:
        return jsonify(message='Access denied'), 403

    # Parametry filtrowania i sortowania
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    no_object = request.args.get('no_object', type=lambda x: x.lower() == 'true')
    no_department = request.args.get('no_department', type=lambda x: x.lower() == 'true')
    sort_by = request.args.get('sort_by', 'name')
    search = request.args.get('search', '')

    # Tworzenie zapytania
    query = User.query

    if no_object:
        query = query.filter(User.object_id.is_(None))
    if no_department:
        query = query.filter(User.department_id.is_(None))
    if search:
        query = query.filter(User.name.ilike(f"%{search}%"))

    # Sortowanie
    if sort_by == 'object':
        query = query.order_by(User.object_id)
    elif sort_by == 'department':
        query = query.order_by(User.department_id)
    else:
        query = query.order_by(User.name)

    # Paginacja
    employees = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'employees': [
            {
                'id': emp.id,
                'name': emp.name,
                'email': emp.email,
                'role': emp.role,
                'object_id': emp.object_id,
                'department_id': emp.department_id,
                'contract_type': Contract.query.get(emp.contract_id).name if emp.contract_id else None
            } for emp in employees.items
        ],
        'total': employees.total,
        'page': employees.page,
        'pages': employees.pages
    })
