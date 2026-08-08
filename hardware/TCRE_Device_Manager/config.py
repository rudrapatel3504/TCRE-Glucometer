"""
TCRE Device Studio Configuration Module.
Stores application-wide constants, styling defaults, and data schemas.
"""

from typing import List, Dict, Any, Callable

# Application Identity
APP_NAME: str = "TCRE Device Studio"
APP_VERSION: str = "1.0.0"

# Serial Communication Defaults
DEFAULT_BAUDRATE: int = 115200
DEFAULT_TIMEOUT: float = 2.0  # seconds
AUTO_RESET_DELAY: float = 2.0  # seconds (Arduino Mega resets on connection)

# GUI Configuration
THEME_MODE: str = "dark"          # "dark", "light", "system"
COLOR_THEME: str = "blue"         # "blue", "green", "dark-blue"
WINDOW_SIZE: str = "1280x800"
MIN_WINDOW_SIZE: tuple[int, int] = (1024, 768)

# CSV Schema Definitions
CSV_HEADER: List[str] = [
    "PatientID",
    "Name",
    "Age",
    "Sex",
    "Year",
    "Month",
    "Day",
    "Hour",
    "Minute",
    "Second",
    "Glucose"
]

# Extensible clinical contextual parameters configuration
CLINICAL_CONTEXT_PARAMS: List[Dict[str, Any]] = [
    {
        "csv_column": "ConsumedSugarLast6Hours",
        "attr_name": "consumed_sugar_last_6_hours",
        "type": bool,
        "default": False,
        "accepted_values": ["YES", "NO"],
        "to_internal": lambda val: val.upper() == "YES",
        "to_display": lambda val: "YES" if val else "NO"
    }
]

# Hardware Constants
DEFAULT_MAX_CAPACITY: int = 107  # Default max record capacity for EEPROM
RECORD_SIZE_BYTES: int = 32      # Approximate size per record in EEPROM

