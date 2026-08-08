"""
CSV Manager Module.
Handles loading, validating, and chronologically sorting patient CSV records.
"""

import csv
import os
from typing import List, Tuple
from config import CSV_HEADER
from models.patient import Patient
from utils.validator import validate_patient_record
from utils.logger import get_logger

logger = get_logger()


class CSVManager:
    """
    Manages loading and validation of patient records from CSV files.
    """
    def __init__(self) -> None:
        self._records: List[Patient] = []
        self._errors: List[str] = []

    def load_and_validate(self, filepath: str) -> Tuple[bool, List[Patient], List[str]]:
        """
        Loads a CSV file, validates each row, and sorts valid records chronologically.
        Returns (success, list_of_patients, list_of_error_strings).
        """
        self._records.clear()
        self._errors.clear()

        if not os.path.exists(filepath):
            err = f"File not found: {filepath}"
            self._errors.append(err)
            logger.error(err)
            return False, [], self._errors

        try:
            with open(filepath, mode="r", encoding="utf-8", newline="") as f:
                reader = csv.DictReader(f)
                
                # Check for empty file or missing fieldnames
                if not reader.fieldnames:
                    err = "CSV file is empty or lacks headers."
                    self._errors.append(err)
                    logger.error(err)
                    return False, [], self._errors

                # Validate required columns
                missing_cols = [col for col in CSV_HEADER if col not in reader.fieldnames]
                if missing_cols:
                    err = f"Missing required columns: {', '.join(missing_cols)}"
                    self._errors.append(err)
                    logger.error(err)
                    return False, [], self._errors

                # Parse and validate records row-by-row (1-based index for logs, header is line 1)
                for line_idx, row in enumerate(reader, start=2):
                    # Clean whitespaces
                    cleaned_row = {k: (v.strip() if v else "") for k, v in row.items()}
                    
                    is_valid, err_msg = validate_patient_record(cleaned_row)
                    if is_valid:
                        try:
                            patient = Patient.from_csv_row(cleaned_row)
                            self._records.append(patient)
                        except Exception as e:
                            self._errors.append(f"Row {line_idx}: Construction failed - {e}")
                    else:
                        self._errors.append(f"Row {line_idx}: {err_msg}")

            # If there are any errors, do not proceed with upload (ensure zero corruption)
            if self._errors:
                logger.warning(f"CSV validation failed with {len(self._errors)} errors.")
                return False, [], self._errors

            # Sort records chronologically
            self._records.sort(key=lambda p: p.get_datetime())
            
            # Save clinical parameters to registry for future matching
            try:
                import json
                registry_file = "data/clinical_metadata.json"
                registry = {}
                if os.path.exists(registry_file):
                    with open(registry_file, "r", encoding="utf-8") as rf:
                        registry = json.load(rf)
                
                for p in self._records:
                    registry[p.get_unique_key()] = p.contextual_parameters
                
                os.makedirs(os.path.dirname(registry_file), exist_ok=True)
                with open(registry_file, "w", encoding="utf-8") as wf:
                    json.dump(registry, wf, indent=4)
            except Exception as e:
                logger.error(f"Failed to update clinical metadata registry: {e}")

            logger.info(f"Successfully loaded and sorted {len(self._records)} records chronologically.")
            return True, self._records, []

        except Exception as e:
            err = f"Failed to read CSV file: {e}"
            self._errors.append(err)
            logger.error(err)
            return False, [], self._errors

    @property
    def records(self) -> List[Patient]:
        """Returns the list of loaded Patient records."""
        return self._records

    @property
    def errors(self) -> List[str]:
        """Returns the list of validation errors."""
        return self._errors
