"""
CSV Panel Module.
Implements file browsing, validation triggers, and data export buttons.
"""

from typing import Callable
import customtkinter as ctk
from tkinter import filedialog


class CSVPanel(ctk.CTkFrame):
    """
    GUI Panel managing CSV operations (loading, validating, uploading, exporting).
    """
    def __init__(
        self,
        parent,
        on_validate: Callable[[str], None],
        on_upload: Callable[[str], None],
        on_export: Callable[[], None]
    ) -> None:
        super().__init__(parent)
        self.on_validate = on_validate
        self.on_upload = on_upload
        self.on_export = on_export
        self.selected_path: str = ""
        self.device_connected: bool = False

        # Title Header
        title = ctk.CTkLabel(
            self,
            text="CSV & EEPROM Actions",
            font=("Arial", 16, "bold"),
            anchor="w"
        )
        title.pack(fill="x", padx=15, pady=(15, 10))

        # --- Sub-frame: File Selection ---
        file_frame = ctk.CTkFrame(self)
        file_frame.pack(fill="x", padx=10, pady=5)

        self.path_entry = ctk.CTkEntry(
            file_frame,
            placeholder_text="Select a patient CSV file...",
            width=250
        )
        self.path_entry.pack(side="left", fill="x", expand=True, padx=(10, 5), pady=10)

        browse_btn = ctk.CTkButton(
            file_frame,
            text="Browse",
            width=70,
            command=self._handle_browse
        )
        browse_btn.pack(side="right", padx=(5, 10), pady=10)

        # --- Sub-frame: Actions ---
        actions_frame = ctk.CTkFrame(self, fg_color="transparent")
        actions_frame.pack(fill="x", padx=10, pady=5)

        self.validate_btn = ctk.CTkButton(
            actions_frame,
            text="Validate CSV",
            command=self._handle_validate,
            state="disabled",
            fg_color="#34495E",
            hover_color="#2C3E50"
        )
        self.validate_btn.pack(side="left", fill="x", expand=True, padx=5)

        self.upload_btn = ctk.CTkButton(
            actions_frame,
            text="Upload CSV",
            command=self._handle_upload,
            state="disabled",
            fg_color="#3498DB",
            hover_color="#2980B9"
        )
        self.upload_btn.pack(side="left", fill="x", expand=True, padx=5)

        self.export_btn = ctk.CTkButton(
            actions_frame,
            text="Export Downloaded",
            command=self.on_export,
            state="disabled",
            fg_color="#9B59B6",
            hover_color="#8E44AD"
        )
        self.export_btn.pack(side="right", fill="x", expand=True, padx=5)

    def _update_button_states(self) -> None:
        """Dynamically enables/disables the upload button."""
        if self.device_connected and self.selected_path:
            self.upload_btn.configure(state="normal")
        else:
            self.upload_btn.configure(state="disabled")

    def _handle_browse(self) -> None:
        """Launches a file selection dialog."""
        path = filedialog.askopenfilename(
            title="Select Patient CSV File",
            filetypes=[("CSV Files", "*.csv"), ("All Files", "*.*")]
        )
        if path:
            self.selected_path = path
            self.path_entry.delete(0, "end")
            self.path_entry.insert(0, path)
            self.validate_btn.configure(state="normal")
            self._update_button_states()

    def _handle_validate(self) -> None:
        """Fires the validation callback with the file path."""
        if self.selected_path:
            self.on_validate(self.selected_path)

    def _handle_upload(self) -> None:
        """Fires the upload callback with the file path."""
        if self.selected_path:
            self.on_upload(self.selected_path)

    def set_connected_state(self, connected: bool) -> None:
        """Adapts action buttons based on device connections."""
        self.device_connected = connected
        self._update_button_states()

    def set_export_enabled(self, enabled: bool) -> None:
        """Enables/Disables the Export button based on download availability."""
        state = "normal" if enabled else "disabled"
        self.export_btn.configure(state=state)
