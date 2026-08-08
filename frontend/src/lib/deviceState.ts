export interface DeviceStatus {
  connected: boolean;
  model: string;
  firmware: string;
  recordCount: number;
  capacity: number;
  status: string; // "Idle", "Connecting", "Reading EEPROM", "Converting", "Uploading", "Completed", "Error"
  progress: number; // 0 to 100
  error: string | null;
  importRequested: boolean;
  lastTriggerTime?: string;

  // Custom transaction fields for final summary
  patientsAdded?: number;
  measurementsAdded?: number;
  duplicatesIgnored?: number;
  databaseUpdated?: boolean;
  arduinoCleared?: boolean;
  clearFailed?: boolean;
  importTime?: string;
  importDuration?: string;
}

export let deviceStatus: DeviceStatus = {
  connected: false,
  model: "",
  firmware: "",
  recordCount: 0,
  capacity: 0,
  status: "Idle",
  progress: 0,
  error: null,
  importRequested: false,
};

export let importedPatients: any[] = [];

export function setDeviceStatus(newStatus: Partial<DeviceStatus>) {
  deviceStatus = { ...deviceStatus, ...newStatus };
}

export function setImportedPatients(patients: any[]) {
  importedPatients = patients;
}
