"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTCREStore } from "../store/useTCREStore";
import { Search, ArrowUpDown, ChevronDown, Filter, FileSpreadsheet, Sparkles, Trash2 } from "lucide-react";

export default function MeasurementHistory() {
  const { uploadedPatients, selectedPatientId, units, deleteMeasurementFromServer } = useTCREStore();

  const selectedPatient = useMemo(() => {
    return uploadedPatients.find(p => p.patientId === selectedPatientId) || null;
  }, [uploadedPatients, selectedPatientId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSugar, setFilterSugar] = useState<"ALL" | "YES" | "NO">("ALL");
  const [sortKey, setSortKey] = useState<"index" | "date" | "glucose" | "sugar">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSugar, sortKey, sortDirection]);

  if (!selectedPatient) return null;

  const measurements = selectedPatient.measurements;

  // 1. Map to include chronological 1-indexed number
  const mappedMeasurements = useMemo(() => {
    return measurements.map((m, idx) => ({
      ...m,
      originalIndex: idx + 1,
    }));
  }, [measurements]);

  // 2. Filter measurements
  const filteredMeasurements = useMemo(() => {
    return mappedMeasurements.filter((m) => {
      // Filter by Sugar
      if (filterSugar !== "ALL") {
        if (m.consumedSugarLast6Hours !== filterSugar) {
          return false;
        }
      }

      // Filter by Search (Date string or glucose value)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const dateObj = new Date(m.date);
        const dateStr = dateObj.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).toLowerCase();
        const timeStr = dateObj.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        }).toLowerCase();
        const convertedGlucose = units === "mmol/L"
          ? (m.glucose / 18.0182).toFixed(1)
          : m.glucose.toString();

        return (
          dateStr.includes(query) ||
          timeStr.includes(query) ||
          convertedGlucose.includes(query) ||
          (m.consumedSugarLast6Hours || "").toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [mappedMeasurements, filterSugar, searchQuery, units]);

  // 3. Sort measurements
  const sortedMeasurements = useMemo(() => {
    const sorted = [...filteredMeasurements];
    sorted.sort((a, b) => {
      let valA: any = a.originalIndex;
      let valB: any = b.originalIndex;

      if (sortKey === "date") {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      } else if (sortKey === "glucose") {
        valA = a.glucose;
        valB = b.glucose;
      } else if (sortKey === "sugar") {
        valA = a.consumedSugarLast6Hours || "NO";
        valB = b.consumedSugarLast6Hours || "NO";
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredMeasurements, sortKey, sortDirection]);

  // 4. Paginate measurements
  const totalPages = Math.max(1, Math.ceil(sortedMeasurements.length / itemsPerPage));
  const paginatedMeasurements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedMeasurements.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedMeasurements, currentPage]);

  const handleSort = (key: "index" | "date" | "glucose" | "sugar") => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

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

  return (
    <section className="bg-bg-secondary border border-border-tertiary rounded-lg p-5 flex flex-col gap-4 shadow-sm h-full">
      {/* Header details */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-text-info" />
            CHRONOLOGICAL MEASUREMENT REGISTRY
          </h2>
          <p className="text-[11px] text-text-secondary">
            Filter, search, and sort through the raw temporal dataset of the active patient profile.
          </p>
        </div>

        {/* Sorting order toggle */}
        <button
          onClick={() => {
            setSortKey("date");
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
          }}
          className="flex items-center gap-1 text-[10px] font-bold text-text-info uppercase bg-text-info/10 px-2.5 py-1.5 rounded border border-text-info/20 hover:bg-text-info/20 transition-all cursor-pointer"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          Toggle Chronological Order ({sortDirection === "asc" ? "Oldest First" : "Newest First"})
        </button>
      </div>

      {/* Filter and Search Bar controls */}
      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search records by date, time, glucose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-bg-primary text-xs text-text-primary pl-8 pr-3 py-1.5 rounded border border-border-tertiary focus:outline-none focus:border-text-info w-full"
          />
        </div>

        {/* Filter Sugar Intake */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-text-tertiary" />
          <select
            value={filterSugar}
            onChange={(e) => setFilterSugar(e.target.value as any)}
            className="bg-bg-primary text-xs font-semibold text-text-primary border border-border-tertiary rounded px-3 py-1.5 focus:outline-none focus:border-text-info cursor-pointer min-w-[130px]"
          >
            <option value="ALL">All Intakes</option>
            <option value="YES">Sugar Intake: YES</option>
            <option value="NO">Sugar Intake: NO</option>
          </select>
        </div>
      </div>

      {/* The Table */}
      <div className="overflow-x-auto border border-border-tertiary/50 rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-bg-primary/50 text-text-secondary border-b border-border-tertiary/70 font-semibold select-none">
              <th
                onClick={() => handleSort("index")}
                className="p-3 cursor-pointer hover:bg-bg-primary transition-colors min-w-[60px]"
              >
                <div className="flex items-center gap-1">
                  No. <ArrowUpDown className="w-3 h-3 text-text-tertiary" />
                </div>
              </th>
              <th
                onClick={() => handleSort("date")}
                className="p-3 cursor-pointer hover:bg-bg-primary transition-colors"
              >
                <div className="flex items-center gap-1">
                  Date & Time <ArrowUpDown className="w-3 h-3 text-text-tertiary" />
                </div>
              </th>
              <th
                onClick={() => handleSort("glucose")}
                className="p-3 cursor-pointer hover:bg-bg-primary transition-colors"
              >
                <div className="flex items-center gap-1">
                  Glucose ({units}) <ArrowUpDown className="w-3 h-3 text-text-tertiary" />
                </div>
              </th>
              <th
                onClick={() => handleSort("sugar")}
                className="p-3 cursor-pointer hover:bg-bg-primary transition-colors"
              >
                <div className="flex items-center gap-1">
                  Sugar Intake (6h) <ArrowUpDown className="w-3 h-3 text-text-tertiary" />
                </div>
              </th>
              <th className="p-3 text-center min-w-[60px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedMeasurements.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-tertiary bg-bg-primary/10">
                  No records match the current filters.
                </td>
              </tr>
            ) : (
              paginatedMeasurements.map((m) => {
                const isHigh = m.glucose >= 180;
                const isLow = m.glucose <= 70;
                const convertedGlucose = units === "mmol/L" 
                  ? (m.glucose / 18.0182).toFixed(1) 
                  : m.glucose;

                return (
                  <tr
                    key={m.originalIndex}
                    className="border-b border-border-tertiary/20 hover:bg-bg-primary/20 transition-all font-mono"
                  >
                    <td className="p-3 font-semibold text-text-tertiary">
                      #{m.originalIndex}
                    </td>
                    <td className="p-3 text-text-primary">
                      {formatDate(m.date)}{" "}
                      <span className="text-text-tertiary text-[10px] font-normal">
                        {formatTime(m.date)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`font-bold ${
                          isHigh
                            ? "text-text-danger bg-text-danger/10 border border-text-danger/25 px-1.5 py-0.5 rounded"
                            : isLow
                            ? "text-text-warning bg-text-warning/10 border border-text-warning/25 px-1.5 py-0.5 rounded"
                            : "text-text-success bg-text-success/10 border border-text-success/25 px-1.5 py-0.5 rounded"
                        }`}
                      >
                        {convertedGlucose}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded text-[10px] ${
                          m.consumedSugarLast6Hours === "YES"
                            ? "bg-text-danger/15 text-text-danger border border-text-danger/30"
                            : "bg-text-success/15 text-text-success border border-text-success/30"
                        }`}
                      >
                        {m.consumedSugarLast6Hours || "NO"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete this measurement from ${formatDate(m.date)} at ${formatTime(m.date)}?`)) {
                            deleteMeasurementFromServer(selectedPatient.patientId, m.date);
                          }
                        }}
                        className="text-text-danger/70 hover:text-text-danger hover:bg-text-danger/10 p-1 rounded transition-colors flex items-center justify-center mx-auto"
                        title="Delete Measurement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination indicators */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-xs text-text-secondary border-t border-border-tertiary/20 pt-3 mt-1">
          <div>
            Showing <strong className="text-text-primary">{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
            <strong className="text-text-primary">
              {Math.min(currentPage * itemsPerPage, sortedMeasurements.length)}
            </strong>{" "}
            of <strong className="text-text-primary">{sortedMeasurements.length}</strong> records
          </div>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-2.5 py-1 rounded bg-bg-primary border border-border-tertiary disabled:opacity-50 text-[11px] font-bold hover:border-text-info/30"
            >
              Prev
            </button>
            <span className="py-1 px-2 font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-2.5 py-1 rounded bg-bg-primary border border-border-tertiary disabled:opacity-50 text-[11px] font-bold hover:border-text-info/30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
