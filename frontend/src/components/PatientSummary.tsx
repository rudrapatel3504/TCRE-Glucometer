"use client";

import React, { useMemo } from "react";
import { useTCREStore } from "../store/useTCREStore";
import { User, Activity, Calendar, FileText, HeartPulse, RefreshCw } from "lucide-react";

export default function PatientSummary() {
  const { uploadedPatients, selectedPatientId, units } = useTCREStore();

  const selectedPatient = useMemo(() => {
    return uploadedPatients.find(p => p.patientId === selectedPatientId) || null;
  }, [uploadedPatients, selectedPatientId]);

  if (!selectedPatient) {
    return null; // Don't render anything if no patient is selected
  }

  const formatDate = (isoString: string) => {
    if (!isoString) return "N/A";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      }) + " at " + d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const convertedGlucose = units === "mmol/L" 
    ? parseFloat((selectedPatient.latestGlucose / 18.0182).toFixed(1)) 
    : selectedPatient.latestGlucose;

  const totalSugarIntakes = selectedPatient.sugarYesCount + selectedPatient.sugarNoCount;
  const sugarYesPercentage = totalSugarIntakes > 0 
    ? Math.round((selectedPatient.sugarYesCount / totalSugarIntakes) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-bg-secondary border border-border-tertiary rounded-lg p-5 shadow-sm">
      {/* Col 1: Patient Demographic Details */}
      <div className="flex flex-col justify-between bg-bg-primary/45 border border-border-tertiary/20 p-4 rounded-lg">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-bold text-text-info tracking-wider">Demographic Profile</span>
            <span className="text-xs text-text-secondary font-mono">Patient File</span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <div className="bg-text-info/10 text-text-info p-2 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-text-primary uppercase tracking-wide">
                {selectedPatient.name}
              </h3>
              <p className="text-xs font-mono text-text-tertiary">
                ID: <span className="text-text-secondary font-bold">{selectedPatient.patientId}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border-tertiary/30 pt-3 mt-4 text-sm">
          <div>
            <span className="block font-bold uppercase text-[10px] text-text-tertiary">Age</span>
            <span className="font-semibold text-text-secondary text-sm">{selectedPatient.age} Years Old</span>
          </div>
          <div>
            <span className="block font-bold uppercase text-[10px] text-text-tertiary">Biological Sex</span>
            <span className="font-semibold text-text-secondary text-sm capitalize">{selectedPatient.sex}</span>
          </div>
        </div>
      </div>

      {/* Col 2: Telemetry & Measurement Range */}
      <div className="flex flex-col justify-between bg-bg-primary/45 border border-border-tertiary/20 p-4 rounded-lg">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-bold text-text-info tracking-wider font-semibold">Glycemic Telemetry</span>
            <span className="text-xs text-text-success font-mono font-bold">Active Engine</span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <div className="bg-text-success/10 text-text-success p-2 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                Latest Glucose Level
              </h3>
              <p className="text-lg font-black text-text-info">
                {convertedGlucose} {units}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border-tertiary/30 pt-3 mt-4 text-sm">
          <div>
            <span className="block font-bold uppercase text-[10px] text-text-tertiary">Record Count</span>
            <span className="font-semibold text-text-secondary font-mono">{selectedPatient.measurements.length} Measurements</span>
          </div>
          <div className="truncate">
            <span className="block font-bold uppercase text-[10px] text-text-tertiary">Latest Timestamp</span>
            <span className="font-semibold text-text-secondary font-mono text-xs truncate">
              {new Date(selectedPatient.latestMeasurementDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Col 3: Sugar Intake Diagnostics */}
      <div className="flex flex-col justify-between bg-bg-primary/45 border border-border-tertiary/20 p-4 rounded-lg">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-bold text-text-info tracking-wider">Clinical Parameters</span>
            <span className="text-xs text-text-warning font-mono font-bold">Sugar Log</span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <div className="bg-text-warning/10 text-text-warning p-2 rounded-lg">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide">
                Sugar Intake Summary
              </h3>
              <div className="text-xs text-text-secondary font-semibold">
                Yes Intake: <span className="text-text-danger font-black">{selectedPatient.sugarYesCount}</span> (
                {sugarYesPercentage}%)
              </div>
            </div>
          </div>
        </div>

        {/* Sugar intake progress indicator bar */}
        <div className="mt-3">
          <div className="w-full bg-border-tertiary/30 h-1.5 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${sugarYesPercentage}%` }} 
              className="bg-text-danger h-full transition-all"
              title={`YES Sugar Intake: ${sugarYesPercentage}%`}
            />
            <div 
              style={{ width: `${100 - sugarYesPercentage}%` }} 
              className="bg-text-success h-full transition-all"
              title={`NO Sugar Intake: ${100 - sugarYesPercentage}%`}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-text-tertiary uppercase mt-1">
            <span>YES: {selectedPatient.sugarYesCount}</span>
            <span>NO: {selectedPatient.sugarNoCount}</span>
          </div>
        </div>
      </div>

      {/* Bottom Full-width Date Range Info Row */}
      <div className="col-span-1 md:col-span-3 border-t border-border-tertiary/30 pt-3 mt-1 flex flex-col sm:flex-row justify-between text-xs text-text-tertiary gap-2">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Ingested Timeline Range: </span>
          <strong className="text-text-secondary font-mono">{formatDate(selectedPatient.firstMeasurementDate)}</strong>
          <span className="mx-1">to</span>
          <strong className="text-text-secondary font-mono">{formatDate(selectedPatient.latestMeasurementDate)}</strong>
        </div>
        <div className="text-right italic">
          Data dynamically partitioned and prepared for TCRE core calculations.
        </div>
      </div>
    </div>
  );
}
