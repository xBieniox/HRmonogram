from app import db
import json
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    object_id = db.Column(db.Integer, db.ForeignKey('objects.id'), nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    contract_id = db.Column(db.Integer, db.ForeignKey('contracts.id'), nullable=True)  # Relacja do tabeli contracts
    must_change_password = db.Column(db.Boolean, default=True)

    object = db.relationship('Object', backref=db.backref('users', lazy=True))
    department = db.relationship('Department', backref=db.backref('users', lazy=True))
    contract = db.relationship('Contract', backref=db.backref('users', lazy=True))  # Relacja z tabelą contracts


class Object(db.Model):
    __tablename__ = 'objects'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    location = db.Column(db.String(120), nullable=True)  # Opcjonalna lokalizacja


class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    object_id = db.Column(db.Integer, db.ForeignKey('objects.id'), nullable=False)
    object = db.relationship('Object', backref=db.backref('departments', lazy=True))


class Contract(db.Model):
    __tablename__ = 'contracts'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)  # Typ umowy

class Schedule(db.Model):
    __tablename__ = 'schedules'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    shift = db.Column(db.String(20), nullable=False)
    employee = db.relationship('User', backref=db.backref('schedules', lazy=True))

class ShiftPreference(db.Model):
    __tablename__ = 'shift_preferences'
    id = db.Column(db.Integer, primary_key=True)
    object_id = db.Column(db.Integer, db.ForeignKey('objects.id'), nullable=False)
    work_days = db.Column(db.String, nullable=False, default=json.dumps(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]))
    schedule_type = db.Column(db.String, nullable=False, default="weekly")
    default_shift_template_id = db.Column(db.Integer, db.ForeignKey('shift_templates.id'), nullable=True)
    max_hours_per_employee = db.Column(db.Integer, default=40)
    min_employees_per_shift = db.Column(db.Integer, default=1)
    holidays_included = db.Column(db.Boolean, default=False)

    # ✅ Funkcja do pobierania dni roboczych w postaci listy
    def get_work_days(self):
        return json.loads(self.work_days)

    # ✅ Funkcja do zapisywania listy dni roboczych jako JSON w bazie
    def set_work_days(self, days):
        self.work_days = json.dumps(days)

class ShiftTemplate(db.Model):
    __tablename__ = 'shift_templates'
    id = db.Column(db.Integer, primary_key=True)
    object_id = db.Column(db.Integer, db.ForeignKey('objects.id'), nullable=False)
    abbreviation = db.Column(db.String(10), nullable=False, unique=False)  # Skrót np. "N"
    start_time = db.Column(db.String(5), nullable=False)  # Format "HH:MM"
    end_time = db.Column(db.String(5), nullable=False)    # Format "HH:MM"

    object = db.relationship('Object', backref=db.backref('shift_templates', lazy=True))
    
class WorkSchedule(db.Model):
    __tablename__ = 'work_schedules'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    object_id = db.Column(db.Integer, db.ForeignKey('objects.id'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    start_date = db.Column(db.Date, nullable=False)
    shift_preference_id = db.Column(db.Integer, db.ForeignKey('shift_preferences.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    object = db.relationship('Object', backref='schedules')
    department = db.relationship('Department', backref='schedules')
    shift_preference = db.relationship('ShiftPreference', backref='schedules')
    creator = db.relationship('User', backref='created_schedules')
