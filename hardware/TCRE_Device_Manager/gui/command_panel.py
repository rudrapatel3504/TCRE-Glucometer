"""
Command Panel Module.
Provides buttons to dispatch raw commands directly to the firmware.
"""

from typing import Callable
import customtkinter as ctk


class CommandPanel(ctk.CTkFrame):
    """
    Control dashboard containing manual command execution buttons.
    """
    def __init__(self, parent, on_command_execute: Callable[[str], None]) -> None:
        super().__init__(parent)
        self.on_command_execute = on_command_execute
        self.buttons = {}

        # Header Title
        title = ctk.CTkLabel(
            self,
            text="Device Commands",
            font=("Arial", 16, "bold"),
            anchor="w"
        )
        title.pack(fill="x", padx=15, pady=(15, 10))

        # Command Buttons Grid
        grid = ctk.CTkFrame(self)
        grid.pack(fill="both", expand=True, padx=10, pady=(0, 10))

        # Define commands and layout
        commands = [
            ("PING", "PING"),
            ("COUNT", "COUNT"),
            ("HELP", "HELP"),
            ("INFO", "INFO"),
            ("FORMAT", "FORMAT"),
            ("CLEAR", "CLEAR"),
            ("GET DATA", "GET_DATA")
        ]

        # Arrange buttons in a grid: 2 rows of 4 columns max
        for index, (label, cmd_type) in enumerate(commands):
            row = index // 4
            col = index % 4
            
            btn = ctk.CTkButton(
                grid,
                text=label,
                command=lambda ct=cmd_type: self.on_command_execute(ct),
                width=110,
                height=32,
                state="disabled"  # Disabled by default until connected
            )
            btn.grid(row=row, column=col, padx=8, pady=8, sticky="nsew")
            self.buttons[cmd_type] = btn

        # Configure grid expansion
        for col_idx in range(4):
            grid.columnconfigure(col_idx, weight=1)
        for row_idx in range(2):
            grid.rowconfigure(row_idx, weight=1)

    def set_connected_state(self, connected: bool) -> None:
        """Enables/Disables raw commands based on device state."""
        state = "normal" if connected else "disabled"
        for btn in self.buttons.values():
            btn.configure(state=state)
