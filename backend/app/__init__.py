import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()


app = Flask(__name__)

CORS(app)  
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')  # Zmień na bezpieczny klucz w produkcji

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Rejestracja blueprintów 
from app.routes import auth, users, objects, schedules, stats
app.register_blueprint(auth.bp)
app.register_blueprint(users.bp)
app.register_blueprint(objects.bp)
app.register_blueprint(schedules.bp)
app.register_blueprint(stats.bp)