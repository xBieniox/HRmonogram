from app.routes.labor_code_validator import LaborCodeValidator
from datetime import datetime, timedelta

def test_daily_rest_violation():
    """
    Test sprawdza, czy algorytm wykrywa brak 11h przerwy między zmianami.
    """
    
    shift_1_end = datetime(2023, 10, 1, 22, 0, 0)
    shift_2_start = datetime(2023, 10, 2, 6, 0, 0)
    
    
    is_valid, error_msg = LaborCodeValidator.check_daily_rest(shift_1_end, shift_2_start)
    
    
    assert is_valid is False
    assert "Naruszenie odpoczynku dobowego" in error_msg