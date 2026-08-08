"""
Patient Model Module.
Defines the Patient dataclass representing a clinical measurement record.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any

from config import CLINICAL_CONTEXT_PARAMS


@dataclass
class Patient:
    """
    Represents a patient glucose measurement record.
    """
    PatientID: int
    Name: str
    Age: int
    Sex: str
    Year: int
    Month: int
    Day: int
    Hour: int
    Minute: int
    Second: int
    Glucose: int
    MeasurementID: Optional[int] = None
    contextual_parameters: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.contextual_parameters is None:
            self.contextual_parameters = {}
        for param in CLINICAL_CONTEXT_PARAMS:
            attr = param["attr_name"]
            if attr not in self.contextual_parameters:
                self.contextual_parameters[attr] = param["default"]

    @property
    def consumed_sugar_last_6_hours(self) -> bool:
        """
        Indicates whether the patient consumed sugary food or beverages within 6 hours.
        """
        return self.contextual_parameters.get("consumed_sugar_last_6_hours", False)

    @consumed_sugar_last_6_hours.setter
    def consumed_sugar_last_6_hours(self, value: bool) -> None:
        self.contextual_parameters["consumed_sugar_last_6_hours"] = value

    def get_datetime(self) -> datetime:
        """
        Combines components into a Python datetime object for chronological operations.
        """
        return datetime(
            year=self.Year,
            month=self.Month,
            day=self.Day,
            hour=self.Hour,
            minute=self.Minute,
            second=self.Second
        )

    def get_unique_key(self) -> str:
        """
        Generates a unique string key for matching records.
        """
        return f"{self.PatientID}_{self.Name}_{self.Age}_{self.Sex}_{self.Year}_{self.Month}_{self.Day}_{self.Hour}_{self.Minute}_{self.Second}_{self.Glucose}"

    def to_dict(self) -> Dict[str, Any]:
        """
        Converts the Patient dataclass to a standard dictionary.
        """
        res = {
            "MeasurementID": self.MeasurementID,
            "PatientID": self.PatientID,
            "Name": self.Name,
            "Age": self.Age,
            "Sex": self.Sex,
            "Year": self.Year,
            "Month": self.Month,
            "Day": self.Day,
            "Hour": self.Hour,
            "Minute": self.Minute,
            "Second": self.Second,
            "Glucose": self.Glucose
        }
        # Include clinical parameters dynamically formatted for export/display
        for param in CLINICAL_CONTEXT_PARAMS:
            attr = param["attr_name"]
            val = self.contextual_parameters.get(attr, param["default"])
            res[param["csv_column"]] = param["to_display"](val)
        return res

    @classmethod
    def from_csv_row(cls, row: Dict[str, str]) -> 'Patient':
        """
        Constructs a Patient instance from a CSV dictionary row.
        """
        patient = cls(
            PatientID=int(row["PatientID"]),
            Name=row["Name"].strip(),
            Age=int(row["Age"]),
            Sex=row["Sex"].strip().upper(),
            Year=int(row["Year"]),
            Month=int(row["Month"]),
            Day=int(row["Day"]),
            Hour=int(row["Hour"]),
            Minute=int(row["Minute"]),
            Second=int(row["Second"]),
            Glucose=int(row["Glucose"]),
            MeasurementID=None
        )
        
        # Parse clinical contextual parameters dynamically
        for param in CLINICAL_CONTEXT_PARAMS:
            col = param["csv_column"]
            attr = param["attr_name"]
            if col in row and row[col]:
                val_str = row[col].strip()
                patient.contextual_parameters[attr] = param["to_internal"](val_str)
            else:
                patient.contextual_parameters[attr] = param["default"]
                
        return patient

    @classmethod
    def from_serial_line(cls, line: str) -> 'Patient':
        """
        Constructs a Patient instance from a firmware GET_DATA line:
        MeasurementID,PatientID,Name,Age,Sex,Year,Month,Day,Hour,Minute,Second,Glucose
        """
        parts = [p.strip() for p in line.split(",")]
        if len(parts) < 12:
            raise ValueError(f"Invalid serial record layout, expected 12 parts: {line}")
        
        patient = cls(
            MeasurementID=int(parts[0]),
            PatientID=int(parts[1]),
            Name=parts[2],
            Age=int(parts[3]),
            Sex=parts[4].upper(),
            Year=int(parts[5]),
            Month=int(parts[6]),
            Day=int(parts[7]),
            Hour=int(parts[8]),
            Minute=int(parts[9]),
            Second=int(parts[10]),
            Glucose=int(parts[11])
        )
        
        # Initialize default clinical parameters since firmware does not support them
        for param in CLINICAL_CONTEXT_PARAMS:
            patient.contextual_parameters[param["attr_name"]] = param["default"]
            
        return patient

    def to_csv_row(self) -> Dict[str, Any]:
        """
        Returns a dictionary representation suitable for CSV export (with header keys).
        """
        res = self.to_dict()
        if "MeasurementID" in res and res["MeasurementID"] is None:
            res.pop("MeasurementID")
        return res

