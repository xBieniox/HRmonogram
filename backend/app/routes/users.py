from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, bcrypt
from app.models import User, Contract, Department, Object
import string
import random

bp = Blueprint('users', __name__)

# --- FUNKCJE POMOCNICZE ---

def generate_password(length=12):
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for _ in range(length))

def get_current_user_from_token():
    """Pomocnicza funkcja do bezpiecznego pobierania usera z bazy na podstawie tokena"""
    current_identity = get_jwt_identity()
    user_id = None
    
    if isinstance(current_identity, dict):
        user_id = current_identity.get('id')
    elif isinstance(current_identity, int):
        user_id = current_identity
    elif isinstance(current_identity, str):
        # Fallback jeśli token przechowuje email
        u = User.query.filter_by(email=current_identity).first()
        if u: user_id = u.id

    if user_id:
        return User.query.get(user_id)
    return None

# --- ENDPOINTY ---

# 1. TWORZENIE UŻYTKOWNIKA
@bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    requester = get_current_user_from_token()
    if not requester:
        return jsonify(message='User not found'), 404

    # ZABEZPIECZENIE: Local HR nie może tworzyć pracowników
    if requester.role not in ['admin', 'global_hr']:
        return jsonify(message='Brak uprawnień do tworzenia użytkowników'), 403

    data = request.json
    
    # Walidacja danych
    if not data.get('email') or not data.get('name'):
        return jsonify(message='Brak wymaganych danych'), 400

    # ZABEZPIECZENIE: Sprawdzenie czy email już istnieje
    if User.query.filter_by(email=data['email']).first():
        return jsonify(message=f"Adres email '{data['email']}' jest już zajęty!"), 409

    password = data.get('password') or generate_password()
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Obsługa kontraktu
    contract_id = None
    if data.get('contract_type'):
        contract = Contract.query.filter_by(name=data['contract_type']).first()
        if contract:
            contract_id = contract.id
        # Opcjonalnie: można tu dodać auto-tworzenie kontraktu, jeśli nie istnieje

    new_user = User(
        email=data['email'],
        password_hash=hashed_password,
        name=data['name'],
        role=data.get('role', 'employee'),
        object_id=data.get('object_id'),
        department_id=data.get('department_id'),
        contract_id=contract_id,
        must_change_password=True  # Wymuszamy zmianę hasła przy 1. logowaniu
    )

    db.session.add(new_user)
    db.session.commit()
    return jsonify(message='User created successfully', password=password), 201


# 2. POBIERANIE SZCZEGÓŁÓW UŻYTKOWNIKA
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


# 3. AKTUALIZACJA DANYCH UŻYTKOWNIKA
@bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    requester = get_current_user_from_token()
    if not requester:
        return jsonify(message='User not found'), 404

    # ZABEZPIECZENIE: Local HR nie może edytować
    if requester.role not in ['admin', 'global_hr']:
        return jsonify(message='Brak uprawnień do edycji użytkowników'), 403

    user = User.query.get_or_404(user_id)
    data = request.json

    # Aktualizacja podstawowych pól
    if 'name' in data:
        user.name = data['name']
    
    if 'role' in data:
        user.role = data['role']

    # ZABEZPIECZENIE: Walidacja zmiany emaila
    if 'email' in data:
        new_email = data['email']
        # Sprawdzamy duplikat tylko jeśli email faktycznie się zmienia
        if new_email != user.email:
            duplicate = User.query.filter_by(email=new_email).first()
            if duplicate:
                return jsonify(message=f"Adres email '{new_email}' jest już zajęty przez innego użytkownika!"), 409
            user.email = new_email

    # Aktualizacja przypisań
    if 'object_id' in data:
        user.object_id = data['object_id']
    
    if 'department_id' in data:
        user.department_id = data['department_id']

    # Aktualizacja kontraktu
    if 'contract_type' in data:
        if data['contract_type']:
            contract = Contract.query.filter_by(name=data['contract_type']).first()
            if contract:
                user.contract_id = contract.id
            else:
                # Opcjonalnie: można tu dodać logikę tworzenia kontraktu w locie
                pass 
        else:
            user.contract_id = None

    db.session.commit()
    return jsonify(message='User updated successfully')


# 4. USUWANIE UŻYTKOWNIKA
@bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    requester = get_current_user_from_token()
    
    if not requester:
        return jsonify(message='User not found'), 404

    # ZABEZPIECZENIE: Tylko Admin i Global HR mogą usuwać
    if requester.role not in ['admin', 'global_hr']:
        return jsonify(message='Brak uprawnień do usuwania użytkowników'), 403

    user = User.query.get_or_404(user_id)
    
    # Zabezpieczenie przed usunięciem samego siebie
    if user.id == requester.id:
        return jsonify(message='Nie możesz usunąć swojego konta'), 400

    db.session.delete(user)
    db.session.commit()
    return jsonify(message='User deleted successfully'), 200


# 5. RESETOWANIE HASŁA (Admin Action)
@bp.route('/users/<int:user_id>/reset-password', methods=['POST'])
@jwt_required()
def reset_password(user_id):
    # 1. Sprawdzamy, kto pyta (Admin/Global HR)
    requester = get_current_user_from_token()
    if not requester or requester.role not in ['admin', 'global_hr']:
        return jsonify(message='Access denied'), 403

    user = User.query.get_or_404(user_id)
    
    # 2. Generujemy nowe hasło
    new_password = generate_password()
    user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    
    # 3. KLUCZOWA ZMIANA: Wymuszamy zmianę hasła przy kolejnym logowaniu
    user.must_change_password = True

    db.session.commit()
    
    # Zwracamy hasło jawne, aby admin mógł je przekazać
    return jsonify(message='Password reset successfully', new_password=new_password)


# 6. LISTA PRACOWNIKÓW (Z filtrowaniem)
@bp.route('/employees', methods=['GET'])
@jwt_required()
def get_employees():
    requester = get_current_user_from_token()
    
    if not requester:
        return jsonify(message='Unauthorized'), 401

    # Parametry filtrowania i sortowania
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    no_object = request.args.get('no_object', type=lambda x: x.lower() == 'true')
    no_department = request.args.get('no_department', type=lambda x: x.lower() == 'true')
    sort_by = request.args.get('sort_by', 'name')
    search = request.args.get('search', '')

    # Tworzenie zapytania podstawowego
    query = User.query

    # --- LOGIKA UPRAWNIEŃ LOCAL HR ---
    if requester.role == 'local_hr':
        # Jeśli Local HR nie ma przypisanego obiektu, widzi pustą listę
        if not requester.object_id:
            return jsonify({'employees': [], 'total': 0, 'page': 1, 'pages': 0})
        
        # Filtrujemy tylko pracowników z tego samego obiektu
        query = query.filter(User.object_id == requester.object_id)
    
    # (Admin i Global HR widzą wszystkich, więc nie dodajemy filtra)
    # ---------------------------------

    # Dalsze filtry
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
                'object_name': emp.object.name if emp.object else "Brak",
                'department_id': emp.department_id,
                'department_name': emp.department.name if emp.department else "Brak",
                'contract_type': Contract.query.get(emp.contract_id).name if emp.contract_id else None
            } for emp in employees.items
        ],
        'total': employees.total,
        'page': employees.page,
        'pages': employees.pages
    })