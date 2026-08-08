"""
Progress Panel Module.
Implements the progress bar, statistics, and ETA estimator widget.
"""

import customtkinter as ctk
from utils.helpers import calculate_progress_stats, format_time


class ProgressPanel(ctk.CTkFrame):
    """
    Shows graphical progress bar and transfer statistics (ETA, speed, counters).
    """
    def __init__(self, parent) -> None:
        super().__init__(parent)

        # Main header
        title = ctk.CTkLabel(
            self,
            text="Transfer & Progress Status",
            font=("Arial", 16, "bold"),
            anchor="w"
        )
        title.pack(fill="x", padx=15, pady=(15, 10))

        # Progress bar
        self.progress_bar = ctk.CTkProgressBar(self)
        self.progress_bar.pack(fill="x", padx=15, pady=5)
        self.progress_bar.set(0)

        # Label Container
        stats_frame = ctk.CTkFrame(self, fg_color="transparent")
        stats_frame.pack(fill="x", padx=15, pady=(5, 10))

        # Progress Label (e.g. 45% (225 / 500))
        self.pct_lbl = ctk.CTkLabel(
            stats_frame,
            text="Progress: Idle (0%)",
            font=("Arial", 12)
        )
        self.pct_lbl.pack(side="left")

        # Speed and ETA details (right aligned)
        self.meta_lbl = ctk.CTkLabel(
            stats_frame,
            text="Speed: -- records/s | ETA: --:--",
            font=("Arial", 12)
        )
        self.meta_lbl.pack(side="right")

    def reset_progress(self) -> None:
        """Resets the statistics and progress gauge."""
        self.progress_bar.set(0)
        self.pct_lbl.configure(text="Progress: Idle (0%)")
        self.meta_lbl.configure(text="Speed: -- records/s | ETA: --:--")

    def update_progress(self, current: int, total: int, elapsed_seconds: float) -> None:
        """
        Updates the progress bar and recalculates speed and ETA.
        """
        if total <= 0:
            self.reset_progress()
            return

        # Cap progress ratio
        ratio = min(current / total, 1.0)
        self.progress_bar.set(ratio)

        # Update percent label
        pct = int(ratio * 100)
        self.pct_lbl.configure(text=f"Progress: {pct}% ({current} / {total})")

        # Estimate speed and ETA
        eta_sec, speed = calculate_progress_stats(total, current, elapsed_seconds)
        
        speed_txt = f"{speed:.1f} records/s" if speed > 0 else "-- records/s"
        eta_txt = format_time(eta_sec) if speed > 0 else "--:--"
        
        self.meta_lbl.configure(text=f"Speed: {speed_txt} | ETA: {eta_txt}")
