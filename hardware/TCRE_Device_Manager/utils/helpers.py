"""
Helpers Utility Module.
Contains reusable helper functions for math, timing, formatting, and estimations.
"""

from typing import Tuple


def calculate_progress_stats(
    total: int,
    current: int,
    elapsed_seconds: float
) -> Tuple[float, float]:
    """
    Calculates estimated remaining seconds and items per second.
    Returns (estimated_seconds_remaining, items_per_second).
    """
    if current <= 0 or elapsed_seconds <= 0:
        return 0.0, 0.0

    items_per_second = current / elapsed_seconds
    remaining_items = total - current
    estimated_seconds_remaining = remaining_items / items_per_second

    return estimated_seconds_remaining, items_per_second


def format_time(seconds: float) -> str:
    """
    Formats a duration in seconds to a human-readable HH:MM:SS or MM:SS format.
    """
    if seconds < 0:
        return "Unknown"
    
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)

    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"
