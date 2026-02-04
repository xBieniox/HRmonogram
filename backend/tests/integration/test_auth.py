from app.models import User, db

def test_login_successful(client):
    """
    Test sprawdza endpoint /auth/login dla poprawnego użytkownika.
    """
   
    user = User(email="admin@hr.pl", name="Admin", role="admin")
    user.set_password("admin123")
    db.session.add(user)
    db.session.commit()

   
    response = client.post('/auth/login', json={
        'email': 'admin@hr.pl',
        'password': 'admin123'
    })

 
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data  
    assert data['role'] == 'admin'
    
def test_access_denied_without_token(client):
    """
    Test sprawdza, czy próba pobrania listy pracowników bez logowania
    kończy się błędem 401.
    """
    # Próba dostępu do chronionego endpointu bez nagłówka Authorization
    response = client.get('/users/employees')
    
    assert response.status_code == 401  # Unauthorized