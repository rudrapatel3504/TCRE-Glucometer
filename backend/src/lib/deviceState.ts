import { DeviceStatus } from '../../../shared/types';

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
