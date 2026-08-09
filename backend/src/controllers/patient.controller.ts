import type { Request, Response, NextFunction } from 'express';
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
      if (body && body.patientId && body.name) {
        const patients = db.getPatients();
        if (patients.some(p => p.patientId === body.patientId)) {
          res.status(400).json({ success: false, error: 'Patient ID already exists' });
          return;
        }
        const newPatient = {
          patientId: body.patientId,
          name: body.name,
          age: Number(body.age || 0),
          sex: body.sex || 'Unknown',
          measurements: [],
          firstMeasurementDate: '',
          latestMeasurementDate: '',
          latestGlucose: 0,
          sugarYesCount: 0,
          sugarNoCount: 0,
        };
        patients.push(newPatient);
        db.savePatients(patients);
        res.json({
          success: true,
          patients,
        });
        return;
      }
      res.status(400).json({ success: false, error: 'Invalid payload: expected an array of measurements or patient details' });
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
