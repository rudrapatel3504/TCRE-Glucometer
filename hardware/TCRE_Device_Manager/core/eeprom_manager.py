"""
EEPROM Manager Module.
Responsible for saving downloaded EEPROM data backups, exporting to CSV,
and loading prior backup states.
"""

import csv
import os
from datetime import datetime
from typing import List
from models.patient import Patient
from config import CSV_HEADER
from utils.logger import get_logger

logger = get_logger()


class EEPROMManager:
    """
    Manages persistence, export, and backup of EEPROM patient records.
    """
    def __init__(self, backup_dir: str = "data", export_dir: str = "exports") -> None:
        self.backup_dir = backup_dir
        self.export_dir = export_dir
        
        # Ensure directories exist
        os.makedirs(self.backup_dir, exist_ok=True)
        os.makedirs(self.export_dir, exist_ok=True)

    def load_metadata_registry(self) -> dict:
        """
        Loads the clinical metadata registry JSON file.
        """
        filepath = os.path.join(self.backup_dir, "clinical_metadata.json")
        if os.path.exists(filepath):
            try:
                import json
                with open(filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load clinical metadata registry: {e}")
        return {}

    def save_metadata_registry(self, registry: dict) -> None:
        """
        Saves the clinical metadata registry JSON file.
        """
        filepath = os.path.join(self.backup_dir, "clinical_metadata.json")
        try:
            import json
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(registry, f, indent=4)
        except Exception as e:
            logger.error(f"Failed to save clinical metadata registry: {e}")

    def save_backup(self, records: List[Patient]) -> str:
        """
        Saves a local timestamped backup of the EEPROM contents.
        Returns the path of the created backup file.
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"eeprom_backup_{timestamp}.csv"
        filepath = os.path.join(self.backup_dir, filename)

        success = self.export_to_csv(records, filepath, include_measurement_id=True)
        if success:
            logger.info(f"EEPROM backup saved to: {filepath}")
            return filepath
        else:
            raise IOError("Failed to write EEPROM backup file.")

    def export_to_csv(
        self,
        records: List[Patient],
        filepath: str,
        include_measurement_id: bool = True
    ) -> bool:
        """
        Exports a list of Patient records to a CSV file.
        """
        try:
            # If MeasurementID is included, add it to the header
            headers = list(CSV_HEADER)
            
            # Append clinical contextual columns to the end
            from config import CLINICAL_CONTEXT_PARAMS
            for param in CLINICAL_CONTEXT_PARAMS:
                headers.append(param["csv_column"])
                
            if include_measurement_id:
                headers.insert(0, "MeasurementID")

            with open(filepath, mode="w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=headers)
                writer.writeheader()
                for record in records:
                    row = record.to_dict()
                    # Filter keys to match headers
                    filtered_row = {k: row[k] for k in headers if k in row}
                    writer.writerow(filtered_row)
                    
            logger.info(f"Exported {len(records)} records to CSV: {filepath}")
            return True
        except Exception as e:
            logger.error(f"Failed to export records to CSV at {filepath}: {e}")
            return False


    def load_backup(self, filepath: str) -> List[Patient]:
        """
        Loads Patient records from a backup CSV file.
        Supports reading back MeasurementID if present.
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Backup file not found: {filepath}")

        records: List[Patient] = []
        try:
            with open(filepath, mode="r", encoding="utf-8", newline="") as f:
                reader = csv.DictReader(f)
                for line_idx, row in enumerate(reader, start=2):
                    cleaned_row = {k: v.strip() for k, v in row.items() if v}
                    
                    # Basic construction
                    patient = Patient.from_csv_row(cleaned_row)
                    if "MeasurementID" in cleaned_row:
                        patient.MeasurementID = int(cleaned_row["MeasurementID"])
                    records.append(patient)
            
            logger.info(f"Loaded {len(records)} records from backup: {filepath}")
            return records
        except Exception as e:
            logger.error(f"Failed to load backup from {filepath}: {e}")
            raise IOError(f"Failed to read backup: {e}")
