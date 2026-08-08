import { Measurement, PatientData } from '@/store/useTCREStore';

export function groupMeasurementsToPatients(measurements: any[]): PatientData[] {
  const patientMap: Record<string, PatientData> = {};

  measurements.forEach((m) => {
    const pid = String(m.patientId || m.PatientID || '');
    if (!pid) return;

    if (!patientMap[pid]) {
      patientMap[pid] = {
        patientId: pid,
        name: m.name || m.Name || 'Unknown',
        age: Number(m.age || m.Age || 0),
        sex: m.sex || m.Sex || 'Unknown',
        measurements: [],
        firstMeasurementDate: '',
        latestMeasurementDate: '',
        latestGlucose: 0,
        sugarYesCount: 0,
        sugarNoCount: 0,
      };
    }

    const cleanMeasurement: Measurement = {
      date: m.date || '',
      glucose: Number(m.glucose || 0),
      source: m.source || 'csv_upload',
      medication: m.medication,
      intervention: m.intervention,
      consumedSugarLast6Hours: m.consumedSugarLast6Hours || m.ConsumedSugarLast6Hours || 'NO',
    };

    patientMap[pid].measurements.push(cleanMeasurement);
  });

  return Object.values(patientMap).map((p) => {
    const sorted = [...p.measurements].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const sugarYesCount = sorted.filter((m) => m.consumedSugarLast6Hours === 'YES').length;
    const sugarNoCount = sorted.filter((m) => m.consumedSugarLast6Hours === 'NO').length;

    return {
      ...p,
      measurements: sorted,
      firstMeasurementDate: sorted[0]?.date || '',
      latestMeasurementDate: sorted[sorted.length - 1]?.date || '',
      latestGlucose: sorted[sorted.length - 1]?.glucose || 0,
      sugarYesCount,
      sugarNoCount,
    };
  });
}
