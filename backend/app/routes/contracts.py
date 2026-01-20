from flask import Blueprint, request, jsonify
from app import db, bcrypt
from app.models import Contract
bp = Blueprint('contracts', __name__)

@bp.route('/contracts', methods=['GET'])
def get_contracts():
    contracts = Contract.query.all()
    return jsonify([
        {'id': contract.id, 'name': contract.name}
        for contract in contracts
    ])
