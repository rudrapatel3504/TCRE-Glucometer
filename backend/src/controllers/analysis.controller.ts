import { Request, Response, NextFunction } from 'express';
import { generateLocalAnalysis } from '../lib/clinicalEngine';
import { Measurement } from '../../../shared/types';

function parseDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const parts = dateStr.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      return new Date().toISOString().split('T')[0];
    }
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function parseCsvString(text: string): Measurement[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one data row.');
  }

  const header = lines[0].toLowerCase();
  const headers = header.split(',').map(h => h.trim());
  
  const isMultiPatient = headers.includes('patientid') || headers.includes('patient id');

  if (!isMultiPatient) {
    const dateIdx = headers.findIndex(h => h.includes('date'));
    const glucoseIdx = headers.findIndex(h => h.includes('glucose'));
    
    if (dateIdx === -1 || glucoseIdx === -1) {
      throw new Error('CSV must include "Date" and "Glucose" columns in header');
    }
    
    const measurements: Measurement[] = [];
    let invalidCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const row = lines[i].split(',');
      
      const rawDate = row[dateIdx]?.trim();
      const rawGlucose = row[glucoseIdx]?.trim();
      
      if (!rawDate || !rawGlucose) {
        invalidCount++;
        continue;
      }
      
      const glucose = parseInt(rawGlucose, 10);
      
      if (isNaN(glucose) || glucose < 50 || glucose > 600) {
        invalidCount++;
        continue;
      }
      
      measurements.push({
        date: parseDate(rawDate),
        glucose,
        source: 'csv_upload'
      });
    }
    
    const totalRows = lines.length - 1;
    if (invalidCount > totalRows / 2) {
      throw new Error(`CSV parsing failed: ${invalidCount} of ${totalRows} rows had invalid formats or values outside range 50-600 mg/dL.`);
    }
    
    return measurements;
  }

  const patientIdIdx = headers.findIndex(h => h === 'patientid' || h === 'patient id');
  const nameIdx = headers.findIndex(h => h === 'name');
  const ageIdx = headers.findIndex(h => h === 'age');
  const sexIdx = headers.findIndex(h => h === 'sex');
  const yearIdx = headers.findIndex(h => h === 'year');
  const monthIdx = headers.findIndex(h => h === 'month');
  const dayIdx = headers.findIndex(h => h === 'day');
  const hourIdx = headers.findIndex(h => h === 'hour');
  const minuteIdx = headers.findIndex(h => h === 'minute');
  const secondIdx = headers.findIndex(h => h === 'second');
  const glucoseIdx = headers.findIndex(h => h === 'glucose');
  const sugarIdx = headers.findIndex(h => h.includes('sugar') || h.includes('consumed'));

  if ([patientIdIdx, nameIdx, ageIdx, sexIdx, yearIdx, monthIdx, dayIdx, hourIdx, minuteIdx, secondIdx, glucoseIdx, sugarIdx].some(idx => idx === -1)) {
    throw new Error('CSV missing required columns. Expected: PatientID, Name, Age, Sex, Year, Month, Day, Hour, Minute, Second, Glucose, ConsumedSugarLast6Hours');
  }

  const measurements: Measurement[] = [];
  let invalidCount = 0;

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const row = lines[i].split(',');
    
    const patientId = row[patientIdIdx]?.trim();
    const name = row[nameIdx]?.trim();
    const rawAge = row[ageIdx]?.trim();
    const sex = row[sexIdx]?.trim();
    const rawYear = row[yearIdx]?.trim();
    const rawMonth = row[monthIdx]?.trim();
    const rawDay = row[dayIdx]?.trim();
    const rawHour = row[hourIdx]?.trim();
    const rawMinute = row[minuteIdx]?.trim();
    const rawSecond = row[secondIdx]?.trim();
    const rawGlucose = row[glucoseIdx]?.trim();
    const rawSugar = row[sugarIdx]?.trim();

    if (!patientId || !name || !rawAge || !sex || !rawYear || !rawMonth || !rawDay || !rawHour || !rawMinute || !rawSecond || !rawGlucose) {
      invalidCount++;
      continue;
    }

    const age = parseInt(rawAge, 10);
    const year = parseInt(rawYear, 10);
    const month = parseInt(rawMonth, 10);
    const day = parseInt(rawDay, 10);
    const hour = parseInt(rawHour, 10);
    const minute = parseInt(rawMinute, 10);
    const second = parseInt(rawSecond, 10);
    const glucose = parseInt(rawGlucose, 10);

    if (isNaN(age) || isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute) || isNaN(second) || isNaN(glucose)) {
      invalidCount++;
      continue;
    }

    if (glucose < 50 || glucose > 600) {
      invalidCount++;
      continue;
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}.000Z`;
    const sugarValue: 'YES' | 'NO' = rawSugar?.trim().toUpperCase() === 'YES' ? 'YES' : 'NO';

    measurements.push({
      date: dateStr,
      glucose,
      source: 'csv_upload',
      consumedSugarLast6Hours: sugarValue,
      patientId,
      name,
      age,
      sex
    } as any);
  }

  const totalRows = lines.length - 1;
  if (invalidCount > totalRows / 2) {
    throw new Error(`CSV parsing failed: ${invalidCount} of ${totalRows} rows had invalid formats or values outside range 50-600 mg/dL.`);
  }

  return measurements;
}

export function analyze(req: Request, res: Response, next: NextFunction) {
  try {
    const measurements = req.body.measurements || [];
    const windowDays = req.body.window_days !== undefined ? req.body.window_days : req.body.windowDays;
    
    const firstMeasurementWithPatient = measurements.find((m: any) => m && m.patientId);
    const patientId = firstMeasurementWithPatient ? firstMeasurementWithPatient.patientId : undefined;
    const patientName = firstMeasurementWithPatient ? firstMeasurementWithPatient.name : undefined;

    const analysis = generateLocalAnalysis(
      measurements,
      windowDays !== undefined ? windowDays : null,
      patientId,
      patientName
    );

    res.json(analysis);
  } catch (error) {
    next(error);
  }
}

export function uploadCsv(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const csvText = req.file.buffer.toString('utf-8');
    const measurements = parseCsvString(csvText);
    res.json({ success: true, measurements });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
}
