from app.routes.labor_code_validator import LaborCodeValidator
from datetime import date

def test_daily_rest_violation():
    """
    Test sprawdza naruszenie odpoczynku dobowego.
    Używa metody validate_shift, która obsługuje stringi godzinowe.
    """
    # Scenariusz:
    # Dzień 1: Praca 14:00 - 22:00
    prev_date = date(2023, 10, 1)
    prev_shift = "14:00-22:00"

    # Dzień 2: Praca 06:00 - 14:00
    # Przerwa między 22:00 a 06:00 wynosi 8 godzin (wymagane 11h)
    curr_date = date(2023, 10, 2)
    curr_shift = "06:00-14:00"

   
    violations = LaborCodeValidator.validate_shift(
        current_shift=curr_shift, 
        current_date=curr_date, 
        prev_shift=prev_shift, 
        prev_date=prev_date
    )
    
  
    assert len(violations) > 0
    assert "Naruszenie odpoczynku dobowego" in violations[0]

def test_valid_schedule():
    """Test sprawdza poprawny grafik (brak błędów)."""
    prev_date = date(2023, 10, 1)
    prev_shift = "08:00-16:00"

    curr_date = date(2023, 10, 2)
    curr_shift = "08:00-16:00"

    violations = LaborCodeValidator.validate_shift(
        curr_shift, curr_date, prev_shift, prev_date
    )

    assert len(violations) == 0