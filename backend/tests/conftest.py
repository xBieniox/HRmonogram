import pytest
from app import app, db  

@pytest.fixture
def client():
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:", 
        "JWT_SECRET_KEY": "test-secret-key",             
        "WTF_CSRF_ENABLED": False
    })

    
    with app.test_client() as client:
        
        with app.app_context():
            db.create_all()    
            yield client      
            db.session.remove()
            db.drop_all()      
            
            
            