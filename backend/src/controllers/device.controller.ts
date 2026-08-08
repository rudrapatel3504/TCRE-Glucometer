import type { Request, Response, NextFunction } from 'express';
import * as deviceState from '../lib/deviceState';
import * as db from '../lib/db';

export function getDeviceStatus(req: Request, res: Response) {
  res.json({
    status: deviceState.deviceStatus,
    patients: deviceState.importedPatients,
  });
}

export function updateDeviceStatus(req: Request, res: Response) {
  try {
    const body = req.body;
    deviceState.setDeviceStatus(body);
    res.json({
      success: true,
      importRequested: deviceState.deviceStatus.importRequested,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
}

export function triggerImport(req: Request, res: Response) {
  deviceState.setDeviceStatus({
    importRequested: true,
    progress: 0,
    status: "Connecting",
    error: null,
    patientsAdded: 0,
    measurementsAdded: 0,
    duplicatesIgnored: 0,
    databaseUpdated: false,
    arduinoCleared: false,
    clearFailed: false,
    importTime: "",
    importDuration: "",
    lastTriggerTime: new Date().toISOString(),
  });
  deviceState.setImportedPatients([]);
  res.json({ success: true });
}

export function uploadRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const rawRecords = req.body;
    if (!Array.isArray(rawRecords)) {
      res.status(400).json({ success: false, error: 'Invalid payload: expected an array of patient records' });
      return;
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const measurements = rawRecords.map((item: any) => {
      const dateStr = `${item.Year}-${pad(item.Month)}-${pad(item.Day)}T${pad(item.Hour)}:${pad(item.Minute)}:${pad(item.Second)}.000Z`;
      return {
        date: dateStr,
        glucose: Number(item.Glucose),
        source: 'csv_upload',
        consumedSugarLast6Hours: item.ConsumedSugarLast6Hours === 'YES' ? 'YES' : 'NO',
        patientId: String(item.PatientID),
        name: item.Name,
        age: Number(item.Age),
        sex: item.Sex,
      };
    });

    const result = db.ingestMeasurements(measurements);
    deviceState.setImportedPatients(result.patients);

    const now = new Date();
    const triggerTime = deviceState.deviceStatus.lastTriggerTime 
      ? new Date(deviceState.deviceStatus.lastTriggerTime) 
      : now;
    const durationSec = ((now.getTime() - triggerTime.getTime()) / 1000).toFixed(1);
    const importDuration = `${durationSec}s`;

    const importDate = now.toISOString().split('T')[0];
    const importTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    db.addImportLog({
      importDate,
      importTime,
      deviceName: deviceState.deviceStatus.model || 'TCRE Device',
      measurementsImported: result.measurementsAdded,
      duplicatesIgnored: result.duplicatesIgnored,
      importDuration,
    });

    deviceState.setDeviceStatus({
      status: "Completed",
      progress: 100,
      importRequested: false,
      error: null,
      patientsAdded: result.patientsAdded,
      measurementsAdded: result.measurementsAdded,
      duplicatesIgnored: result.duplicatesIgnored,
      databaseUpdated: result.databaseUpdated,
      importTime: `${importDate} ${importTime}`,
      importDuration,
    });

    console.log(`[API] Successfully imported/merged ${result.patients.length} patients. New measurements: ${result.measurementsAdded}, duplicates ignored: ${result.duplicatesIgnored}.`);

    res.json({
      success: true,
      patientsAdded: result.patientsAdded,
      measurementsAdded: result.measurementsAdded,
      duplicatesIgnored: result.duplicatesIgnored,
      databaseUpdated: result.databaseUpdated,
    });
  } catch (error: any) {
    deviceState.setDeviceStatus({
      status: "Error",
      error: error.message,
      importRequested: false,
    });
    next(error);
  }
}
