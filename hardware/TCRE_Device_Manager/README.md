# TCRE Device Studio

**TCRE Device Studio** is a production-grade desktop engineering console built to manage and audit patient measurement EEPROM data for the **Temporal Clinical Reasoning Engine (TCRE)**. The application communicates with an Arduino Mega 2560 over USB Serial, loading, validating, sorting, and synchronizing clinical records.

---

## Architecture & Layered Design

The codebase adheres strictly to **SOLID** and **Layered Architecture** principles, cleanly separating layout, business orchestrations, and transport channels:

1. **Presentation Layer (`gui/`)**: CustomTkinter widgets and grids. Leverages asynchronous worker threads to offload serial operations, ensuring the GUI never freezes.
2. **Business Logic Layer (`core/device_manager.py`)**: Intermediary controller orchestrating CSV parses, local backups, and transaction runs.
3. **Data & Translation Models (`models/patient.py`, `core/csv_manager.py`, `core/eeprom_manager.py`)**: Validates CSV rows against strict schemas, manages chronological sorting, and stores EEPROM binaries.
4. **Communication Layer (`core/serial_manager.py`, `core/protocol.py`)**: Handles thread-safe command formatting and serial link transactions.

---

## Folder Structure

```
TCRE_Device_Studio/
│   main.py                 # Main entrypoint
│   requirements.txt        # Application dependencies
│   config.py               # Global styling, timeout, and schema configs
│   README.md               # Technical overview
│
├───core/
│       protocol.py         # Command payload formatting
│       serial_manager.py   # Thread-safe read/write serial port wrapper
│       csv_manager.py      # Loaded CSV parser & sorting checks
│       device_manager.py   # Orchestrating business logic manager
│       eeprom_manager.py   # EEPROM backup outputs & restores
│
├───gui/
│       main_window.py      # Grid layouts and async thread bindings
│       device_panel.py     # Scanning ports and status stats panel
│       command_panel.py    # Manual firmware command triggers
│       csv_panel.py        # Validating & uploading files
│       console_panel.py    # Custom color-coded logging shell
│       progress_panel.py   # ETA & speed indicator bar
│       status_bar.py       # Current connectivity banner
│
├───models/
│       patient.py          # Strict Patient model representation
│
├───utils/
│       logger.py           # Thread-safe logging redirector
│       validator.py        # Date/Time and clinical value validates
│       helpers.py          # Math timers and speed stats
│
├───exports/                # User CSV download directory
├───data/                   # local EEPROM image backup storage
└───assets/                 # Resource files
```

---

## Installation & Running

### Requirements
- Python 3.12+
- Dependencies listed in `requirements.txt`

### Setup
1. Open a terminal in the project directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the application:
   ```bash
   python main.py
   ```

---

## Usage Workflow

### 1. CSV Import & Upload
1. Click **Browse** under the CSV panel and select a patient log file.
2. Click **Validate CSV** to check values (Age, Sex, dates, leap years). Results and errors display inside the color-coded console.
3. Connect the device by picking a COM Port and hitting **Connect**.
4. Click **Upload CSV** to upload records. The progress panel displays record index count, transfer speeds, and estimated time remaining.

### 2. Device Operations & Backup
- **PING**: Check device responsiveness.
- **INFO**: Query device firmware versions and configurations.
- **GET DATA**: Downloads records in EEPROM. Downloaded records automatically trigger a timestamped local backup under the `data/` folder and can be exported as a CSV by clicking **Export Downloaded**.
- **CLEAR / FORMAT**: Erase or reconstruct EEPROM pointers.

---

## Data Schema & Communication Protocol

### CSV Schema
CSV inputs must contain the following header titles (case-sensitive):
`PatientID, Name, Age, Sex, Year, Month, Day, Hour, Minute, Second, Glucose, ConsumedSugarLast6Hours`

- **Age**: 1 to 120 (integer)
- **Sex**: M or F (case-insensitive, normalized internally to uppercase)
- **Glucose**: Integer > 0
- **Timestamp**: Values (Year, Month, etc.) must construct a valid date/time.
- **ConsumedSugarLast6Hours**: YES or NO. Indicates whether the patient consumed sugary food or beverages within six hours before the glucose measurement. Case-insensitive on import, validated and normalized to uppercase, stored internally as `consumed_sugar_last_6_hours` (boolean). Any other value is rejected.

### Clinical Context Parameters Extensibility
The desktop application is designed to be highly extensible. Future clinical contextual parameters (e.g. `PhysicalActivityLast6Hours`, `MedicationTaken`, `FastingState`, etc.) can be added by simply updating `CLINICAL_CONTEXT_PARAMS` in `config.py`. The validation engine, model parser, GUI previews, and CSV exporter will automatically adapt to these configuration additions.

### Commands & Responses
- **PING**: TX: `PING` | RX: `OK,PONG`
- **COUNT**: TX: `COUNT` | RX: `OK,COUNT,<record_count>`
- **INFO**: TX: `INFO` | RX: `OK,INFO,<DeviceName>,<FW_Version>,<MaxCapacity>`
- **GET_DATA**: TX: `GET_DATA` | RX: `BEGIN_DATA \n <Records...> \n END_DATA`
- **STORE**: TX: `STORE,<PatientID>,<Name>,<Age>,<Sex>,<Year>,<Month>,<Day>,<Hour>,<Minute>,<Second>,<Glucose>` | RX: `OK` (Note: Clinical context parameters are NOT sent over the serial line as the Arduino firmware does not support them).

---

## Future Roadmap

The application is structured to facilitate seamless upgrades:
- **SQLite Database Module**: Move local memory arrays to SQLite cache layers for clinical querying.
- **Temporal Reasoning & Visualization**: Implement clinical graphs (velocity, acceleration, and glucose volatility charts).
- **Latent Risk Predictors**: Integrate risk models evaluating volatility matrices to predict latent risk profiles.
- **Recommendation & Reports**: Build engine recommendations and export clinical PDF summaries.
