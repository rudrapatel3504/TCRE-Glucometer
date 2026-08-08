import threading
import time
import urllib.request
import json
import traceback
from typing import List, Optional
from core.device_manager import DeviceManager
from models.patient import Patient
from utils.logger import get_logger

logger = get_logger()

class DeviceBridge:
    def __init__(self, device_manager: DeviceManager) -> None:
        self.device_manager = device_manager
        self.running = False
        self.thread: Optional[threading.Thread] = None
        
        # State
        self.status = "Idle"
        self.progress = 0
        self.error_message: Optional[str] = None
        
        # Next.js URL
        self.base_url = "http://localhost:3000/api/device"

    def start(self) -> None:
        self.running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        logger.info("Device Bridge background thread started.")

    def stop(self) -> None:
        self.running = False
        logger.info("Stopping Device Bridge background thread...")

    def _run_loop(self) -> None:
        while self.running:
            try:
                # 1. Manage hardware connection
                self._manage_connection()

                # 2. Prepare status payload
                payload = {
                    "connected": self.device_manager.is_connected(),
                    "model": self.device_manager.device_name if self.device_manager.is_connected() else "",
                    "firmware": self.device_manager.firmware_version if self.device_manager.is_connected() else "",
                    "recordCount": self.device_manager.record_count if self.device_manager.is_connected() else 0,
                    "capacity": self.device_manager.max_capacity if self.device_manager.is_connected() else 0,
                    "status": self.status,
                    "progress": self.progress,
                    "error": self.error_message
                }

                # 3. Post status heartbeat to Next.js
                response = self._post_to_backend(f"{self.base_url}/status", payload)
                
                # 4. Check if frontend requested an import
                if response and response.get("importRequested"):
                    # Process import in-thread (blocks the loop but we want that to prevent multiple starts)
                    self._perform_import()

            except Exception as e:
                logger.debug(f"Device Bridge loop encountered an error: {e}")

            time.sleep(1.0)

    def _manage_connection(self) -> None:
        """Handles automatic detection and connection of the Arduino device if not connected."""
        if self.device_manager.is_connected():
            # Connection is active. Let's ping to ensure it's still alive.
            if not self.device_manager.ping():
                logger.warning("Device ping failed. Disconnecting...")
                self.device_manager.disconnect()
        else:
            # Not connected. Scan for available COM ports.
            ports = self.device_manager.list_ports()
            for port in ports:
                logger.info(f"Auto-detecting device on port: {port}")
                if self.device_manager.connect(port):
                    logger.info(f"Auto-connected to device on {port}!")
                    break

    def _perform_import(self) -> None:
        logger.info("Start importing data from device requested by Web Frontend...")
        self.status = "Reading EEPROM"
        self.progress = 0
        self.error_message = None
        
        # Report status to web
        self._report_status()

        if not self.device_manager.is_connected():
            self.status = "Error"
            self.error_message = "Device is not connected."
            logger.error("Import failed: Device not connected.")
            self._report_status()
            return

        try:
            # Refresh count first
            self.device_manager.refresh_device_status()
            total_records = self.device_manager.record_count
            
            if total_records == 0:
                # Send empty records
                self.status = "Uploading"
                self.progress = 90
                self._report_status()
                self._upload_records([])
                return

            def progress_cb(current: int, total: int):
                # Scale progress to 0-90% range for downloading
                percentage = int((current / total) * 90)
                self.progress = percentage
                logger.info(f"Downloaded {current}/{total} records...")
                self._report_status()

            logger.info(f"Downloading {total_records} records from EEPROM...")
            records, msg = self.device_manager.download_eeprom(progress_callback=progress_cb)
            
            if not records and total_records > 0:
                raise Exception("No records could be retrieved from the device.")

            # Convert records to JSON compatible format
            self.status = "Converting"
            self.progress = 95
            self._report_status()
            
            records_json = [r.to_dict() for r in records]

            # Upload JSON payload to Web Backend
            self.status = "Uploading"
            self.progress = 98
            self._report_status()
            
            self._upload_records(records_json)

        except Exception as err:
            logger.error(f"Failed to import data: {err}")
            traceback.print_exc()
            self.status = "Error"
            self.error_message = str(err)
            self.progress = 0
            self._report_status()

    def _report_status_with_stats(
        self,
        arduino_cleared: bool = False,
        clear_failed: bool = False,
        patients_added: int = 0,
        measurements_added: int = 0,
        duplicates_ignored: int = 0,
        database_updated: bool = False
    ) -> None:
        try:
            payload = {
                "connected": self.device_manager.is_connected(),
                "model": self.device_manager.device_name if self.device_manager.is_connected() else "",
                "firmware": self.device_manager.firmware_version if self.device_manager.is_connected() else "",
                "recordCount": self.device_manager.record_count if self.device_manager.is_connected() else 0,
                "capacity": self.device_manager.max_capacity if self.device_manager.is_connected() else 0,
                "status": self.status,
                "progress": self.progress,
                "error": self.error_message,
                "patientsAdded": patients_added,
                "measurementsAdded": measurements_added,
                "duplicatesIgnored": duplicates_ignored,
                "databaseUpdated": database_updated,
                "arduinoCleared": arduino_cleared,
                "clearFailed": clear_failed
            }
            self._post_to_backend(f"{self.base_url}/status", payload)
        except Exception:
            pass

    def _upload_records(self, records_json: List[dict]) -> None:
        try:
            logger.info(f"Uploading {len(records_json)} records to Web Backend...")
            req = urllib.request.Request(
                f"{self.base_url}/upload",
                data=json.dumps(records_json).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                if res_data.get("success"):
                    logger.info("Data uploaded successfully to Web Backend!")
                    
                    # 100% Successful Database Ingestion Confirmed!
                    # Now execute clear on Arduino and verify response
                    self.status = "Clearing EEPROM"
                    self.progress = 99
                    self._report_status_with_stats(
                        arduino_cleared=False,
                        clear_failed=False,
                        patients_added=res_data.get("patientsAdded", 0),
                        measurements_added=res_data.get("measurementsAdded", 0),
                        duplicates_ignored=res_data.get("duplicatesIgnored", 0),
                        database_updated=res_data.get("databaseUpdated", False)
                    )
                    
                    logger.info("Sending CLEAR command to Arduino...")
                    clear_ok = self.device_manager.clear_eeprom()
                    
                    if clear_ok:
                        logger.info("Arduino memory successfully cleared!")
                        self.status = "Completed"
                        self.progress = 100
                        self._report_status_with_stats(
                            arduino_cleared=True,
                            clear_failed=False,
                            patients_added=res_data.get("patientsAdded", 0),
                            measurements_added=res_data.get("measurementsAdded", 0),
                            duplicates_ignored=res_data.get("duplicatesIgnored", 0),
                            database_updated=res_data.get("databaseUpdated", False)
                        )
                    else:
                        logger.error("Failed to clear Arduino EEPROM!")
                        self.status = "Completed"
                        self.progress = 100
                        self._report_status_with_stats(
                            arduino_cleared=False,
                            clear_failed=True,
                            patients_added=res_data.get("patientsAdded", 0),
                            measurements_added=res_data.get("measurementsAdded", 0),
                            duplicates_ignored=res_data.get("duplicatesIgnored", 0),
                            database_updated=res_data.get("databaseUpdated", False)
                        )
                    
                    # Wait 8 seconds at 100% so the user can read the completed summary dialog
                    time.sleep(8.0)
                    self.status = "Idle"
                    self.progress = 0
                    self.error_message = None
                    self._report_status()
                else:
                    raise Exception(res_data.get("error", "Unknown backend error"))
        except Exception as e:
            logger.error(f"Failed to upload data to backend: {e}")
            self.status = "Error"
            self.error_message = f"Backend Upload Failed: {e}"
            self._report_status()

    def _report_status(self) -> None:
        """Helper to force post status immediately."""
        try:
            payload = {
                "connected": self.device_manager.is_connected(),
                "model": self.device_manager.device_name if self.device_manager.is_connected() else "",
                "firmware": self.device_manager.firmware_version if self.device_manager.is_connected() else "",
                "recordCount": self.device_manager.record_count if self.device_manager.is_connected() else 0,
                "capacity": self.device_manager.max_capacity if self.device_manager.is_connected() else 0,
                "status": self.status,
                "progress": self.progress,
                "error": self.error_message
            }
            self._post_to_backend(f"{self.base_url}/status", payload)
        except Exception:
            pass

    def _post_to_backend(self, url: str, payload: dict) -> Optional[dict]:
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=3) as response:
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            logger.debug(f"Failed to POST to {url}: {e}")
            return None
