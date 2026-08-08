import fs from 'fs';
import path from 'path';
import type { PatientData, Measurement, ImportLog } from '../../../shared/types';

// Read DB path from environment variables, fallback to relative path
const DATA_DIR = process.env.LOCAL_DB_DIR 
  ? path.resolve(process.env.LOCAL_DB_DIR) 
  : (fs.existsSync(path.join(process.cwd(), '..', 'database', 'data'))
      ? path.join(process.cwd(), '..', 'database', 'data')
      : path.join(__dirname, '..', '..', '..', 'database', 'data'));

const PATIENTS_DB_PATH = path.join(DATA_DIR, 'patient_db.json');
const LOGS_DB_PATH = path.join(DATA_DIR, 'import_logs.json');

// Ensure data directory exists
function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Generate the standard mock data for the initial setup
function generateInitialMockGlucose(days: number): Measurement[] {
  const data: Measurement[] = [];
  const start = new Date("2026-06-30T00:00:00.000Z");

  const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i <= days; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dateStr = currentDate.toISOString().split("T")[0];

    const trendOffset = i * 2.2;
    const volatilityOffset = Math.sin(i * 1.5) * 25;

    const rand1 = pseudoRandom(i * 3 + 1);
    const rand2 = pseudoRandom(i * 3 + 2);
    const rand3 = pseudoRandom(i * 3 + 3);

    data.push({
      date: `${dateStr}T08:00:00.000Z`,
      glucose: Math.floor(95 + trendOffset + volatilityOffset + rand1 * 20),
      source: "system",
      consumedSugarLast6Hours: rand1 > 0.7 ? "YES" : "NO",
    });

    data.push({
      date: `${dateStr}T13:00:00.000Z`,
      glucose: Math.floor(130 + trendOffset - volatilityOffset + rand2 * 30),
      source: "system",
      consumedSugarLast6Hours: rand2 > 0.5 ? "YES" : "NO",
    });

    data.push({
      date: `${dateStr}T20:00:00.000Z`,
      glucose: Math.floor(110 + trendOffset + volatilityOffset * 0.5 + rand3 * 25),
      source: "system",
      consumedSugarLast6Hours: rand3 > 0.6 ? "YES" : "NO",
    });
  }
  return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Get all patient records
