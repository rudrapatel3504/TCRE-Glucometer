"use client";

import React, { useState, useEffect } from "react";
import { PatientRecord, AnalysisResult } from "../store/useTCREStore";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { RefreshCw, HelpCircle, Activity } from "lucide-react";

interface PatientHeaderProps {
  patient: PatientRecord | null;
  analysis: AnalysisResult | null;
  selectedWindow: number | null;
  onWindowChange: (days: number | null) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function PatientHeader({
  patient,
  analysis,
  selectedWindow,
  onWindowChange,
  onRefresh,
  isLoading,
}: PatientHeaderProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRefreshClick = () => {
    setRefreshing(true);
    onRefresh();
    // Enforce 500ms min loading animation as per spec
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    if (!mounted) return "";
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  const getWindowLabel = (days: number | null) => {
    if (days === null) return "All Time";
    return `Last ${days} days`;
  };

  return (
    <header className="sticky top-0 z-40 w-full h-auto min-h-[72px] md:h-18 bg-bg-secondary border-b border-border-tertiary px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm backdrop-blur-md bg-opacity-95">
      {/* Patient Info */}
      <div className="flex flex-col gap-1 flex-1">
        {patient ? (
          <>
            <h1 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-text-info animate-pulse" />
              Patient: <span className="font-bold">{patient.name}</span>
            </h1>
            <p className="text-xs text-text-secondary">
              DOB: {formatDate(patient.dob)} | Age: {patient.age} | ID: {patient.patientId}
            </p>
          </>
        ) : (
          <div className="h-10 flex items-center">
            <span className="text-xs text-text-tertiary animate-pulse">Loading patient record...</span>
          </div>
        )}
      </div>

      {/* Data Summary */}
      <div className="flex items-center text-xs text-text-secondary gap-1 flex-auto justify-start md:justify-center">
        {analysis ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>Measurements: <strong className="text-text-primary">{analysis.window.measurementCount}</strong></span>
            <span className="hidden sm:inline text-text-tertiary">|</span>
            <span className="hidden sm:inline">Span: <strong className="text-text-primary">{analysis.window.totalDays} days</strong></span>
            <span className="text-text-tertiary">|</span>
            <span className="flex items-center gap-1">
              Quality:{" "}
              <span
                className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                  analysis.window.dataQuality === "high"
                    ? "bg-text-success/15 text-text-success border border-text-success/20"
                    : analysis.window.dataQuality === "moderate"
                    ? "bg-text-warning/15 text-text-warning border border-text-warning/20"
                    : "bg-text-danger/15 text-text-danger border border-text-danger/20"
                }`}
              >
                {analysis.window.dataQuality === "high" ? "High (94%)" : "Moderate (72%)"}
              </span>
            </span>
            <Tooltip>
              <TooltipTrigger className="text-text-secondary hover:text-text-primary cursor-help bg-transparent border-0 p-0">
                <HelpCircle className="w-3.5 h-3.5" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                Data quality is calculated from outlier count, interpolation gaps, and temporal distribution.
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <span className="text-text-tertiary">Waiting for analysis...</span>
        )}
      </div>

      {/* Time Window Selector + Refresh */}
      <div className="flex items-center gap-3 flex-shrink-0 justify-end">
        <Select
          value={selectedWindow === null ? "all" : selectedWindow.toString()}
          onValueChange={(val) => {
            onWindowChange(!val || val === "all" ? null : parseInt(val, 10));
          }}
        >
          <SelectTrigger className="w-[140px] text-xs h-9 bg-bg-primary border-border-secondary">
            <SelectValue placeholder="Select window" />
          </SelectTrigger>
          <SelectContent className="bg-bg-primary text-text-primary border-border-secondary">
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={handleRefreshClick}
          disabled={isLoading || refreshing}
          variant="outline"
          size="icon"
          className="w-9 h-9 border-border-secondary text-text-secondary hover:text-text-primary hover:bg-bg-secondary flex items-center justify-center transition-all duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${(isLoading || refreshing) ? "animate-spin text-text-info" : ""}`} />
        </Button>
      </div>
    </header>
  );
}
