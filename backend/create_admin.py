from app import app, db
from app.models import User
from werkzeug.security import generate_password_hash

with app.app_context():
    # Dane dla konta admina
    email = "admin@hr.pl"
    password = "123"  # Tu wpisz swoje hasło
    name = "Administrator"
    role = "admin"

    # Sprawdź czy taki user już istnieje
    if User.query.filter_by(email=email).first():
        print(f"Użytkownik {email} już istnieje!")
    else:
        # Tworzenie użytkownika
        # UWAGA: Zakładam, że używasz generate_password_hash. 
        # Jeśli masz metodę w modelu np. set_password, użyj jej.
        hashed_pw = generate_password_hash(password)
        
        new_admin = User(
            email=email,
            password_hash=hashed_pw,
            name=name,
            role=role,
            must_change_password=False, # Admin nie musi zmieniać hasła przy pierwszym logowaniu
            object_id=None, # Admin może nie być przypisany do obiektu
            department_id=None
        )
        
        db.session.add(new_admin)
        db.session.commit()
        print(f"Sukces! Utworzono konto: {email} / hasło: {password}")