export function getPatients(): PatientData[] {
  ensureDataDirectory();
  if (!fs.existsSync(PATIENTS_DB_PATH)) {
    // Initialize with default patient Evelyn Harper
    const mockGlucose = generateInitialMockGlucose(30);
    const defaultPatient: PatientData = {
      patientId: "P-88291",
      name: "Evelyn Harper",
      age: 54,
      sex: "Female",
      measurements: mockGlucose,
      firstMeasurementDate: mockGlucose[0].date,
      latestMeasurementDate: mockGlucose[mockGlucose.length - 1].date,
      latestGlucose: mockGlucose[mockGlucose.length - 1].glucose,
      sugarYesCount: mockGlucose.filter(m => m.consumedSugarLast6Hours === "YES").length,
      sugarNoCount: mockGlucose.filter(m => m.consumedSugarLast6Hours === "NO").length,
    };
    const initialDb = [defaultPatient];
    fs.writeFileSync(PATIENTS_DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }

  try {
    const data = fs.readFileSync(PATIENTS_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read patient database, returning empty array:", error);
    return [];
  }
}

// Save all patient records
export function savePatients(patients: PatientData[]) {
  ensureDataDirectory();
  try {
    fs.writeFileSync(PATIENTS_DB_PATH, JSON.stringify(patients, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write to patient database:", error);
    throw error;
  }
}

// Helper to uniquely identify a measurement to avoid duplicate insertion
// Match criteria: PatientID, Year, Month, Day, Hour, Minute, Second, Glucose
export function isDuplicateMeasurement(
  patientId: string,
  measurementDate: string,
  glucose: number,
  existingMeasurements: Measurement[]
): boolean {
  const targetDateObj = new Date(measurementDate);
  if (isNaN(targetDateObj.getTime())) return false;

  const tYear = targetDateObj.getUTCFullYear();
  const tMonth = targetDateObj.getUTCMonth();
  const tDay = targetDateObj.getUTCDate();
  const tHour = targetDateObj.getUTCHours();
  const tMinute = targetDateObj.getUTCMinutes();
  const tSecond = targetDateObj.getUTCSeconds();

  return existingMeasurements.some((m) => {
    if (m.glucose !== glucose) return false;
    const d = new Date(m.date);
    if (isNaN(d.getTime())) return false;
    return (
      d.getUTCFullYear() === tYear &&
      d.getUTCMonth() === tMonth &&
      d.getUTCDate() === tDay &&
      d.getUTCHours() === tHour &&
      d.getUTCMinutes() === tMinute &&
      d.getUTCSeconds() === tSecond
    );
  });
}

// Merge new measurements cumulative and return transaction statistics
export function ingestMeasurements(newMeasurements: any[]): {
  success: boolean;
  patientsAdded: number;
  measurementsAdded: number;
  duplicatesIgnored: number;
  databaseUpdated: boolean;
  patients: PatientData[];
} {
  const patients = getPatients();
  let patientsAddedCount = 0;
  let measurementsAddedCount = 0;
  let duplicatesIgnoredCount = 0;

  // Group incoming measurements by patientId
  const groups: Record<string, {
    patientId: string;
    name: string;
    age: number;
    sex: string;
    measurements: any[];
  }> = {};

  newMeasurements.forEach((m) => {
    const pid = String(m.patientId || m.PatientID || '');
    if (!pid) return;

    if (!groups[pid]) {
      groups[pid] = {
        patientId: pid,
        name: m.name || m.Name || 'Unknown',
        age: Number(m.age || m.Age || 0),
        sex: m.sex || m.Sex || 'Unknown',
        measurements: [],
      };
    }
    groups[pid].measurements.push(m);
  });

  // Process each group
  Object.values(groups).forEach((group) => {
    let patient = patients.find(p => p.patientId === group.patientId);

    if (!patient) {
      // Create new patient profile
      patient = {
        patientId: group.patientId,
        name: group.name,
        age: group.age,
        sex: group.sex,
        measurements: [],
        firstMeasurementDate: '',
        latestMeasurementDate: '',
        latestGlucose: 0,
        sugarYesCount: 0,
        sugarNoCount: 0,
      };
      patients.push(patient);
      patientsAddedCount++;
    }

    // Add new non-duplicate measurements
    group.measurements.forEach((m) => {
      const mDate = m.date || m.Date || '';
      const mGlucose = Number(m.glucose || m.Glucose || 0);
      const mSource = m.source || 'csv_upload';
      const mSugar = m.consumedSugarLast6Hours || m.ConsumedSugarLast6Hours || 'NO';

      if (isDuplicateMeasurement(group.patientId, mDate, mGlucose, patient!.measurements)) {
        duplicatesIgnoredCount++;
      } else {
        patient!.measurements.push({
          date: mDate,
          glucose: mGlucose,
          source: mSource as any,
          medication: m.medication,
          intervention: m.intervention,
          consumedSugarLast6Hours: mSugar as any,
        });
        measurementsAddedCount++;
      }
    });

    // Re-sort patient measurements and update helper counts
    patient.measurements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (patient.measurements.length > 0) {
      patient.firstMeasurementDate = patient.measurements[0].date;
      patient.latestMeasurementDate = patient.measurements[patient.measurements.length - 1].date;
      patient.latestGlucose = patient.measurements[patient.measurements.length - 1].glucose;
    }
    patient.sugarYesCount = patient.measurements.filter(m => m.consumedSugarLast6Hours === "YES").length;
    patient.sugarNoCount = patient.measurements.filter(m => m.consumedSugarLast6Hours === "NO").length;
  });

  // Save changes permanently
  let databaseUpdated = false;
  if (measurementsAddedCount > 0 || patientsAddedCount > 0) {
    savePatients(patients);
    databaseUpdated = true;
  }

  return {
    success: true,
    patientsAdded: patientsAddedCount,
    measurementsAdded: measurementsAddedCount,
    duplicatesIgnored: duplicatesIgnoredCount,
    databaseUpdated,
    patients,
  };
}

// Get all import logs
export function getImportLogs(): ImportLog[] {
  ensureDataDirectory();
  if (!fs.existsSync(LOGS_DB_PATH)) {
    return [];
  }
  try {
    const data = fs.readFileSync(LOGS_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read import logs:", error);
    return [];
  }
}

// Log a successful import
export function addImportLog(log: ImportLog) {
  ensureDataDirectory();
  const logs = getImportLogs();
  logs.push(log);
  try {
    fs.writeFileSync(LOGS_DB_PATH, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to save import log:", error);
  }
}

// Delete a patient completely
export function deletePatient(patientId: string): PatientData[] {
  const patients = getPatients();
  const updated = patients.filter(p => p.patientId !== patientId);
  savePatients(updated);
  return updated;
}

// Delete a single measurement
export function deleteMeasurement(patientId: string, date: string): PatientData[] {
  const patients = getPatients();
  const patient = patients.find(p => p.patientId === patientId);
  if (patient) {
    patient.measurements = patient.measurements.filter(m => m.date !== date);
    
    // Recalculate helper values
    if (patient.measurements.length > 0) {
      patient.firstMeasurementDate = patient.measurements[0].date;
      patient.latestMeasurementDate = patient.measurements[patient.measurements.length - 1].date;
      patient.latestGlucose = patient.measurements[patient.measurements.length - 1].glucose;
    } else {
      patient.firstMeasurementDate = '';
      patient.latestMeasurementDate = '';
      patient.latestGlucose = 0;
    }
    patient.sugarYesCount = patient.measurements.filter(m => m.consumedSugarLast6Hours === "YES").length;
    patient.sugarNoCount = patient.measurements.filter(m => m.consumedSugarLast6Hours === "NO").length;
    
    savePatients(patients);
  }
  return patients;
}
