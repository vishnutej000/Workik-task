 ```python
import pytest

def test_calculate_total():
    items = [
        {"price": 10, "quantity": 2},
        {"price": 20, "quantity": None},
        {"price": 0, "quantity": 3},
    ]
    assert calculate_total(items) == 60

def test_validate_email():
    assert validate_email("user@example.com") is True
    assert validate_email("user@example..com") is False
    assert validate_email("user@example.c") is False
    assert validate_email("user@-example.com") is False
    assert validate_email("user@example.com (spam)") is False

def test_calculate_total_with_empty_list():
    assert calculate_total([]) == 0

def test_validate_email_with_invalid_email():
    assert validate_email("invalid_email") is False
    assert validate_email(1234567890) is False
    assert validate_email("user@example.com.example") is False
    assert validate_email("user@example.com.example.example") is False
```