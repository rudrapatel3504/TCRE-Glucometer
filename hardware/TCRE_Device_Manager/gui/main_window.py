"""
Main Window Module.
Implements the top-level application container, layout grids,
and manages background thread dispatching for hardware transactions.
"""

import threading
import time
from typing import Any, Callable, List, Optional
import customtkinter as ctk
from tkinter import filedialog, messagebox

from config import APP_NAME, APP_VERSION, THEME_MODE, COLOR_THEME, WINDOW_SIZE, MIN_WINDOW_SIZE, CLINICAL_CONTEXT_PARAMS
from core.device_manager import DeviceManager
from models.patient import Patient
from utils.logger import setup_logger, GUIConsoleHandler, get_logger

# Import panels
from gui.device_panel import DevicePanel
from gui.command_panel import CommandPanel
from gui.csv_panel import CSVPanel
from gui.console_panel import ConsolePanel
from gui.progress_panel import ProgressPanel
from gui.status_bar import StatusBar

logger = get_logger()


class MainWindow(ctk.CTk):
    """
    Main application dashboard. Coordinates panels and manages background threads.
    """
    def __init__(self) -> None:
        super().__init__()

        # 1. CustomTkinter UI Appearance Defaults
        ctk.set_appearance_mode(THEME_MODE)
        ctk.set_default_color_theme(COLOR_THEME)

        self.title(APP_NAME)
        self.geometry(WINDOW_SIZE)
        self.minsize(*MIN_WINDOW_SIZE)

        # 2. State & Engine Initialization
        self.device_manager = DeviceManager()
        self.downloaded_records: List[Patient] = []
        self._operation_lock = threading.Lock()

        # 3. Setup Layout
        self._build_ui()

        # 4. Bind Custom logging handler to redirect logger events to ConsolePanel
        # Save logs to a local file under data/logs/app.log (to keep it organized)
        setup_logger(log_file="data/logs/app.log")
        gui_handler = GUIConsoleHandler(self._log_from_thread)
        logger.addHandler(gui_handler)

        logger.info(f"Welcome to {APP_NAME} v{APP_VERSION}")

    def _build_ui(self) -> None:
        """Assembles frames and grids in the main window."""
        # Top Header Bar
        self.header_frame = ctk.CTkFrame(self, height=60, corner_radius=0, fg_color="gray15")
        self.header_frame.pack(fill="x", side="top")
        
        self.header_lbl = ctk.CTkLabel(
            self.header_frame,
            text=f"🔬 {APP_NAME}",
            font=("Arial", 22, "bold"),
            text_color="#3498DB"
        )
        self.header_lbl.pack(side="left", padx=20, pady=15)

        self.header_sub = ctk.CTkLabel(
            self.header_frame,
            text="EEPROM Management Tool for Clinical Reasoning Engine",
            font=("Arial", 12, "italic"),
            text_color="gray60"
        )
        self.header_sub.pack(side="left", padx=(10, 0), pady=(18, 15))

        # Bottom Status Bar
        self.status_bar = StatusBar(self, APP_VERSION)

        # Middle Content Frame (Split Screen Layout)
        self.main_container = ctk.CTkFrame(self, fg_color="transparent")
        self.main_container.pack(fill="both", expand=True, padx=15, pady=15)

        # Left Column (Device Connection & Commands)
        left_col = ctk.CTkFrame(self.main_container, fg_color="transparent", width=420)
        left_col.pack(side="left", fill="both", padx=(0, 10))
        left_col.pack_propagate(False)  # Lock width

        # Right Column (CSV Actions, Progress & Console)
        right_col = ctk.CTkFrame(self.main_container, fg_color="transparent")
        right_col.pack(side="right", fill="both", expand=True, padx=(10, 0))

        # Instantiate Panels into Columns
        # Left Panel (Connection & Info)
        self.device_panel = DevicePanel(
            parent=left_col,
            on_connect=self.connect_device,
            on_disconnect=self.disconnect_device,
            on_refresh=self.refresh_ports
        )
        self.device_panel.pack(fill="x", pady=(0, 10))

        # Left Panel (Commands)
        self.command_panel = CommandPanel(
            parent=left_col,
            on_command_execute=self.execute_raw_command
        )
        self.command_panel.pack(fill="both", expand=True, pady=(10, 0))

        # Right Panels
        self.csv_panel = CSVPanel(
            parent=right_col,
            on_validate=self.validate_csv,
            on_upload=self.upload_csv,
            on_export=self.export_downloaded_data
        )
        self.csv_panel.pack(fill="x", pady=(0, 10))

        self.progress_panel = ProgressPanel(parent=right_col)
        self.progress_panel.pack(fill="x", pady=10)

        self.console_panel = ConsolePanel(parent=right_col)
        self.console_panel.pack(fill="both", expand=True, pady=(10, 0))

    def _log_from_thread(self, message: str, level: str) -> None:
        """Thread-safe redirection of log events into the ConsolePanel."""
        self.after(0, self.console_panel.log_message, message, level)

    def _run_async(self, target: Callable, args: tuple = (), callback: Optional[Callable] = None) -> None:
        """
        Spins off target operation on a background daemon thread.
        Triggers GUI-thread callback on completion.
        """
        def worker():
            try:
                res = target(*args)
                if callback:
                    self.after(0, callback, res, None)
            except Exception as e:
                logger.error(f"Thread worker exception: {e}")
                if callback:
                    self.after(0, callback, None, e)

        t = threading.Thread(target=worker, daemon=True)
        t.start()

    # --- Event Callback Handlers ---

    def refresh_ports(self) -> List[str]:
        """Queries available COM ports."""
        return self.device_manager.list_ports()

    def connect_device(self, port: str) -> None:
        """Initiates a background thread to open serial port."""
        logger.info(f"Initiating connection to {port}...")
        self.status_bar.set_task_status("Connecting to device...")
        self.device_panel.set_connected_state(True)  # Temporarily disable inputs
        self.device_panel.status_lbl.configure(text="🟡 Connecting...", text_color="orange")

        def task():
            return self.device_manager.connect(port)

        def on_complete(success: bool, error: Optional[Exception]):
            if error or not success:
                logger.error("Connection failed.")
                self.device_panel.set_connected_state(False)
                self.status_bar.set_connection_status(False)
                self.status_bar.set_task_status("Connection Failed")
                self.command_panel.set_connected_state(False)
                self.csv_panel.set_connected_state(False)
                messagebox.showerror("Connection Error", f"Could not connect to {port}. Verify port and connection.")
            else:
                logger.info("Connected successfully.")
                self.device_panel.set_connected_state(True)
                self.status_bar.set_connection_status(True, self.device_manager.device_name)
                self.status_bar.set_task_status("Connected and ready.")
                self.command_panel.set_connected_state(True)
                self.csv_panel.set_connected_state(True)
                # Refresh UI information panel
                self.device_panel.update_device_info(
                    name=self.device_manager.device_name,
                    fw_version=self.device_manager.firmware_version,
                    records=self.device_manager.record_count,
                    capacity=self.device_manager.max_capacity
                )

        self._run_async(task, callback=on_complete)

    def disconnect_device(self) -> None:
        """Disconnects the device and updates all panel states."""
        self.device_manager.disconnect()
        self.device_panel.set_connected_state(False)
        self.status_bar.set_connection_status(False)
        self.status_bar.set_task_status("Disconnected.")
        self.command_panel.set_connected_state(False)
        self.csv_panel.set_connected_state(False)
        logger.info("Device disconnected manually.")

    def _print_records_table(self, records: List[Patient], title: str) -> None:
        """
        Formats patient records as a clean ASCII table and prints them to the console.
        """
        if not records:
            logger.info(f"{title}: No records found.")
            return

        col_widths = {
            "PatientID": 9,
            "Name": 15,
            "Age": 5,
            "Sex": 5,
            "DateTime": 20,
            "Glucose": 8
        }
        
        max_name_len = max(len(p.Name) for p in records)
        if max_name_len > col_widths["Name"]:
            col_widths["Name"] = min(max_name_len, 25)

        context_cols = []
        for param in CLINICAL_CONTEXT_PARAMS:
            col_name = param["csv_column"]
            width = max(len(col_name), 10)
            context_cols.append((col_name, param["attr_name"], param["to_display"], width))

        header_parts = [
            f"{'PatientID':<{col_widths['PatientID']}}",
            f"{'Name':<{col_widths['Name']}}",
            f"{'Age':<{col_widths['Age']}}",
            f"{'Sex':<{col_widths['Sex']}}",
            f"{'Date/Time':<{col_widths['DateTime']}}",
            f"{'Glucose':<{col_widths['Glucose']}}"
        ]
        for col_name, _, _, w in context_cols:
            header_parts.append(f"{col_name:<{w}}")
        
        header_str = " | ".join(header_parts)
        divider = "-" * len(header_str)

        logger.info(f"=== {title} ===")
        logger.info(header_str)
        logger.info(divider)

        for p in records:
            dt_str = p.get_datetime().strftime("%Y-%m-%d %H:%M:%S")
            p_name = p.Name
            if len(p_name) > col_widths["Name"]:
                p_name = p_name[:col_widths["Name"]-3] + "..."
                
            row_parts = [
                f"{str(p.PatientID):<{col_widths['PatientID']}}",
                f"{p_name:<{col_widths['Name']}}",
                f"{str(p.Age):<{col_widths['Age']}}",
                f"{p.Sex:<{col_widths['Sex']}}",
                f"{dt_str:<{col_widths['DateTime']}}",
                f"{str(p.Glucose):<{col_widths['Glucose']}}"
            ]
            for _, attr, to_display_fn, w in context_cols:
                val = p.contextual_parameters.get(attr, False)
                disp = to_display_fn(val)
                row_parts.append(f"{disp:<{w}}")
            
            row_str = " | ".join(row_parts)
            logger.info(row_str)

        logger.info(divider)
        logger.info(f"Total: {len(records)} record(s)")

    def validate_csv(self, filepath: str) -> None:
        """Loads and runs schema validation on the selected CSV file."""
        logger.info(f"Validating CSV file: {filepath}...")
        self.status_bar.set_task_status("Validating CSV...")
        
        # Load and validate synchronously since it runs extremely fast in Python (<10ms)
        success, records, errors = self.device_manager.csv_manager.load_and_validate(filepath)
        
        if success:
            logger.info(f"CSV Validation Passed! {len(records)} records sorted and loaded.")
            self._print_records_table(records, "CSV Records Preview")
            self.status_bar.set_task_status(f"CSV Valid: {len(records)} records loaded.")
            messagebox.showinfo(
                "CSV Validation Success",
                f"CSV file is valid!\nLoaded {len(records)} records successfully (sorted chronologically)."
            )
        else:
            logger.error(f"CSV Validation Failed: {len(errors)} errors found.")
            for err in errors[:10]: # Log first 10 errors
                logger.warning(err)
            if len(errors) > 10:
                logger.warning(f"... and {len(errors) - 10} more errors.")
                
            self.status_bar.set_task_status("CSV Validation Failed")
            messagebox.showerror(
                "CSV Validation Error",
                f"Validation failed with {len(errors)} errors.\nCheck console for details."
            )

    def upload_csv(self, filepath: str) -> None:
        """Starts background upload task."""
        if not self._operation_lock.acquire(blocking=False):
            messagebox.showwarning("Busy", "Another transaction is currently in progress.")
            return

        logger.info("Starting CSV upload process...")
        self.status_bar.set_task_status("Uploading CSV data...")
        self.progress_panel.reset_progress()
        self.command_panel.set_connected_state(False) # Disable commands during upload

        # Setup progress tracker callback
        def progress_cb(current: int, total: int, elapsed: float):
            self.after(0, self.progress_panel.update_progress, current, total, elapsed)

        def task():
            return self.device_manager.upload_csv(filepath, progress_callback=progress_cb)

        def on_complete(res: Optional[Tuple[bool, str]], error: Optional[Exception]):
            self._operation_lock.release()
            self.command_panel.set_connected_state(True)
            
            if error or not res or not res[0]:
                msg = res[1] if res else str(error)
                logger.error(f"Upload failed: {msg}")
                self.status_bar.set_task_status("Upload Failed.")
                messagebox.showerror("Upload Error", f"Upload failed:\n{msg}")
            else:
                msg = res[1]
                logger.info(msg)
                self.status_bar.set_task_status("Upload Completed.")
                messagebox.showinfo("Upload Complete", msg)
                
                # Refresh capacity display in device info
                self.device_panel.update_device_info(
                    name=self.device_manager.device_name,
                    fw_version=self.device_manager.firmware_version,
                    records=self.device_manager.record_count,
                    capacity=self.device_manager.max_capacity
                )

        self._run_async(task, callback=on_complete)

    def execute_raw_command(self, cmd_type: str) -> None:
        """Executes a single command using threads to prevent interface lockups."""
        if not self._operation_lock.acquire(blocking=False):
            messagebox.showwarning("Busy", "Another transaction is currently in progress.")
            return

        logger.info(f"Dispatching command: {cmd_type}...")
        self.status_bar.set_task_status(f"Executing command: {cmd_type}...")
        self.progress_panel.reset_progress()

        def task():
            if cmd_type == "PING":
                res = self.device_manager.ping()
                return "PING", "OK, PONG" if res else "No response"
            elif cmd_type == "COUNT":
                self.device_manager.refresh_device_status()
                return "COUNT", f"Records: {self.device_manager.record_count}"
            elif cmd_type == "HELP":
                help_text = self.device_manager.fetch_help_text()
                return "HELP", help_text
            elif cmd_type == "INFO":
                self.device_manager.refresh_device_status()
                return "INFO", f"Device: {self.device_manager.device_name} | FW: {self.device_manager.firmware_version} | Cap: {self.device_manager.max_capacity}"
            elif cmd_type == "CLEAR":
                res = self.device_manager.clear_eeprom()
                return "CLEAR", "EEPROM Cleared Successfully." if res else "Clear Failed."
            elif cmd_type == "FORMAT":
                res = self.device_manager.format_eeprom()
                return "FORMAT", "EEPROM Formatted Successfully." if res else "Format Failed."
            elif cmd_type == "GET_DATA":
                
                # Progress callback during download parsing
                def progress_cb(current: int, total: int):
                    self.after(0, self.progress_panel.update_progress, current, total, 0.0)

                records, msg = self.device_manager.download_eeprom(progress_callback=progress_cb)
                return "GET_DATA", (records, msg)
            return "", "Unknown Command"

        def on_complete(res: Optional[Tuple[str, Any]], error: Optional[Exception]):
            self._operation_lock.release()
            self.status_bar.set_task_status("Ready.")

            if error:
                logger.error(f"Command execution error: {error}")
                messagebox.showerror("Command Error", f"Command failed:\n{error}")
                return

            if not res:
                return

            cmd, val = res
            if cmd == "GET_DATA":
                records, msg = val
                if records:
                    self.downloaded_records = records
                    self.csv_panel.set_export_enabled(True)
                    logger.info(f"Downloaded {len(records)} patient records.")
                    self._print_records_table(records, "Downloaded Device EEPROM Records")
                    messagebox.showinfo("Download Complete", msg)
                else:
                    self.downloaded_records.clear()
                    self.csv_panel.set_export_enabled(False)
                    logger.warning("No records downloaded.")
                    messagebox.showwarning("Download empty", msg)
            else:
                if isinstance(val, list):
                    logger.info("--- Command Help Output ---")
                    for line in val:
                        logger.info(f"  {line}")
                else:
                    logger.info(f"Command Response: {val}")
                
                # Refresh capacity display in device info
                self.device_panel.update_device_info(
                    name=self.device_manager.device_name,
                    fw_version=self.device_manager.firmware_version,
                    records=self.device_manager.record_count,
                    capacity=self.device_manager.max_capacity
                )

        self._run_async(task, callback=on_complete)

    def export_downloaded_data(self) -> None:
        """Saves current memory buffer records to a user-provided CSV filepath."""
        if not self.downloaded_records:
            messagebox.showwarning("Export Empty", "No data downloaded to export.")
            return

        filepath = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV Files", "*.csv"), ("All Files", "*.*")],
            title="Export EEPROM Data"
        )
        if filepath:
            success = self.device_manager.export_downloaded_data(self.downloaded_records, filepath)
            if success:
                logger.info(f"EEPROM records exported to: {filepath}")
                messagebox.showinfo("Export Success", f"Exported {len(self.downloaded_records)} records successfully.")
            else:
                logger.error(f"Failed to export EEPROM records to {filepath}.")
                messagebox.showerror("Export Error", "Failed to write CSV file.")
