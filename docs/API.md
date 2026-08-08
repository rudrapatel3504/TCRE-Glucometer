# REST API Reference Manual

The REST API manages patient profiles, ingests telemetry data from the device bridge, and tracks serial connection events.

All endpoints are prefixed with `/api`.

---

## 1. Patient Operations

### GET `/api/patients`
Retrieves all patients, their metadata, and sorted clinical measurements.

**Response (200 OK):**
```json
{
  "success": true,
  "patients": [
    {
      "patientId": "P-88291",
      "name": "Evelyn Harper",
      "age": 54,
      "sex": "Female",
      "measurements": [
        {
          "date": "2026-06-30T08:00:00.000Z",
          "glucose": 95,
          "source": "system",
          "consumedSugarLast6Hours": "NO"
        }
      ],
      "firstMeasurementDate": "2026-06-30T08:00:00.000Z",
      "latestMeasurementDate": "2026-06-30T08:00:00.000Z",
      "latestGlucose": 95,
      "sugarYesCount": 0,
      "sugarNoCount": 1
    }
  ]
}
```

### POST `/api/patients`
Manually ingests patient measurements.

**Request Body:**
```json
[
  {
    "patientId": "P-88291",
    "name": "Evelyn Harper",
    "age": 54,
    "sex": "Female",
    "date": "2026-07-03T10:00:00.000Z",
    "glucose": 120,
    "source": "manual",
    "consumedSugarLast6Hours": "YES"
  }
]
```

**Response (200 OK):**
```json
{
  "success": true,
  "patientsAdded": 0,
  "measurementsAdded": 1,
  "duplicatesIgnored": 0,
  "databaseUpdated": true,
  "patients": [...]
}
```

### DELETE `/api/patients`
Deletes a patient profile completely or removes a specific measurement.

**Query Parameters:**
- `patientId` (string, Required): The target patient identifier.
- `date` (string, Optional): If provided, only deletes the measurement matching this ISO timestamp. If omitted, deletes the entire patient profile.

**Response (200 OK):**
```json
{
  "success": true,
  "patients": [...]
}
```

---

## 2. IoT Device operations

### GET `/api/device/status`
Returns the current synchronization status, connection parameters, and lists newly uploaded records. Used by the Python bridge for polling commands.

**Response (200 OK):**
```json
{
  "status": {
    "connected": false,
    "model": "",
    "firmware": "",
    "recordCount": 0,
    "capacity": 0,
    "status": "Idle",
    "progress": 0,
    "error": null,
    "importRequested": false
  },
  "patients": []
}
```

### POST `/api/device/status`
Updates the volatile synchronization status of the physical hardware connection.

**Request Body:**
```json
{
  "connected": true,
  "status": "Reading EEPROM",
  "progress": 45
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "importRequested": false
}
```

### POST `/api/device/trigger`
Instructs the system that the clinician requested an import. Sets `importRequested` to `true`.

**Response (200 OK):**
```json
{
  "success": true
}
```

### POST `/api/device/upload`
Uploads raw records read from the microcontroller. Translates format, dedupes records, writes audit log, and marks status to `Completed`.

**Request Body:**
```json
[
  {
    "PatientID": 88291,
    "Name": "Evelyn Harper",
    "Age": 54,
    "Sex": "Female",
    "Year": 2026,
    "Month": 7,
    "Day": 3,
    "Hour": 10,
    "Minute": 0,
    "Second": 0,
    "Glucose": 120,
    "ConsumedSugarLast6Hours": "YES"
  }
]
```

**Response (200 OK):**
```json
{
  "success": true,
  "patientsAdded": 0,
  "measurementsAdded": 1,
  "duplicatesIgnored": 0,
  "databaseUpdated": true
}
```

---

## 3. Server Health Operations

### GET `/api/health`
System check for health validation during orchestration.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "uptime": 234.54,
  "timestamp": "2026-08-07T06:34:18.000Z",
  "environment": "production"
}
```
