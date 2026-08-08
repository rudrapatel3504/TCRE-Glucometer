"""
Serial Manager Module.
Provides thread-safe, low-level serial communication with the Arduino device.
"""

import threading
import time
from typing import List, Optional
import serial
import serial.tools.list_ports

from config import DEFAULT_BAUDRATE, DEFAULT_TIMEOUT, AUTO_RESET_DELAY
from utils.logger import get_logger

logger = get_logger()


class SerialManager:
    """
    Handles physical serial connections and thread-safe data transfers.
    """
    def __init__(self) -> None:
        self.serial: Optional[serial.Serial] = None
        self._lock = threading.Lock()

    def list_ports(self) -> List[str]:
        """
        Scans and returns a list of available serial COM ports.
        """
        return [port.device for port in serial.tools.list_ports.comports()]

    def connect(self, port: str, baudrate: int = DEFAULT_BAUDRATE) -> bool:
        """
        Establishes a connection to the specified COM port.
        """
        with self._lock:
            if self.is_connected():
                self._disconnect_unsafe()

            try:
                logger.info(f"Opening port {port} at {baudrate} baud...")
                self.serial = serial.Serial(
                    port=port,
                    baudrate=baudrate,
                    timeout=DEFAULT_TIMEOUT,
                    write_timeout=DEFAULT_TIMEOUT
                )
                
                # Arduino auto-resets on serial connection. Must wait for bootloader.
                logger.info(f"Port opened. Waiting {AUTO_RESET_DELAY}s for device reset...")
                time.sleep(AUTO_RESET_DELAY)
                
                self.serial.reset_input_buffer()
                self.serial.reset_output_buffer()
                
                logger.info(f"Successfully connected to {port}.")
                return True
            except Exception as e:
                logger.error(f"Failed to connect to {port}: {e}")
                self._disconnect_unsafe()
                return False

    def disconnect(self) -> None:
        """
        Closes the active serial connection.
        """
        with self._lock:
            self._disconnect_unsafe()

    def _disconnect_unsafe(self) -> None:
        """
        Performs actual disconnection. Must be called inside lock.
        """
        if self.serial:
            try:
                if self.serial.is_open:
                    self.serial.close()
                logger.info("Serial connection closed.")
            except Exception as e:
                logger.error(f"Error closing serial connection: {e}")
            finally:
                self.serial = None

    def is_connected(self) -> bool:
        """
        Returns True if the serial port is open and active.
        """
        return self.serial is not None and self.serial.is_open

    def send(self, command: str) -> None:
        """
        Writes a command string to the serial interface.
        """
        if not self.is_connected() or not self.serial:
            raise serial.SerialException("Device not connected.")

        try:
            self.serial.reset_input_buffer()
        except Exception as e:
            logger.debug(f"Failed to reset input buffer: {e}")

        logger.debug(f"TX: {command}")
        payload = (command + "\n").encode("utf-8")
        self.serial.write(payload)
        self.serial.flush()

    def read_line(self) -> str:
        """
        Reads a single line from the serial interface, stripped of newlines.
        """
        if not self.is_connected() or not self.serial:
            raise serial.SerialException("Device not connected.")

        raw_line = self.serial.readline()
        if not raw_line and self.serial.timeout:
            # Check if port is still responsive
            try:
                # If we read nothing, let's verify port still exists/is open
                if not self.serial.is_open:
                    raise serial.SerialException("Connection lost.")
            except Exception:
                raise serial.SerialException("Connection lost.")

        line = raw_line.decode("utf-8", errors="ignore").strip()
        if line:
            logger.debug(f"RX: {line}")
        return line

    def send_and_receive(self, command: str) -> str:
        """
        Sends a command and waits for a single-line response.
        Thread-safe wrapper.
        """
        with self._lock:
            self.send(command)
            return self.read_line()

    def send_and_receive_block(
        self,
        command: str,
        start_token: str,
        end_token: str
    ) -> List[str]:
        """
        Sends a command and reads lines between start_token and end_token.
        Thread-safe wrapper.
        """
        with self._lock:
            self.send(command)
            
            lines: List[str] = []
            started = False
            start_time = time.time()

            while True:
                # Check for timeout if no responses are arriving
                if time.time() - start_time > 15.0:  # Safety fallback for block reads
                    logger.warning("Block read operation timed out after 15 seconds.")
                    break

                line = self.read_line()
                
                # If we got an empty line due to read timeout, keep checking
                if not line:
                    continue

                # Reset timeout watch on activity
                start_time = time.time()

                if line == start_token:
                    started = True
                    continue

                if started:
                    if line == end_token:
                        break
                    lines.append(line)
                    
            return lines
