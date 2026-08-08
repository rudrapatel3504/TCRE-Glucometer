"""
Device Manager Module.
Acts as the Business Logic layer orchestrator.
UI panels interact solely with DeviceManager rather than lower-level managers.
"""

import time
from typing import Callable, List, Optional, Tuple, Dict, Any
import serial

from core.protocol import Protocol
from core.serial_manager import SerialManager
from core.csv_manager import CSVManager
from core.eeprom_manager import EEPROMManager
from models.patient import Patient
from utils.logger import get_logger
from config import DEFAULT_MAX_CAPACITY

logger = get_logger()


class DeviceManager:
    """
    Orchestrates device operations and encapsulates application business logic.
    """
    def __init__(self) -> None:
        self.serial_manager = SerialManager()
        self.csv_manager = CSVManager()
        self.eeprom_manager = EEPROMManager()
        
        # State variables cached after query
        self.device_name: str = "Unknown Device"
        self.firmware_version: str = "0.0.0"
        self.max_capacity: int = DEFAULT_MAX_CAPACITY
        self.record_count: int = 0

    def list_ports(self) -> List[str]:
        """Scans for available COM ports."""
        return self.serial_manager.list_ports()

    def connect(self, port: str) -> bool:
        """Connects to the device and initializes status information."""
        if self.serial_manager.connect(port):
            # Query info and count to populate cache
            self.refresh_device_status()
            return True
        return False

    def disconnect(self) -> None:
        """Disconnects from the device."""
        self.serial_manager.disconnect()

    def is_connected(self) -> bool:
        """Returns True if device is connected."""
        return self.serial_manager.is_connected()

    def ping(self) -> bool:
        """Pings the device. Returns True if OK,PONG is received."""
        try:
            response = self.serial_manager.send_and_receive(Protocol.ping())
            return response == "OK,PONG"
        except Exception as e:
            logger.error(f"Ping failed: {e}")
            return False

    def refresh_device_status(self) -> bool:
        """
        Queries the device for model, capacity, and current record count.
        """
        if not self.is_connected():
            return False
        
        try:
            # Query Info
            info_resp = self.serial_manager.send_and_receive(Protocol.info())
            if info_resp.startswith("OK,INFO,"):
                # Format: OK,INFO,DeviceName,FirmwareVersion,MaxCapacity
                parts = info_resp.split(",")
                if len(parts) >= 5:
                    self.device_name = parts[2]
                    self.firmware_version = parts[3]
                    self.max_capacity = int(parts[4])
            else:
                # Fallbacks for generic devices
                self.device_name = "TCRE Mega 2560"
                self.firmware_version = "1.0.0"
                self.max_capacity = DEFAULT_MAX_CAPACITY

            # Query Count
            count_resp = self.serial_manager.send_and_receive(Protocol.count())
            if count_resp.startswith("OK,COUNT,"):
                self.record_count = int(count_resp.split(",")[2])
            else:
                self.record_count = 0

            return True
        except Exception as e:
            logger.error(f"Failed to refresh device status: {e}")
            return False

    def clear_eeprom(self) -> bool:
        """Clears patient records in EEPROM."""
        try:
            response = self.serial_manager.send_and_receive(Protocol.clear())
            if response.startswith("OK"):
                self.record_count = 0
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to clear EEPROM: {e}")
            return False

    def format_eeprom(self) -> bool:
        """Formats the EEPROM structure completely."""
        try:
            response = self.serial_manager.send_and_receive(Protocol.format())
            if response.startswith("OK"):
                self.record_count = 0
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to format EEPROM: {e}")
            return False

    def fetch_help_text(self) -> List[str]:
        """Downloads helper commands text block from device."""
        try:
            return self.serial_manager.send_and_receive_block(
                Protocol.help(), "BEGIN_HELP", "END_HELP"
            )
        except Exception as e:
            logger.error(f"Failed to retrieve help: {e}")
            return ["Error retrieving help information."]

    def upload_csv(
        self,
        filepath: str,
        progress_callback: Optional[Callable[[int, int, float], None]] = None
    ) -> Tuple[bool, str]:
        """
        Validates, sorts, and uploads patient records from CSV to EEPROM.
        progress_callback arguments: (current_index, total_count, elapsed_seconds).
        Returns (success_status, status_message).
        """
        if not self.is_connected():
            return False, "Device is not connected."

        # 1. Load and validate CSV
        success, records, errors = self.csv_manager.load_and_validate(filepath)
        if not success:
            first_err = errors[0] if errors else "Unknown error."
            return False, f"CSV Validation Failed: {first_err} (Total errors: {len(errors)})"

        if not records:
            return False, "CSV contains no valid records to upload."

        total = len(records)
        if total > self.max_capacity:
            return False, f"CSV contains {total} records, which exceeds the device's maximum capacity of {self.max_capacity}."

        logger.info(f"Starting upload of {total} records...")

        # 2. Iterate and store each record
        start_time = time.time()
        for idx, patient in enumerate(records):
            try:
                cmd = Protocol.store(patient)
                resp = self.serial_manager.send_and_receive(cmd)
                
                # Check response status
                if not resp.startswith("OK"):
                    return False, f"Device rejected record {idx+1} ({patient.Name}): {resp}"
                
                # Update progress
                if progress_callback:
                    progress_callback(idx + 1, total, time.time() - start_time)
                    
            except Exception as e:
                logger.error(f"Upload failed at index {idx+1}: {e}")
                return False, f"Upload interrupted: {e}"

        # Refresh local cache of record count
        self.refresh_device_status()
        
        elapsed = time.time() - start_time
        logger.info(f"Upload of {total} records completed in {elapsed:.1f}s.")
        return True, f"Successfully uploaded {total} records."

    def download_eeprom(
        self,
        progress_callback: Optional[Callable[[int, int], None]] = None
    ) -> Tuple[List[Patient], str]:
        """
        Downloads all patient records stored in the EEPROM.
        Returns (list_of_patients, status_message).
        """
        if not self.is_connected():
            return [], "Device is not connected."

        try:
            logger.info("Requesting EEPROM data block...")
            lines = self.serial_manager.send_and_receive_block(
                Protocol.get_data(), "BEGIN_DATA", "END_DATA"
            )

            patients: List[Patient] = []
            total_lines = len(lines)
            
            for idx, line in enumerate(lines):
                if line.strip():
                    try:
                        patient = Patient.from_serial_line(line)
                        patients.append(patient)
                    except Exception as parse_err:
                        logger.error(f"Failed to parse downloaded line {idx+1}: {line}. Error: {parse_err}")
                
                if progress_callback:
                    progress_callback(idx + 1, total_lines)

             # Auto backup to data folder
            if patients:
                # Restore clinical parameters from registry
                registry = self.eeprom_manager.load_metadata_registry()
                for patient in patients:
                    key = patient.get_unique_key()
                    if key in registry:
                        patient.contextual_parameters = registry[key]
                        
                backup_file = self.eeprom_manager.save_backup(patients)
                msg = f"Successfully downloaded {len(patients)} records. Auto-backup saved."
                logger.info(msg)
                return patients, msg
            else:
                return [], "No records retrieved from device."

        except Exception as e:
            logger.error(f"Failed to download EEPROM data: {e}")
            return [], f"Download failed: {e}"

    def export_downloaded_data(self, records: List[Patient], filepath: str) -> bool:
        """
        Exports downloaded records list to a user specified CSV path.
        """
        return self.eeprom_manager.export_to_csv(records, filepath, include_measurement_id=True)
