"""
Protocol Module.
Generates command strings for the Arduino firmware serial interface.
Does not perform any serial communication directly.
"""

from models.patient import Patient


class Protocol:
    """
    Static generator class for firmware commands.
    """

    @staticmethod
    def ping() -> str:
        """Generates PING command."""
        return "PING"

    @staticmethod
    def count() -> str:
        """Generates COUNT command."""
        return "COUNT"

    @staticmethod
    def clear() -> str:
        """Generates CLEAR command to reset record counts or empty eeprom pointers."""
        return "CLEAR"

    @staticmethod
    def help() -> str:
        """Generates HELP command."""
        return "HELP"

    @staticmethod
    def get_data() -> str:
        """Generates GET_DATA command to download all records."""
        return "GET_DATA"

    @staticmethod
    def info() -> str:
        """Generates INFO command."""
        return "INFO"

    @staticmethod
    def format() -> str:
        """Generates FORMAT command to perform low-level EEPROM clear/struct initialization."""
        return "FORMAT"

    @staticmethod
    def store(patient: Patient) -> str:
        """
        Generates STORE command with patient fields.
        Format: STORE,PatientID,Name,Age,Sex,Year,Month,Day,Hour,Minute,Second,Glucose
        """
        return (
            f"STORE,"
            f"{patient.PatientID},"
            f"{patient.Name},"
            f"{patient.Age},"
            f"{patient.Sex},"
            f"{patient.Year},"
            f"{patient.Month},"
            f"{patient.Day},"
            f"{patient.Hour},"
            f"{patient.Minute},"
            f"{patient.Second},"
            f"{patient.Glucose}"
        )
