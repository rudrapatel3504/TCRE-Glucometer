import { Request, Response, NextFunction } from 'express';
import * as db from '../lib/db';

export function getPatients(req: Request, res: Response, next: NextFunction) {
  try {
    const patients = db.getPatients();
    res.json({ success: true, patients });
  } catch (error) {
    next(error);
  }
}

export function ingestMeasurements(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body;
    if (!Array.isArray(body)) {
      res.status(400).json({ success: false, error: 'Invalid payload: expected an array of measurements' });
      return;
    }
    const result = db.ingestMeasurements(body);
    res.json({
      success: true,
      patientsAdded: result.patientsAdded,
      measurementsAdded: result.measurementsAdded,
      duplicatesIgnored: result.duplicatesIgnored,
      databaseUpdated: result.databaseUpdated,
      patients: result.patients,
    });
  } catch (error) {
    next(error);
  }
}

export function deletePatientOrMeasurement(req: Request, res: Response, next: NextFunction) {
  try {
    const patientId = req.query.patientId as string;
    const date = req.query.date as string;

    if (!patientId) {
      res.status(400).json({ success: false, error: 'patientId is required' });
      return;
    }

    let updatedPatients;
    if (date) {
      updatedPatients = db.deleteMeasurement(patientId, date);
    } else {
      updatedPatients = db.deletePatient(patientId);
    }

    res.json({ success: true, patients: updatedPatients });
  } catch (error) {
    next(error);
  }
}
