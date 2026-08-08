"""
Validator Utility Module.
Handles validation of patient record values and structures.
"""

from datetime import datetime
from typing import Dict, Tuple, Any

from config import CLINICAL_CONTEXT_PARAMS


def validate_patient_record(row: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Validates a patient record represented as a dictionary.
    Returns (is_valid, error_message).
    """
    required_keys = [
        "PatientID", "Name", "Age", "Sex",
        "Year", "Month", "Day", "Hour", "Minute", "Second", "Glucose"
    ]
    
    # Check for missing keys
    for key in required_keys:
        if key not in row or row[key] is None or str(row[key]).strip() == "":
            return False, f"Missing value for field: {key}"

    # Validate Name is not empty
    name = str(row["Name"]).strip()
    if not name:
        return False, "Name cannot be empty."

    # Validate Sex
    sex = str(row["Sex"]).strip().upper()
    if sex not in ["M", "F"]:
        return False, f"Invalid Sex: '{sex}'. Must be 'M' or 'F'."

    # Validate Numeric Fields
    try:
        patient_id = int(row["PatientID"])
        age = int(row["Age"])
        year = int(row["Year"])
        month = int(row["Month"])
        day = int(row["Day"])
        hour = int(row["Hour"])
        minute = int(row["Minute"])
        second = int(row["Second"])
        glucose = int(row["Glucose"])
    except ValueError:
        return False, "One or more numeric fields could not be parsed as integers."

    if patient_id < 0:
        return False, "PatientID cannot be negative."
        
    if age <= 0 or age > 120:
        return False, f"Invalid Age: {age}. Must be between 1 and 120."

    if glucose <= 0:
        return False, f"Invalid Glucose: {glucose}. Must be greater than 0."

    # Validate Date and Time boundaries and logic (e.g. leap years, correct days in month)
    try:
        # datetime will raise ValueError if date/time components are invalid
        datetime(
            year=year,
            month=month,
            day=day,
            hour=hour,
            minute=minute,
            second=second
        )
    except ValueError as e:
        return False, f"Invalid Date/Time: {e}"

    # Validate and normalize clinical contextual parameters if present
    for param in CLINICAL_CONTEXT_PARAMS:
        col = param["csv_column"]
        if col in row:
            val = row[col]
            if val is None or str(val).strip() == "":
                return False, f"Missing value for field: {col}"
            
            val_str = str(val).strip()
            val_upper = val_str.upper()
            if val_upper not in param["accepted_values"]:
                return False, f"Invalid value for {col}: '{val_str}'. Must be one of {', '.join(param['accepted_values'])}."
            
            # Normalize internally to uppercase in the row dict
            row[col] = val_upper

    return True, ""

