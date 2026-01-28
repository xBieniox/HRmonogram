from app import db
import json

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    
    # Klucze obce
    object_id = db.Column(db.Integer, db.ForeignKey('objects.id'), nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    contract_id = db.Column(db.Integer, db.ForeignKey('contracts.id'), nullable=True)
    
    must_change_password = db.Column(db.Boolean, default=True)

    # Relacje
    object = db.relationship('Object', backref=db.backref('users', lazy=True))
    department = db.relationship('Department', backref=db.backref('users', lazy=True))
    contract = db.relationship('Contract', backref=db.backref('users', lazy=True))

class Object(db.Model):
    __tablename__ = 'objects'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    location = db.Column(db.String(120), nullable=True)

class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False) 
    object_id = db.Column(db.Integer, db.ForeignKey('objects.id'), nullable=False)
    object = db.relationship('Object', backref=db.backref('departments', lazy=True))

class Contract(db.Model):
    __tablename__ = 'contracts'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

class ShiftPreference(db.Model):
    __tablename__ = 'shift_preferences'
    id = db.Column(db.Integer, primary_key=True)
    object_id = db.Column(db.Integer, db.ForeignKey('objects.id'), nullable=False)
    
    work_days = db.Column(db.String, nullable=False, default=json.dumps(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]))
    schedule_type = db.Column(db.String, nullable=False, default="monthly")
    daily_hours_limit = db.Column(db.Integer, default=8)
    min_employees_per_shift = db.Column(db.Integer, default=1)
    holidays_included = db.Column(db.Boolean, default=False)

    def get_work_days(self):
        return json.loads(self.work_days)

    def set_work_days(self, days):
        self.work_days = json.dumps(days)

class ShiftTemplate(db.Model):
    __tablename__ = 'shift_templates'
    id = db.Column(db.Integer, primary_key=True)
    object_id = db.Column(db.Integer, db.ForeignKey('objects.id'), nullable=False)
    abbreviation = db.Column(db.String(10), nullable=False)
    start_time = db.Column(db.String(5), nullable=False)
    end_time = db.Column(db.String(5), nullable=False)
    object = db.relationship('Object', backref=db.backref('shift_templates', lazy=True))


class Schedule(db.Model):
    __tablename__ = 'schedules'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    object_id = db.Column(db.Integer, db.ForeignKey('objects.id'), nullable=True)
    
  
    work_schedule_id = db.Column(db.Integer, db.ForeignKey('work_schedules.id'), nullable=True)

    date = db.Column(db.Date, nullable=False)
    shift = db.Column(db.String(20), nullable=False)
    
    employee = db.relationship('User', backref=db.backref('schedules', lazy=True))
    object = db.relationship('Object', backref=db.backref('daily_shifts', lazy=True))



class WorkSchedule(db.Model):
    __tablename__ = 'work_schedules'
    id = db.Column(db.Integer, primary_key=True)
    
    title = db.Column(db.String(255), nullable=False)
    object_id = db.Column(db.Integer, db.ForeignKey('objects.id'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    shift_preference_id = db.Column(db.Integer, db.ForeignKey('shift_preferences.id'), nullable=False)
    
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

 
    is_published = db.Column(db.Boolean, default=False, nullable=False)
   

  
    object = db.relationship('Object', backref='saved_plans')
    shift_preference = db.relationship('ShiftPreference', backref='schedules', lazy='joined')
    
 
    shifts = db.relationship('Schedule', backref='parent_schedule', lazy=True, cascade="all, delete-orphan")
    snapshot_preferences = db.Column(db.Text, nullable=True) 
    snapshot_templates = db.Column(db.Text, nullable=True)
    
    def get_preferences(self):
        if self.snapshot_preferences:
            return json.loads(self.snapshot_preferences)
        return None

    def get_templates(self):
        if self.snapshot_templates:
            return json.loads(self.snapshot_templates)
        return []