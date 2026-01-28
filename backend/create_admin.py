from app import app, db
from app.models import User
from werkzeug.security import generate_password_hash

with app.app_context():
  
    email = "admin@hr.pl"
    password = "123"  
    name = "Administrator"
    role = "admin"

  
    if User.query.filter_by(email=email).first():
        print(f"Użytkownik {email} już istnieje!")
    else:
      
        hashed_pw = generate_password_hash(password)
        
        new_admin = User(
            email=email,
            password_hash=hashed_pw,
            name=name,
            role=role,
            must_change_password=False, 
            object_id=None, 
            department_id=None
        )
        
        db.session.add(new_admin)
        db.session.commit()
        print(f"Sukces! Utworzono konto: {email} / hasło: {password}")