"""
Device Panel Module.
Implements the connection and device metadata panels.
"""

from typing import Callable, List
import customtkinter as ctk
from config import DEFAULT_MAX_CAPACITY


class DevicePanel(ctk.CTkFrame):
    """
    Combines Device Connection control and Device Information display.
    """
    def __init__(
        self,
        parent,
        on_connect: Callable[[str], None],
        on_disconnect: Callable[[], None],
        on_refresh: Callable[[], List[str]]
    ) -> None:
        super().__init__(parent)
        self.on_connect = on_connect
        self.on_disconnect = on_disconnect
        self.on_refresh = on_refresh

        # --- Section 1: Device Connection ---
        conn_frame = ctk.CTkLabel(
            self,
            text="Device Connection",
            font=("Arial", 16, "bold"),
            anchor="w"
        )
        conn_frame.pack(fill="x", padx=15, pady=(15, 10))

        grid_frame = ctk.CTkFrame(self)
        grid_frame.pack(fill="x", padx=10, pady=5)

        # COM Port row
        self.port_label = ctk.CTkLabel(grid_frame, text="COM Port:")
        self.port_label.grid(row=0, column=0, padx=10, pady=10, sticky="w")

        self.port_menu = ctk.CTkOptionMenu(
            grid_frame,
            values=["No Ports Detected"],
            width=160
        )
        self.port_menu.grid(row=0, column=1, padx=10, pady=10)

        self.refresh_btn = ctk.CTkButton(
            grid_frame,
            text="Refresh",
            width=70,
            command=self.refresh_ports
        )
        self.refresh_btn.grid(row=0, column=2, padx=10, pady=10)

        # Action Buttons
        btn_frame = ctk.CTkFrame(self, fg_color="transparent")
        btn_frame.pack(fill="x", padx=10, pady=5)

        self.connect_btn = ctk.CTkButton(
            btn_frame,
            text="Connect",
            command=self._handle_connect,
            fg_color="#2ECC71",
            hover_color="#27AE60",
            text_color="black"
        )
        self.connect_btn.pack(side="left", fill="x", expand=True, padx=5)

        self.disconnect_btn = ctk.CTkButton(
            btn_frame,
            text="Disconnect",
            command=self.on_disconnect,
            state="disabled",
            fg_color="#E74C3C",
            hover_color="#C0392B"
        )
        self.disconnect_btn.pack(side="right", fill="x", expand=True, padx=5)

        # Connection Status Info
        self.status_lbl = ctk.CTkLabel(
            self,
            text="🔴 Disconnected",
            text_color="#E74C3C",
            font=("Arial", 14, "bold")
        )
        self.status_lbl.pack(padx=15, pady=10)

        # Divider
        divider = ctk.CTkFrame(self, height=2, fg_color="gray30")
        divider.pack(fill="x", padx=15, pady=15)

        # --- Section 2: Device Information ---
        info_title = ctk.CTkLabel(
            self,
            text="Device Information",
            font=("Arial", 16, "bold"),
            anchor="w"
        )
        info_title.pack(fill="x", padx=15, pady=(0, 10))

        info_frame = ctk.CTkFrame(self)
        info_frame.pack(fill="x", padx=10, pady=5)

        self.info_name = ctk.CTkLabel(info_frame, text="Device Name: --", anchor="w")
        self.info_name.pack(fill="x", padx=15, pady=5)

        self.info_fw = ctk.CTkLabel(info_frame, text="Firmware: --", anchor="w")
        self.info_fw.pack(fill="x", padx=15, pady=5)

        self.info_records = ctk.CTkLabel(info_frame, text="Record Count: --", anchor="w")
        self.info_records.pack(fill="x", padx=15, pady=5)

        self.info_capacity = ctk.CTkLabel(info_frame, text="Max Capacity: --", anchor="w")
        self.info_capacity.pack(fill="x", padx=15, pady=5)

        # EEPROM Usage progress bar
        self.usage_lbl = ctk.CTkLabel(self, text=f"EEPROM Usage: 0% (0 / {DEFAULT_MAX_CAPACITY})", anchor="w")
        self.usage_lbl.pack(fill="x", padx=15, pady=(10, 2))

        self.usage_bar = ctk.CTkProgressBar(self, width=200)
        self.usage_bar.pack(fill="x", padx=15, pady=(0, 15))
        self.usage_bar.set(0)

        # Auto-refresh ports on startup
        self.refresh_ports()

    def refresh_ports(self) -> None:
        """Invokes refresh callback and updates COM port values."""
        ports = self.on_refresh()
        if ports:
            self.port_menu.configure(values=ports)
            # Default to first port
            self.port_menu.set(ports[0])
            self.connect_btn.configure(state="normal")
        else:
            self.port_menu.configure(values=["No Ports Detected"])
            self.port_menu.set("No Ports Detected")
            self.connect_btn.configure(state="disabled")

    def _handle_connect(self) -> None:
        """Extracts port and fires connect callback."""
        port = self.port_menu.get()
        if port and port != "No Ports Detected":
            self.on_connect(port)

    def set_connected_state(self, connected: bool) -> None:
        """Adjusts enabling/disabling of buttons based on connectivity."""
        if connected:
            self.status_lbl.configure(text="🟢 Connected", text_color="#2ECC71")
            self.connect_btn.configure(state="disabled")
            self.disconnect_btn.configure(state="normal")
            self.port_menu.configure(state="disabled")
            self.refresh_btn.configure(state="disabled")
        else:
            self.status_lbl.configure(text="🔴 Disconnected", text_color="#E74C3C")
            self.connect_btn.configure(state="normal")
            self.disconnect_btn.configure(state="disabled")
            self.port_menu.configure(state="normal")
            self.refresh_btn.configure(state="normal")
            
            # Clear info panel fields
            self.info_name.configure(text="Device Name: --")
            self.info_fw.configure(text="Firmware: --")
            self.info_records.configure(text="Record Count: --")
            self.info_capacity.configure(text="Max Capacity: --")
            self.usage_lbl.configure(text=f"EEPROM Usage: 0% (0 / {DEFAULT_MAX_CAPACITY})")
            self.usage_bar.set(0)

    def update_device_info(
        self,
        name: str,
        fw_version: str,
        records: int,
        capacity: int
    ) -> None:
        """Populates fields and evaluates the EEPROM gauge."""
        self.info_name.configure(text=f"Device Name: {name}")
        self.info_fw.configure(text=f"Firmware: {fw_version}")
        self.info_records.configure(text=f"Record Count: {records}")
        self.info_capacity.configure(text=f"Max Capacity: {capacity}")

        if capacity > 0:
            usage_pct = min((records / capacity), 1.0)
            self.usage_bar.set(usage_pct)
            self.usage_lbl.configure(
                text=f"EEPROM Usage: {int(usage_pct * 100)}% ({records} / {capacity})"
            )
        else:
            self.usage_bar.set(0)
            self.usage_lbl.configure(text="EEPROM Usage: 0% (0 / 0)")
