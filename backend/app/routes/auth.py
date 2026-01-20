from flask import Blueprint, request, jsonify
from app import db, bcrypt
from app.models import User
from flask_jwt_extended import create_access_token
from datetime import timedelta
from flask_jwt_extended import jwt_required, get_jwt_identity
bp = Blueprint('auth', __name__)

@bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data.get('email')).first()

    if user and bcrypt.check_password_hash(user.password_hash, data.get('password')):
        access_token = create_access_token(
            identity={'id': user.id, 'role': user.role},
            expires_delta=timedelta(hours=1)
        )
        return jsonify(
            access_token=access_token,
            must_change_password=user.must_change_password
        ), 200

    return jsonify(message='Invalid email or password'), 401

@bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    current_user = get_jwt_identity()
    data = request.json
    user = User.query.get(current_user['id'])

    if not user or not bcrypt.check_password_hash(user.password_hash, data.get('current_password')):
        return jsonify(message='Invalid current password'), 401

    new_password = bcrypt.generate_password_hash(data.get('new_password')).decode('utf-8')
    user.password_hash = new_password
    user.must_change_password = False  # Wyłączenie wymuszenia zmiany hasła
    db.session.commit()

    return jsonify(message='Password changed successfully'), 200
