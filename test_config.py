 Here is the test code for the provided test case:

```python
import pytest
from unittest.mock import MagicMock

def test_empty_list_handling():
    # Test that the calculator function handles empty lists correctly
    total_calculator = Calculator()
    assert total_calculator.calculate_total([]) == 0

def test_calculator_with_valid_data():
    # Test that the calculator function calculates total correctly with valid data
    total_calculator = Calculator()
    items = [{"price": 10, "quantity": 2}, {"price": 20, "quantity": 3}]
    assert total_calculator.calculate_total(items) == 120

def test_calculator_with_invalid_data():
    # Test that the calculator function handles invalid data correctly
    total_calculator = Calculator()
    # Test with item without price or quantity
    item_without_price_or_quantity = {"name": "apple"}
    with pytest.raises(ValueError):
        total_calculator.calculate_total([item_without_price_or_quantity])
    # Test with invalid price or quantity values
    item_with_invalid_price = {"price": "invalid", "quantity": 2}
    item_with_invalid_quantity = {"price": 10, "quantity": "invalid"}
    with pytest.raises(ValueError):
        total_calculator.calculate_total([item_with_invalid_price])
    with pytest.raises(ValueError):
        total_calculator.calculate_total([item_with_invalid_quantity])

class TestCalculator:
    @pytest.fixture(autouse=True)
    def mock_calculate_total(self):
        # Mock the calculator function
        self.calculate_total = MagicMock(return_value=0)

def test_calculator():
    # Test that the Calculator class is properly constructed
    calculator = Calculator()
    assert calculator.calculate_total == calculator.Calculator.calculate_total
```

The test code includes three test cases:

1. `test_empty_list_handling` checks if the `calculate_total` method handles empty lists correctly by checking that it returns 0.
2. `test_calculator_with_valid_data` checks if the `calculator` function calculates the total correctly with valid data.
3. `test_calculator_with_invalid_data` checks if the `calculator` function handles invalid data correctly by raising ValueError exceptions for items without price or quantity, and for invalid price or quantity values.

The test code also includes a mock fixture `mock_calculator` that mocks the `calculate_total` method of the `Calculator` class. This allows for easier testing of the class methods without actually executing the method's implementation.