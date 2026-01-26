from flask import Blueprint, request, jsonify
from app import db, bcrypt
from app.models import User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta

bp = Blueprint('auth', __name__)

@bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()

    if user and bcrypt.check_password_hash(user.password_hash, data.get('password')):
        # Generujemy token
        access_token = create_access_token(
            identity={'id': user.id, 'role': user.role},
            expires_delta=timedelta(hours=1)
        )
        
        # POPRAWKA: Zwracamy 'token' (tak jak oczekuje frontend), a nie 'access_token'
        return jsonify({
            'token': access_token,
            'role': user.role,
            'must_change_password': user.must_change_password
        }), 200

    return jsonify(message='Invalid email or password'), 401

# --- Endpoint do STANDARDOWEJ zmiany hasła (np. z profilu) ---
# Wymaga podania starego hasła
@bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    current_identity = get_jwt_identity()
    # Obsługa identity jako słownika lub ID
    user_id = current_identity.get('id') if isinstance(current_identity, dict) else current_identity
    
    data = request.json
    user = User.query.get(user_id)

    if not user or not bcrypt.check_password_hash(user.password_hash, data.get('current_password')):
        return jsonify(message='Invalid current password'), 401

    new_password = bcrypt.generate_password_hash(data.get('new_password')).decode('utf-8')
    user.password_hash = new_password
    db.session.commit()

    return jsonify(message='Password changed successfully'), 200

# --- NOWY ENDPOINT DO PIERWSZEJ ZMIANY HASŁA ---
# Nie wymaga starego hasła (bo wymuszamy zmianę po zalogowaniu)
@bp.route('/first-password-change', methods=['POST'])
@jwt_required()
def first_password_change():
    current_identity = get_jwt_identity()
    user_id = current_identity.get('id') if isinstance(current_identity, dict) else current_identity
    
    data = request.json
    user = User.query.get(user_id)
    
    if not user:
        return jsonify(message="User not found"), 404

    new_pass = data.get('new_password')
    if not new_pass or len(new_pass) < 6:
        return jsonify(message="Hasło musi mieć minimum 6 znaków"), 400

    # Ustawiamy nowe hasło i zdejmujemy flagę
    user.password_hash = bcrypt.generate_password_hash(new_pass).decode('utf-8')
    user.must_change_password = False 
    db.session.commit()

    return jsonify(message='Password changed successfully'), 200