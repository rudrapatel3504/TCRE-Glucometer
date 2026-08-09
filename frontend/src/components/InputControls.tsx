"use client";

import React, { useState, useRef, useMemo } from "react";
import { Measurement } from "../store/useTCREStore";
import { parseCsvString } from "../lib/api";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useTCREStore } from "../store/useTCREStore";
import { Plus, Upload, RefreshCw, AlertTriangle, FileSpreadsheet, Calendar, Activity, Cpu, ShieldCheck, User } from "lucide-react";

interface InputControlsProps {
  onMeasurementAdd: (measurement: Measurement, patientId?: string) => void;
  onCsvUpload: (measurements: Measurement[]) => void;
  isLoading: boolean;
}

export default function InputControls({
  onMeasurementAdd,
  onCsvUpload,
  isLoading,
}: InputControlsProps) {
  const showToast = useTCREStore((state) => state.showToast);
  const uploadedPatients = useTCREStore((state) => state.uploadedPatients);
  const activeSelectedPatientId = useTCREStore((state) => state.selectedPatientId);
  const createPatientOnServer = useTCREStore((state) => state.createPatientOnServer);

  // Manual Dialog State
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [manualGlucose, setManualGlucose] = useState("");
  const [manualError, setManualError] = useState("");
  const [manualSugar, setManualSugar] = useState<'YES' | 'NO'>("NO");

  // Patient Search / Select State
  const [targetPatientId, setTargetPatientId] = useState("");
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New Patient Creation State
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientAge, setNewPatientAge] = useState("");
  const [newPatientSex, setNewPatientSex] = useState("Female");
  const [newPatientError, setNewPatientError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Initialize/reset states when dialog opens or selected patient changes
  React.useEffect(() => {
    if (manualOpen) {
      if (activeSelectedPatientId) {
        const found = uploadedPatients.find(p => p.patientId === activeSelectedPatientId);
        if (found) {
          setTargetPatientId(found.patientId);
          setPatientSearchQuery(`${found.name} — ${found.patientId}`);
        } else {
          setTargetPatientId("");
          setPatientSearchQuery("");
        }
      } else {
        setTargetPatientId("");
        setPatientSearchQuery("");
      }
      setIsCreatingPatient(false);
      setNewPatientName("");
      setNewPatientAge("");
      setNewPatientSex("Female");
      setNewPatientError("");
      setManualError("");
      setManualGlucose("");
      setManualSugar("NO");
      setManualDate(new Date().toISOString().split("T")[0]);
    }
  }, [manualOpen, activeSelectedPatientId, uploadedPatients]);

  // Click outside to close searchable dropdown
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filter patients based on search input
  const filteredPatientsForSelect = useMemo(() => {
    const query = patientSearchQuery.trim().toLowerCase();
    const selectedPatient = uploadedPatients.find(p => p.patientId === targetPatientId);
    const selectedTag = selectedPatient ? `${selectedPatient.name} — ${selectedPatient.patientId}`.toLowerCase() : "";
    
    if (!query || query === selectedTag) {
      return uploadedPatients;
    }
    
    return uploadedPatients.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.patientId.toLowerCase().includes(query)
    );
  }, [uploadedPatients, patientSearchQuery, targetPatientId]);

  // Handle registering new patient
  const handleCreatePatient = async (e: React.MouseEvent) => {
    e.preventDefault();
    setNewPatientError("");

    if (!newPatientName.trim()) {
      setNewPatientError("Name cannot be empty.");
      return;
    }

    const ageVal = parseInt(newPatientAge, 10);
    if (isNaN(ageVal) || ageVal < 1 || ageVal > 120) {
      setNewPatientError("Please enter a valid age (1-120).");
      return;
    }

    setIsRegistering(true);

    let newId = "";
    let attempts = 0;
    do {
      newId = `P-${Math.floor(10000 + Math.random() * 90000)}`;
      attempts++;
    } while (uploadedPatients.some(p => p.patientId === newId) && attempts < 100);

    const success = await createPatientOnServer({
      name: newPatientName,
      age: ageVal,
      sex: newPatientSex,
      patientId: newId,
    });

    setIsRegistering(false);

    if (success) {
      setTargetPatientId(newId);
      setPatientSearchQuery(`${newPatientName} — ${newId}`);
      setIsCreatingPatient(false);
      setNewPatientName("");
      setNewPatientAge("");
      setNewPatientSex("Female");
    }
  };

  // CSV Dialog State
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<Measurement[] | null>(null);
  const [csvError, setCsvError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Device Import Dialog State
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [deviceState, setDeviceState] = useState<{
    connected: boolean;
    model: string;
    firmware: string;
    recordCount: number;
    capacity: number;
    status: string;
    progress: number;
    error: string | null;
    patientsAdded?: number;
    measurementsAdded?: number;
    duplicatesIgnored?: number;
    databaseUpdated?: boolean;
    arduinoCleared?: boolean;
    clearFailed?: boolean;
    importTime?: string;
    importDuration?: string;
  } | null>(null);

  const lastStatusRef = useRef<string | null>(null);

  React.useEffect(() => {
    if (!deviceOpen) {
      setDeviceState(null);
      lastStatusRef.current = null;
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/device/status");
        if (res.ok) {
          const data = await res.json();
          setDeviceState(data.status);
          
          if (data.status.status === "Completed" && lastStatusRef.current !== "Completed") {
            const store = useTCREStore.getState();
            const previousSelectedId = store.selectedPatientId;
            if (data.patients && data.patients.length > 0) {
              store.setUploadedPatients(data.patients);
              if (previousSelectedId) {
                store.selectPatient(previousSelectedId);
              }
              showToast(`Import completed: ${data.status.measurementsAdded || 0} new measurements added.`, "success");
            }
          }
          lastStatusRef.current = data.status.status;
        }
      } catch (err) {
        console.error("Error fetching device status:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, [deviceOpen, showToast]);

  const handleTriggerImport = async () => {
    try {
      const res = await fetch("/api/device/trigger", { method: "POST" });
      if (!res.ok) {
        showToast("Failed to initiate device import request.", "error");
      }
    } catch (err) {
      showToast("Error requesting device import.", "error");
    }
  };

  // Manual entry submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError("");

    if (!targetPatientId) {
      setManualError("Please select a patient first.");
      return;
    }

    const val = parseInt(manualGlucose, 10);
    if (isNaN(val) || val < 50 || val > 600) {
      setManualError("Glucose measurement must be between 50 and 600 mg/dL.");
      return;
    }

    if (!manualDate) {
      setManualError("Please select a valid date.");
      return;
    }

    onMeasurementAdd({
      date: manualDate,
      glucose: val,
      source: "manual",
      consumedSugarLast6Hours: manualSugar,
    }, targetPatientId);

    showToast(`Added manual reading: ${val} mg/dL`, "success");
    setManualGlucose("");
    setManualSugar("NO");
    setManualOpen(false);
  };

  // CSV Select & Parse
  const handleCsvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError("");
    setCsvPreview(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      try {
        const parsed = parseCsvString(text);
        if (parsed.length === 0) {
          setCsvError("No valid rows found in CSV.");
        } else {
          setCsvPreview(parsed);
        }
      } catch (err: any) {
        setCsvError(err.message || "Failed to parse CSV file.");
      }
    };
    reader.onerror = () => {
      setCsvError("Error reading file.");
    };
    reader.readAsText(file);
  };

  // CSV Confirm Upload
  const handleCsvConfirm = () => {
    if (!csvPreview || csvPreview.length === 0) return;

    onCsvUpload(csvPreview);
    showToast(`Successfully uploaded ${csvPreview.length} measurements`, "success");
    setCsvPreview(null);
    setCsvOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <section className="w-full bg-bg-primary border border-border-tertiary rounded-lg p-5 flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 shadow-sm">
      {/* Add Manual Measurement Button & Dialog */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogTrigger className="w-full sm:w-[160px] h-10 text-xs font-semibold flex items-center justify-center gap-2 border border-border-secondary rounded-md text-text-primary hover:bg-bg-secondary transition-all cursor-pointer">
          <Plus className="w-4 h-4 text-text-info" /> Add Manual
        </DialogTrigger>
        <DialogContent className="bg-bg-primary text-text-primary border-border-secondary max-w-sm sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-text-info" /> Add Glucose Measurement
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Enter a single blood glucose reading to evaluate immediate patient state.
            </DialogDescription>
          </DialogHeader>

          {isCreatingPatient ? (
            <div className="space-y-4 mt-4 border border-border-secondary p-4 rounded bg-bg-secondary/45">
              <div className="flex justify-between items-center pb-2 border-b border-border-tertiary">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Register New Patient</h4>
                <button
                  type="button"
                  onClick={() => setIsCreatingPatient(false)}
                  className="text-xs text-text-secondary hover:text-text-primary bg-transparent border-0 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Smith"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full text-sm bg-bg-primary border border-border-secondary rounded px-3 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-text-info"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    min="1"
                    max="120"
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(e.target.value)}
                    className="w-full text-sm bg-bg-primary border border-border-secondary rounded px-3 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-text-info"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-text-secondary uppercase">Biological Sex</label>
                  <select
                    value={newPatientSex}
                    onChange={(e) => setNewPatientSex(e.target.value)}
                    className="w-full text-sm bg-bg-primary border border-border-secondary rounded px-3 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-text-info"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {newPatientError && (
                <div className="flex items-center gap-2 p-2 rounded bg-text-danger/10 text-text-danger text-[10px] border border-text-danger/15">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{newPatientError}</span>
                </div>
              )}

              <Button
                type="button"
                onClick={handleCreatePatient}
                disabled={isRegistering}
                className="w-full h-10 text-xs font-bold bg-text-info hover:bg-text-info/90 text-white cursor-pointer"
              >
                {isRegistering ? "Registering..." : "Create & Select Patient"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4 mt-4">
              <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-text-tertiary" /> Select Patient
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCreatingPatient(true)}
                    className="text-[11px] font-bold text-text-info hover:underline flex items-center gap-0.5 p-0 bg-transparent border-0 cursor-pointer"
                  >
                    + Create New Patient
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type to search patient..."
                    value={patientSearchQuery}
                    onChange={(e) => {
                      setPatientSearchQuery(e.target.value);
                      setShowDropdown(true);
                      const selectedPatient = uploadedPatients.find(p => p.patientId === targetPatientId);
                      const selectedTag = selectedPatient ? `${selectedPatient.name} — ${selectedPatient.patientId}` : "";
                      if (e.target.value !== selectedTag) {
                        setTargetPatientId("");
                      }
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full text-sm bg-bg-secondary border border-border-secondary rounded px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-text-info pr-8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-1 bg-transparent border-0 cursor-pointer text-xs"
                  >
                    ▼
                  </button>
                </div>

                {showDropdown && (
                  <div className="absolute top-[100%] left-0 w-full bg-bg-primary border border-border-secondary rounded shadow-lg z-50 max-h-48 overflow-y-auto mt-1 divide-y divide-border-tertiary">
                    {filteredPatientsForSelect.length === 0 ? (
                      <div className="p-2.5 text-xs text-text-secondary text-center">No patients found</div>
                    ) : (
                      filteredPatientsForSelect.map((p) => (
                        <div
                          key={p.patientId}
                          onClick={() => {
                            setTargetPatientId(p.patientId);
                            setPatientSearchQuery(`${p.name} — ${p.patientId}`);
                            setShowDropdown(false);
                          }}
                          className="p-2.5 text-xs text-text-primary hover:bg-bg-secondary cursor-pointer transition-colors flex justify-between items-center"
                        >
                          <span className="font-semibold">{p.name}</span>
                          <span className="font-mono text-text-secondary text-[10px]">{p.patientId}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-text-tertiary" /> Date of Reading
                </label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full text-sm bg-bg-secondary border border-border-secondary rounded px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-text-info"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-text-tertiary" /> Glucose Level (mg/dL)
                </label>
                <input
                  type="number"
                  min="50"
                  max="600"
                  value={manualGlucose}
                  onChange={(e) => setManualGlucose(e.target.value)}
                  placeholder="e.g. 120"
                  className="w-full text-sm bg-bg-secondary border border-border-secondary rounded px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-text-info"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-text-tertiary" /> Sugar Intake (Last 6 Hours)
                </label>
                <div className="flex items-center gap-6 mt-1.5">
                  <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer select-none">
                    <input
                      type="radio"
                      name="manualSugar"
                      value="YES"
                      checked={manualSugar === "YES"}
                      onChange={() => setManualSugar("YES")}
                      className="w-4 h-4 accent-text-info cursor-pointer"
                    />
                    <span>Yes, Consumed Sugar</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer select-none">
                    <input
                      type="radio"
                      name="manualSugar"
                      value="NO"
                      checked={manualSugar === "NO"}
                      onChange={() => setManualSugar("NO")}
                      className="w-4 h-4 accent-text-info cursor-pointer"
                    />
                    <span>No Sugar Intake</span>
                  </label>
                </div>
              </div>

              {manualError && (
                <div className="flex items-center gap-2 p-2.5 rounded bg-text-danger/10 text-text-danger text-xs border border-text-danger/15">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}

              <Button type="submit" className="w-full h-10 text-xs font-bold bg-text-info hover:bg-text-info/90 text-white cursor-pointer">
                Add Measurement
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload CSV Button & Dialog */}
      <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
        <DialogTrigger className="w-full sm:w-[160px] h-10 text-xs font-semibold flex items-center justify-center gap-2 border border-border-secondary rounded-md text-text-primary hover:bg-bg-secondary transition-all cursor-pointer">
          <Upload className="w-4 h-4 text-text-warning" /> Upload CSV
        </DialogTrigger>
        <DialogContent className="bg-bg-primary text-text-primary border-border-secondary max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-text-success" /> Import Clinical Measurements Dataset
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary leading-relaxed">
              Upload a `.csv` file. Supports **Multi-patient format** (PatientID, Name, Age, Sex, Year, Month, Day, Hour, Minute, Second, Glucose, ConsumedSugarLast6Hours) or **Single-patient format** (Date, Glucose).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Select CSV File</label>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleCsvSelect}
                className="w-full text-xs bg-bg-secondary border border-border-secondary rounded px-3 py-2 text-text-primary file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-text-info/10 file:text-text-info hover:file:bg-text-info/20 cursor-pointer"
              />
            </div>

            {csvError && (
              <div className="flex items-start gap-2 p-3 rounded bg-text-danger/10 text-text-danger text-xs border border-text-danger/15 leading-normal">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{csvError}</span>
              </div>
            )}

            {csvPreview && (
              <div className="bg-bg-secondary border border-border-tertiary rounded p-3">
                {(() => {
                  const isMulti = csvPreview.length > 0 && (csvPreview[0] as any).patientId;
                  
                  if (isMulti) {
                    // Group and summarize patients
                    const map: Record<string, { name: string; count: number; sex: string; age: number }> = {};
                    csvPreview.forEach((m: any) => {
                      if (!map[m.patientId]) {
                        map[m.patientId] = { name: m.name, count: 0, sex: m.sex, age: m.age };
                      }
                      map[m.patientId].count++;
                    });
                    const summary = Object.entries(map).map(([id, info]) => ({ id, ...info }));
                    
                    return (
                      <div>
                        <p className="text-xs font-semibold text-text-primary mb-2 flex justify-between">
                          <span className="text-text-info">Multi-patient CSV Detected</span>
                          <span className="text-text-secondary font-mono">{summary.length} Patients | {csvPreview.length} Readings</span>
                        </p>
                        <div className="max-h-40 overflow-y-auto border border-border-primary rounded">
                          <table className="w-full text-[11px] border-collapse text-left">
                            <thead className="sticky top-0 bg-bg-secondary border-b border-border-secondary text-text-secondary font-semibold">
                              <tr>
                                <th className="p-2">Patient ID</th>
                                <th className="p-2">Name</th>
                                <th className="p-2">Age/Sex</th>
                                <th className="p-2">Readings</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-tertiary font-mono">
                              {summary.map((patient, i) => (
                                <tr key={i} className="hover:bg-bg-primary transition-colors">
                                  <td className="p-2 text-text-primary font-bold">{patient.id}</td>
                                  <td className="p-2 text-text-primary">{patient.name}</td>
                                  <td className="p-2 text-text-secondary">{patient.age}y / {patient.sex}</td>
                                  <td className="p-2 text-text-info font-bold">{patient.count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div>
                        <p className="text-xs font-semibold text-text-primary mb-2 flex justify-between">
                          <span className="text-text-success">Single-patient CSV Detected</span>
                          <span className="text-text-secondary font-mono">{csvPreview.length} readings found</span>
                        </p>
                        <div className="max-h-40 overflow-y-auto border border-border-primary rounded">
                          <table className="w-full text-[11px] border-collapse text-left">
                            <thead className="sticky top-0 bg-bg-secondary border-b border-border-secondary text-text-secondary font-semibold">
                              <tr>
                                <th className="p-2">Date</th>
                                <th className="p-2">Glucose (mg/dL)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-tertiary">
                              {csvPreview.slice(0, 5).map((row, i) => (
                                <tr key={i} className="hover:bg-bg-primary transition-colors">
                                  <td className="p-2 text-text-primary">{row.date}</td>
                                  <td className="p-2 text-text-primary font-medium">{row.glucose}</td>
                                </tr>
                              ))}
                              {csvPreview.length > 5 && (
                                <tr>
                                  <td colSpan={2} className="p-2 text-center text-text-tertiary text-[10px] bg-bg-primary/50">
                                    + {csvPreview.length - 5} more rows...
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            <Button
              onClick={handleCsvConfirm}
              className="w-full h-10 text-xs font-bold bg-text-success hover:bg-text-success/90 text-white cursor-pointer"
              disabled={!csvPreview || csvPreview.length === 0}
            >
              Confirm and Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import From Device Button & Dialog */}
      <Dialog open={deviceOpen} onOpenChange={setDeviceOpen}>
        <DialogTrigger className="w-full sm:w-[160px] h-10 text-xs font-semibold flex items-center justify-center gap-2 border border-border-secondary rounded-md text-text-primary hover:bg-bg-secondary transition-all cursor-pointer">
          <Cpu className="w-4 h-4 text-text-info" /> Import From Device
        </DialogTrigger>
        <DialogContent className="bg-bg-primary text-text-primary border-border-secondary max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-text-info" /> TCRE Device Bridge
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary leading-relaxed">
              Connect to the hardware bridge to download clinical measurements from device EEPROM.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {deviceState === null ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <RefreshCw className="w-6 h-6 text-text-info animate-spin" />
                <p className="text-xs text-text-secondary">Scanning for TCRE Device...</p>
              </div>
            ) : !deviceState.connected ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                <AlertTriangle className="w-10 h-10 text-text-warning" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-text-primary">No Device Detected</p>
                  <p className="text-xs text-text-secondary max-w-[280px] leading-relaxed">
                    Please ensure the Arduino is plugged in via USB and that the **TCRE Device Studio** desktop app is open.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Device Info Card */}
                <div className="bg-bg-secondary border border-border-tertiary rounded p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary">Connection Status:</span>
                    <span className="font-bold text-text-success flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-text-success inline-block animate-pulse"></span> Connected
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs border-t border-border-secondary pt-3">
                    <div>
                      <span className="text-text-tertiary block text-[10px]">Arduino Model:</span>
                      <strong className="text-text-primary">{deviceState.model}</strong>
                    </div>
                    <div>
                      <span className="text-text-tertiary block text-[10px]">Firmware Version:</span>
                      <strong className="text-text-primary">{deviceState.firmware}</strong>
                    </div>
                  </div>

                  <div className="border-t border-border-secondary pt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-tertiary">EEPROM Usage:</span>
                      <strong className="text-text-primary">{deviceState.recordCount} / {deviceState.capacity} records</strong>
                    </div>
                    <div className="w-full bg-bg-primary rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-text-success h-full"
                        style={{ width: `${Math.min(100, (deviceState.recordCount / Math.max(1, deviceState.capacity)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Progress / Status display */}
                {deviceState.status !== "Idle" && deviceState.status !== "Completed" && deviceState.status !== "Error" && (
                  <div className="bg-bg-secondary border border-border-tertiary rounded p-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary font-semibold flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-text-info animate-spin" />
                        Status: <span className="text-text-info uppercase tracking-wider">{deviceState.status}</span>
                      </span>
                      <span className="font-mono text-text-primary">{deviceState.progress}%</span>
                    </div>
                    <div className="w-full bg-bg-primary rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-text-info h-full transition-all duration-300"
                        style={{ width: `${deviceState.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Completed Transaction Summary */}
                {deviceState.status === "Completed" && (
                  <div className="bg-bg-secondary border border-border-tertiary rounded p-4 space-y-4">
                    <div className="flex items-center gap-2 text-text-success">
                      <ShieldCheck className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider">Device Successfully Imported</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs border-t border-border-secondary pt-3">
                      <div>
                        <span className="text-text-tertiary block text-[10px]">Patients Imported:</span>
                        <strong className="text-text-primary">{deviceState.patientsAdded ?? 0}</strong>
                      </div>
                      <div>
                        <span className="text-text-tertiary block text-[10px]">New Measurements:</span>
                        <strong className="text-text-info font-bold">{deviceState.measurementsAdded ?? 0}</strong>
                      </div>
                      <div>
                        <span className="text-text-tertiary block text-[10px]">Duplicates Ignored:</span>
                        <strong className="text-text-secondary">{deviceState.duplicatesIgnored ?? 0}</strong>
                      </div>
                      <div>
                        <span className="text-text-tertiary block text-[10px]">Database Updated:</span>
                        <strong className={deviceState.databaseUpdated ? "text-text-success font-bold" : "text-text-secondary"}>
                          {deviceState.databaseUpdated ? "Yes" : "No"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-text-tertiary block text-[10px]">Import Time:</span>
                        <strong className="text-text-primary font-mono text-[10px]">{deviceState.importTime || "N/A"}</strong>
                      </div>
                      <div>
                        <span className="text-text-tertiary block text-[10px]">Duration:</span>
                        <strong className="text-text-primary font-mono">{deviceState.importDuration || "N/A"}</strong>
                      </div>
                    </div>

                    {/* Clear Status Message */}
                    <div className="border-t border-border-secondary pt-3">
                      {deviceState.arduinoCleared ? (
                        <div className="p-2.5 bg-text-success/10 border border-text-success/20 rounded text-[11px] text-text-success font-medium">
                          Arduino memory successfully cleared. Ready for new measurements.
                        </div>
                      ) : deviceState.clearFailed ? (
                        <div className="p-2.5 bg-text-danger/10 border border-text-danger/20 rounded text-[11px] text-text-danger font-medium flex gap-1.5 items-start">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>Warning: Clear command failed on device. Data is safe but memory remains full.</span>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-bg-primary border border-border-secondary rounded text-[11px] text-text-secondary font-medium">
                          Clearing Arduino memory...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {(deviceState.status === "Error" || deviceState.error) && (
                  <div className="p-4 bg-text-danger/10 border border-text-danger/20 rounded space-y-3">
                    <div className="flex items-center gap-2 text-text-danger">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider">Import Failed. Device data preserved.</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      An error occurred during the data transfer or storage process. The measurements remain safely stored on the device EEPROM. Please verify connections and retry.
                    </p>
                    <div className="text-[11px] bg-bg-primary/50 border border-border-secondary p-2.5 rounded font-mono text-text-primary break-all">
                      Error Details: {deviceState.error || "Unknown communication error."}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {deviceState.status === "Idle" || deviceState.status === "Completed" || deviceState.status === "Error" ? (
                  <Button
                    onClick={() => {
                      if (deviceState.status === "Completed") {
                        setDeviceOpen(false);
                      } else {
                        handleTriggerImport();
                      }
                    }}
                    className={`w-full h-10 text-xs font-bold text-white cursor-pointer ${
                      deviceState.status === "Completed" 
                        ? "bg-text-success hover:bg-text-success/90" 
                        : "bg-text-info hover:bg-text-info/90"
                    }`}
                    disabled={deviceState.status === "Idle" && deviceState.recordCount === 0}
                  >
                    {deviceState.status === "Completed"
                      ? "Close Summary"
                      : deviceState.status === "Error"
                        ? "Retry Import"
                        : deviceState.recordCount === 0
                          ? "No records to import"
                          : "Start Importing Data"}
                  </Button>
                ) : (
                  <Button
                    className="w-full h-10 text-xs font-bold bg-bg-secondary text-text-secondary cursor-not-allowed border border-border-secondary"
                    disabled
                  >
                    Processing...
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
