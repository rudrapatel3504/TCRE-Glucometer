# Microcontroller & Serial Bridge Integration Manual

This document details the communication handshake protocol between the microcontroller firmware (Mega 2560/ESP32) and the Python bridge gateway.

---

## 1. Serial Handshake Protocol

Hardware communication relies on a direct USB-to-UART Serial link.

**Connection parameters:**
- **Baud Rate**: `115200`
- **Data Bits**: `8`
- **Parity**: `None`
- **Stop Bits**: `1`
- **Flow Control**: `None`

---

## 2. Instruction Commands Reference

The Python bridge sends text instructions ended by a newline character `\n`. The microcontroller responds with a success status and data.

### CMD 1: `READ`
Instructs the microcontroller to transfer all clinical records from EEPROM memory.

**Request:**
```
READ\n
```

**Response Format:**
The device dumps record streams line-by-line in a comma-separated format, ending with `[DONE]`.
```
PatientID,Name,Age,Sex,Year,Month,Day,Hour,Minute,Second,Glucose,ConsumedSugarLast6Hours
88291,Evelyn Harper,54,Female,2026,7,3,10,0,0,120,YES
88291,Evelyn Harper,54,Female,2026,7,3,13,30,0,145,NO
[DONE]\n
```

### CMD 2: `CLEAR`
Instructs the microcontroller to wipe the EEPROM storage after successful transmission confirmation.

**Request:**
```
CLEAR\n
```

**Response:**
```
CLEARED\n
```

---

## 3. Python Bridge Gateway Implementation

The `TCRE_Device_Manager` application runs locally as a python process. It operates in a polling loop:

1. **Query Status**: Polls the REST API `GET /api/device/status` every 1 second.
2. **Status Evaluation**:
   - If `importRequested` is `true`, it begins the ingestion sequence.
   - It updates the backend status using `POST /api/device/status` with `status: "Connecting"`.
3. **Serial Acquisition**:
   - Opens the configured serial port (e.g. `COM3` on Windows, `/dev/ttyUSB0` on Linux).
   - Writes `READ\n`.
   - Listens to incoming lines. As records arrive, it calculates the download progress and posts progress updates back to the backend.
   - Saves a local CSV backup in `hardware/TCRE_Device_Manager/exports/`.
4. **Data Upload**:
   - Posts the parsed records as a JSON array to `POST /api/device/upload`.
5. **Memory Clear**:
   - If the upload response returns `success: true`, the bridge writes `CLEAR\n` to the serial port.
   - Upon receiving `CLEARED` from the device, it posts `arduinoCleared: true` and `status: "Completed"` to `POST /api/device/status`.
6. **Closing**:
   - Closes the serial connection and returns to idle state.
