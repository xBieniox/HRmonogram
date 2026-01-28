from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS





app = Flask(__name__)

CORS(app)  # Dodanie obsługi CORS dla całej aplikacji
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///C:/HRmonogram/database/HRmonogram.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key'  # Zmień na bezpieczny klucz w produkcji

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Rejestracja blueprintów (routów)
from app.routes import auth, users, objects, contracts, schedules, shifts, stats
app.register_blueprint(auth.bp)
app.register_blueprint(users.bp)
app.register_blueprint(objects.bp)
app.register_blueprint(contracts.bp)
app.register_blueprint(schedules.bp)
app.register_blueprint(shifts.bp)
app.register_blueprint(stats.bp)