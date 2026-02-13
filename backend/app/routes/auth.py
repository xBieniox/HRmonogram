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
        access_token = create_access_token(
            identity={
                'id': user.id,
                'role': user.role,
                'object_id': user.object_id
            },
            expires_delta=timedelta(hours=1)
        )
        
        return jsonify({
            'token': access_token,
            'role': user.role,
            'must_change_password': user.must_change_password
        }), 200

    return jsonify(message='Niepoprawne hasło / adres Email'), 401

@bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    current_identity = get_jwt_identity()
    user_id = current_identity.get('id') if isinstance(current_identity, dict) else current_identity
    
    data = request.json
    user = User.query.get(user_id)

    if not user or not bcrypt.check_password_hash(user.password_hash, data.get('current_password')):
        return jsonify(message='Niepoprawne obecne hasło'), 401

    new_password = bcrypt.generate_password_hash(data.get('new_password')).decode('utf-8')
    user.password_hash = new_password
    db.session.commit()

    return jsonify(message='Hasło ustawione pomyślnie'), 200

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

    user.password_hash = bcrypt.generate_password_hash(new_pass).decode('utf-8')
    user.must_change_password = False 
    db.session.commit()

    return jsonify(message='Hasło ustawione pomyślnie'), 200