"""
Console Panel Module.
Implements a color-coded scrolling logging console widget for the GUI.
"""

from datetime import datetime
import customtkinter as ctk
from tkinter import filedialog, messagebox


class ConsolePanel(ctk.CTkFrame):
    """
    GUI Panel holding a scrolling text console that logs system events with severity styling.
    """
    def __init__(self, parent) -> None:
        super().__init__(parent)

        # Header Frame
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=10, pady=(10, 5))

        title = ctk.CTkLabel(
            header,
            text="System Console",
            font=("Arial", 16, "bold")
        )
        title.pack(side="left")

        clear_btn = ctk.CTkButton(
            header,
            text="Clear",
            width=60,
            height=26,
            command=self.clear_console
        )
        clear_btn.pack(side="right", padx=5)

        export_btn = ctk.CTkButton(
            header,
            text="Export Logs",
            width=90,
            height=26,
            command=self.export_logs
        )
        export_btn.pack(side="right", padx=5)

        # Text Console (using CTkTextbox)
        self.textbox = ctk.CTkTextbox(
            self,
            font=("Consolas", 12),
            wrap="word",
            activate_scrollbars=True
        )
        self.textbox.pack(fill="both", expand=True, padx=10, pady=(0, 10))

        # Setup Tag Coloring
        # Note: CustomTkinter textbox encapsulates standard tkinter Text widget tags
        # access via self.textbox.tag_config
        self.textbox.tag_config("INFO", foreground="#CCCCCC")
        self.textbox.tag_config("SUCCESS", foreground="#2ECC71")
        self.textbox.tag_config("WARNING", foreground="#F39C12")
        self.textbox.tag_config("ERROR", foreground="#E74C3C")
        self.textbox.tag_config("TX", foreground="#3498DB")
        self.textbox.tag_config("RX", foreground="#BDC3C7")

        self.log_message("System Console initialized.", "SUCCESS")

    def log_message(self, message: str, level: str = "INFO") -> None:
        """
        Appends a timestamped, color-coded message to the textbox.
        """
        # Ensure we run in a GUI-safe environment
        timestamp = datetime.now().strftime("%H:%M:%S")
        formatted = f"[{timestamp}] {message}\n"
        
        # Enable editing, insert, and disable editing
        self.textbox.configure(state="normal")
        self.textbox.insert("end", formatted, level)
        self.textbox.configure(state="disabled")
        
        # Scroll to bottom
        self.textbox.see("end")

    def clear_console(self) -> None:
        """Clears all text in the console."""
        self.textbox.configure(state="normal")
        self.textbox.delete("1.0", "end")
        self.textbox.configure(state="disabled")

    def export_logs(self) -> None:
        """Exports the console content to a text file."""
        content = self.textbox.get("1.0", "end-1c")
        if not content.strip():
            messagebox.showinfo("Export Logs", "Console is empty.")
            return

        filepath = filedialog.asksaveasfilename(
            defaultextension=".txt",
            filetypes=[("Text Files", "*.txt"), ("All Files", "*.*")],
            title="Export Console Logs"
        )
        
        if filepath:
            try:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                self.log_message(f"Logs successfully exported to {filepath}", "SUCCESS")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to save log file: {e}")
                self.log_message(f"Failed to export logs: {e}", "ERROR")
