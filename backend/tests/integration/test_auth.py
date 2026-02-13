from app.models import User, db
import pytest

def test_login_successful(client):
    """
    Test sprawdza, czy można się zalogować poprawnymi danymi.
    """

    user = User(email="admin@hr.pl", name="Admin", role="admin")
    user.set_password("admin123")
    db.session.add(user)
    db.session.commit()

   
    response = client.post('/login', json={
        'email': 'admin@hr.pl',
        'password': 'admin123'
    })

    assert response.status_code == 200, f"Błąd logowania! Kod: {response.status_code}"
    
    
    response_data = response.get_json()
    assert 'token' in response_data

def test_access_denied_without_token(client):
    """
    Test sprawdza, czy zasoby chronione są niedostępne bez tokena.
    """
    
    response = client.get('/employees') 
    
  
    assert response.status_code == 401, f"Oczekiwano 401, otrzymano {response.status_code}"