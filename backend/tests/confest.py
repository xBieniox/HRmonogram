import pytest
from app import create_app, db

@pytest.fixture
def client():
    
    app = create_app(config_name='testing')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all() 
            yield client     
            db.drop_all()    