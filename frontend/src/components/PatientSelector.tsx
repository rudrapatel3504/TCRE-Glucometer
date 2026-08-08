"use client";

import React, { useState, useMemo } from "react";
import { useTCREStore } from "../store/useTCREStore";
import { Search, User, Calendar, Activity, Users, ArrowRight, Trash2 } from "lucide-react";

export default function PatientSelector() {
  const { uploadedPatients, selectedPatientId, selectPatient, units, deletePatientFromServer } = useTCREStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const itemsPerPage = 8; // keeps layout tidy and performant

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return uploadedPatients;
    return uploadedPatients.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.patientId.toLowerCase().includes(query)
    );
  }, [uploadedPatients, searchQuery]);

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / itemsPerPage));
  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPatients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPatients, currentPage]);

  const formatDate = (isoString: string) => {
    if (!isoString) return "N/A";
    if (!mounted) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) + " " + d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="bg-bg-secondary border border-border-tertiary rounded-lg p-5 flex flex-col gap-4 shadow-sm">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-tertiary/30 pb-4">
        <div>
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-text-info" />
            PATIENT SELECTION REGISTRY ({uploadedPatients.length})
          </h2>
          <p className="text-[11px] text-text-secondary">
            Select a patient from the uploaded multi-patient dataset to initiate spatial-temporal clinical reasoning analysis.
          </p>
        </div>

        {/* Dropdown Quick Selector & Search */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
          {/* Dropdown */}
          <div className="flex items-center gap-1.5 min-w-[200px]">
            <label htmlFor="quick-patient-select" className="text-[10px] font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">
              Quick Select:
            </label>
            <select
              id="quick-patient-select"
              value={selectedPatientId || ""}
              onChange={(e) => selectPatient(e.target.value || null as any)}
              className="bg-bg-primary text-xs font-semibold text-text-primary border border-border-tertiary rounded px-3 py-1.5 focus:outline-none focus:border-text-info cursor-pointer w-full"
            >
              <option value="">-- Select Patient --</option>
              {uploadedPatients.map((p) => (
                <option key={p.patientId} value={p.patientId}>
                  {p.name} ({p.patientId})
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search Name or Patient ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-bg-primary text-xs text-text-primary pl-8 pr-3 py-1.5 rounded border border-border-tertiary focus:outline-none focus:border-text-info w-full"
            />
          </div>
        </div>
      </div>

      {/* Patient Cards Grid */}
      {filteredPatients.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-border-tertiary rounded-lg bg-bg-primary/20">
          <p className="text-xs text-text-secondary font-medium">No matching patients found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {paginatedPatients.map((p) => {
              const isSelected = selectedPatientId === p.patientId;
              const convertedGlucose = units === "mmol/L" ? parseFloat((p.latestGlucose / 18.0182).toFixed(1)) : p.latestGlucose;
              return (
                <div
                  key={p.patientId}
                  onClick={() => selectPatient(p.patientId)}
                  className={`relative flex flex-col justify-between p-4 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-text-info/5 border-text-info ring-1 ring-text-info/30"
                      : "bg-bg-primary/50 border-border-tertiary hover:border-text-info/30 hover:bg-bg-primary"
                  }`}
                >
                  {/* Selected Indicator Glow */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-text-info animate-pulse" />
                  )}

                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-1">
                      <div className="font-bold text-xs text-text-primary truncate max-w-[65%]">
                        {p.name}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                          p.sex.toLowerCase() === 'female' ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                          {p.sex}
                        </span>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete all data for ${p.name}? This action cannot be undone.`)) {
                              deletePatientFromServer(p.patientId);
                            }
                          }}
                          className="text-text-danger/70 hover:text-text-danger hover:bg-text-danger/10 p-1 rounded transition-colors flex items-center justify-center"
                          title="Delete Patient Data"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-text-tertiary">
                      ID: <span className="text-text-secondary font-bold">{p.patientId}</span>
                    </div>

                    {/* Stats details */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-tertiary/20 text-[10px]">
                      <div>
                        <span className="block text-text-tertiary uppercase text-[8px] font-bold">Age</span>
                        <span className="font-semibold text-text-primary">{p.age} yrs</span>
                      </div>
                      <div>
                        <span className="block text-text-tertiary uppercase text-[8px] font-bold">Readings</span>
                        <span className="font-semibold text-text-primary">{p.measurements.length}</span>
                      </div>
                      <div>
                        <span className="block text-text-tertiary uppercase text-[8px] font-bold">Latest Glucose</span>
                        <span className="font-bold text-text-info">{convertedGlucose} {units}</span>
                      </div>
                      <div>
                        <span className="block text-text-tertiary uppercase text-[8px] font-bold">Sugar Intake</span>
                        <span className="font-semibold text-text-secondary">
                          <span className="text-text-danger font-bold">{p.sugarYesCount}</span> / <span className="text-text-success font-bold">{p.sugarNoCount}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="mt-3 pt-2 border-t border-border-tertiary/10 text-[9px] text-text-tertiary space-y-0.5">
                    <div className="truncate">
                      First: <span className="font-mono text-text-secondary">{formatDate(p.firstMeasurementDate)}</span>
                    </div>
                    <div className="truncate">
                      Latest: <span className="font-mono text-text-secondary">{formatDate(p.latestMeasurementDate)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center text-xs text-text-secondary border-t border-border-tertiary/20 pt-3 mt-1">
              <div>
                Showing <strong className="text-text-primary">{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
                <strong className="text-text-primary">
                  {Math.min(currentPage * itemsPerPage, filteredPatients.length)}
                </strong>{" "}
                of <strong className="text-text-primary">{filteredPatients.length}</strong> patients
              </div>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="px-2 py-1 rounded bg-bg-primary border border-border-tertiary disabled:opacity-50 text-[11px] font-bold hover:border-text-info/30"
                >
                  Prev
                </button>
                <span className="py-1 px-2 font-mono">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="px-2 py-1 rounded bg-bg-primary border border-border-tertiary disabled:opacity-50 text-[11px] font-bold hover:border-text-info/30"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
