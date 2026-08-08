"""
Status Bar Module.
Implements the bottom information bar showing status details.
"""

import customtkinter as ctk


class StatusBar(ctk.CTkFrame):
    """
    Bottom status bar showing application version, device status, and upload status.
    """
    def __init__(self, parent, app_version: str) -> None:
        super().__init__(parent, height=28, corner_radius=0)
        self.pack(side="bottom", fill="x")

        # Left label: Connection and Device details
        self.device_label = ctk.CTkLabel(
            self,
            text="Status: 🔴 Disconnected | Device: None",
            font=("Arial", 11)
        )
        self.device_label.pack(side="left", padx=15, pady=2)

        # Middle label: Task description
        self.task_label = ctk.CTkLabel(
            self,
            text="System Idle",
            font=("Arial", 11)
        )
        self.task_label.pack(side="left", fill="x", expand=True, pady=2)

        # Right label: Application Version
        self.version_label = ctk.CTkLabel(
            self,
            text=f"Version {app_version}",
            font=("Arial", 11)
        )
        self.version_label.pack(side="right", padx=15, pady=2)

    def set_connection_status(self, connected: bool, device_name: str = "None") -> None:
        """Updates connection state and device details labels."""
        if connected:
            self.device_label.configure(
                text=f"Status: 🟢 Connected | Device: {device_name}"
            )
        else:
            self.device_label.configure(
                text="Status: 🔴 Disconnected | Device: None"
            )

    def set_task_status(self, text: str) -> None:
        """Updates the middle progress description."""
        self.task_label.configure(text=text)
