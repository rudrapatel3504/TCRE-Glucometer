"""
Logger Utility Module.
Handles application-wide logging to console and local files, and provides
a custom handler to forward logs to the GUI console panel.
"""

import logging
import os
from datetime import datetime
from typing import Callable, Optional

# Custom log levels or formats can be defined here
LOG_FORMAT: str = "%(asctime)s - %(levelname)s - %(name)s - %(message)s"


class GUIConsoleHandler(logging.Handler):
    """
    Custom logging handler that forwards log records to a GUI callback function.
    """
    def __init__(self, callback: Callable[[str, str], None]):
        super().__init__()
        self.callback = callback
        self.setFormatter(logging.Formatter("%(asctime)s - %(message)s", datefmt="%H:%M:%S"))

    def emit(self, record: logging.LogRecord) -> None:
        try:
            msg = self.format(record)
            self.callback(msg, record.levelname)
        except Exception:
            self.handleError(record)


def setup_logger(
    name: str = "TCRE_Device_Studio",
    log_file: Optional[str] = None,
    level: int = logging.INFO
) -> logging.Logger:
    """
    Configures and returns the main application logger.
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Clear existing handlers to prevent duplicates
    if logger.hasHandlers():
        logger.handlers.clear()

    # Create formatter
    formatter = logging.Formatter(LOG_FORMAT)

    # Console (Stream) Handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Optional File Handler
    if log_file:
        try:
            log_dir = os.path.dirname(log_file)
            if log_dir and not os.path.exists(log_dir):
                os.makedirs(log_dir, exist_ok=True)
            
            file_handler = logging.FileHandler(log_file, encoding="utf-8")
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        except Exception as e:
            logger.error(f"Failed to initialize file logger: {e}")

    return logger


def get_logger(name: str = "TCRE_Device_Studio") -> logging.Logger:
    """
    Retrieves the existing logger instance.
    """
    return logging.getLogger(name)
