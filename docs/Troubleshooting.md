# System Troubleshooting Reference

This manual covers diagnostic procedures for identifying and fixing faults in the **TCRE Glucometer System**.

---

## 1. Port Collisions

**Symptom**: `Error: listen EADDRINUSE: address already in use :::3000` or `:::3001`
- **Cause**: Next.js (port 3000) or Express (port 3001) is already running in the background.
- **Remedy**:
  - Windows:
    ```powershell
    # Find process ID running on port 3000
    Get-NetTCPConnection -LocalPort 3000 | Select-Object -Property OwningProcess
    # Terminate process
    Stop-Process -Id <PID> -Force
    ```

---

## 2. Ingestion Failures (Python Bridge)

**Symptom**: `ConnectionRefusedError: [Errno 10061] No connection could be made because the target machine actively refused it`
- **Cause**: The Python bridge is running, but the Next.js proxy server is offline.
- **Remedy**: Start the development servers:
  ```bash
  npm run dev
  ```
  Ensure Next.js is listening on `http://localhost:3000`.

---

## 3. Database Write Locks & Corruption

**Symptom**: `SyntaxError: Unexpected end of JSON input`
- **Cause**: Concurrent write operations truncated `patient_db.json`.
- **Remedy**:
  1. Terminate development servers.
  2. Restore database files from backup:
     ```bash
     # Copy latest backup file
     cp database/data/logs/patient_db_backup.json database/data/patient_db.json
     ```
  3. Validate JSON file format:
     ```bash
     node -e "JSON.parse(require('fs').readFileSync('database/data/patient_db.json'))"
     ```
