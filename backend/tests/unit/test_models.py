from app.models import User

def test_new_user_password_hashing():
    """
    Test sprawdza, czy ustawienie hasła generuje hash 
    i czy weryfikacja działa poprawnie.
    """
    
    user = User(email="test@hrmonogram.pl", name="Jan Testowy")
    
   
    user.set_password("TajneHaslo123")
    
    
    assert user.password_hash is not None
    assert user.password_hash != "TajneHaslo123"  
    assert user.check_password("TajneHaslo123") is True
    assert user.check_password("ZleHaslo") is False