"use client";

import React, { useState, useMemo } from "react";
import { useTCREStore } from "../store/useTCREStore";
import { Clock, Heart, Award, ShieldAlert, ArrowDown, ChevronRight, Activity } from "lucide-react";

export default function PatientTimeline() {
  const { uploadedPatients, selectedPatientId, units } = useTCREStore();

  const selectedPatient = useMemo(() => {
    return uploadedPatients.find(p => p.patientId === selectedPatientId) || null;
  }, [uploadedPatients, selectedPatientId]);

  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [visibleCount, setVisibleCount] = useState(15);

  if (!selectedPatient) return null;

  const sortedMeasurements = useMemo(() => {
    const list = [...selectedPatient.measurements];
    return sortOrder === "asc"
      ? list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      : list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedPatient.measurements, sortOrder]);

  const visibleMeasurements = useMemo(() => {
    return sortedMeasurements.slice(0, visibleCount);
  }, [sortedMeasurements, visibleCount]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const getGlucoseStatus = (glucose: number) => {
    if (glucose >= 180) return { label: "HYPER", color: "text-text-danger bg-text-danger/10 border-text-danger/25" };
    if (glucose <= 70) return { label: "HYPO", color: "text-text-warning bg-text-warning/10 border-text-warning/25" };
    return { label: "NORMAL", color: "text-text-success bg-text-success/10 border-text-success/25" };
  };

  return (
    <section className="bg-bg-secondary border border-border-tertiary rounded-lg p-5 flex flex-col gap-4 shadow-sm h-full max-h-[580px]">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border-tertiary/20 pb-3">
        <div>
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Clock className="w-4 h-4 text-text-info" />
            TEMPORAL PATIENT TIMELINE
          </h2>
          <p className="text-[11px] text-text-secondary">
            Trace the chronological flow of measurements and clinical parameters.
          </p>
        </div>

        {/* Sort Order Toggle */}
        <select
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value as any);
            setVisibleCount(15); // reset view count
          }}
          className="bg-bg-primary text-xs font-semibold text-text-primary border border-border-tertiary rounded px-3 py-1.5 focus:outline-none focus:border-text-info cursor-pointer"
        >
          <option value="asc">Chronological (Oldest First)</option>
          <option value="desc">Reverse Chronological (Newest First)</option>
        </select>
      </div>

      {/* Scrollable Timeline Stream */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[420px] scrollbar-thin">
        {visibleMeasurements.map((m, index) => {
          const isLast = index === visibleMeasurements.length - 1;
          const status = getGlucoseStatus(m.glucose);
          const convertedGlucose = units === "mmol/L" 
            ? (m.glucose / 18.0182).toFixed(1) 
            : m.glucose;

          return (
            <div key={index} className="flex flex-col items-stretch">
              <div className="flex items-start gap-4">
                {/* Node marker with indicator line */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] border ${
                    m.glucose >= 180 ? "bg-text-danger/10 text-text-danger border-text-danger/30" : 
                    m.glucose <= 70 ? "bg-text-warning/10 text-text-warning border-text-warning/30" : 
                    "bg-text-success/10 text-text-success border-text-success/30"
                  }`}>
                    {convertedGlucose}
                  </div>
                  {!isLast && (
                    <div className="w-[2px] h-12 bg-border-tertiary/40 my-1 flex items-center justify-center">
                      <ArrowDown className="w-3 h-3 text-text-tertiary/30 animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Node details */}
                <div className="flex-1 bg-bg-primary/40 border border-border-tertiary/20 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-text-primary">
                        {formatDate(m.date)}
                      </span>
                      <span className="text-[10px] text-text-tertiary font-mono">
                        {formatTime(m.date)}
                      </span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase font-mono ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-text-secondary flex items-center gap-1">
                      <Activity className="w-3 h-3 text-text-info" />
                      <span>Glucose level registered: <strong className="text-text-primary">{convertedGlucose} {units}</strong></span>
                    </div>
                  </div>

                  {/* Sugar Intake Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase font-bold text-text-tertiary">Sugar Intake:</span>
                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                      m.consumedSugarLast6Hours === "YES"
                        ? "bg-text-danger/10 text-text-danger border-text-danger/25"
                        : "bg-text-success/10 text-text-success border-text-success/25"
                    }`}>
                      {m.consumedSugarLast6Hours || "NO"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Load more indicator */}
        {sortedMeasurements.length > visibleCount && (
          <div className="pt-2 text-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 15)}
              className="text-xs font-bold text-text-info hover:text-text-info/80 hover:underline flex items-center gap-1 mx-auto cursor-pointer"
            >
              Load more measurements ({sortedMeasurements.length - visibleCount} remaining)
              <ChevronRight className="w-3.5 h-3.5 rotate-90" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
