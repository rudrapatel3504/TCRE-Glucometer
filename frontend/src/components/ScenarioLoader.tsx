"use client";

import React, { useState, useEffect } from "react";
import { useTCREStore, PatientRecord, Measurement } from "../store/useTCREStore";
import { Play, Check, CheckCircle2, AlertTriangle, HelpCircle, Activity, FileText, Cpu, Layers, ShieldAlert, RefreshCw } from "lucide-react";
import { SCENARIOS, generateScenarioData } from "../lib/scenarioData";

export default function ScenarioLoader() {
  const [selectedId, setSelectedId] = useState<string>("healthy");
  const { 
    patient, 
    setPatient, 
    setMeasurements, 
    analysis, 
    crceReport, 
    stressTestSummary, 
    runStressTest, 
    showToast,
    isLoading
  } = useTCREStore();

  const activeScenario = SCENARIOS.find(s => s.id === selectedId) || SCENARIOS[0];

  // Sync selectedId with patient in store
  useEffect(() => {
    if (patient) {
      const matched = SCENARIOS.find(s => s.patientId === patient.patientId);
      if (matched) {
        setSelectedId(matched.id);
      }
    }
  }, [patient]);

  // Load selected scenario into store
  const handleLoadScenario = (id: string) => {
    setSelectedId(id);
    const sc = SCENARIOS.find(s => s.id === id);
    if (!sc) return;

    const patientRec: PatientRecord = {
      name: sc.patientName,
      age: parseInt(sc.dob.split("-")[0]) ? (new Date().getFullYear() - parseInt(sc.dob.split("-")[0])) : 50,
      dob: sc.dob,
      patientId: sc.patientId
    };

    const telemetry = generateScenarioData(id);
    
    setPatient(patientRec);
    setMeasurements(telemetry);
    
    showToast(`Loaded scenario: ${sc.name} (${sc.patientName})`, "success");
  };

  // Status Badge Colors Helper
  const getStatusBadge = (status: 'PASS' | 'WARNING' | 'FAIL') => {
    if (status === 'PASS') {
      return (
        <span className="text-text-success font-extrabold flex items-center gap-0.5 font-mono text-[10px]">
          <Check className="w-3 h-3 stroke-[3]" /> PASS
        </span>
      );
    }
    if (status === 'WARNING') {
      return (
        <span className="text-text-warning font-bold flex items-center gap-0.5 font-mono text-[10px]">
          <AlertTriangle className="w-3 h-3" /> WARN
        </span>
      );
    }
    return (
      <span className="text-text-danger font-black flex items-center gap-0.5 font-mono text-[10px] animate-pulse">
        <ShieldAlert className="w-3 h-3" /> FAIL
      </span>
    );
  };

  return (
    <div className="bg-bg-secondary border border-border-tertiary rounded-lg p-5 flex flex-col gap-5 shadow-sm">
      {/* Selector Dropdown Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-text-info" />
            CLINICAL RULE CONSISTENCY VALIDATION ENGINE (CRCE)
          </h2>
          <p className="text-[11px] text-text-secondary">
            Deterministic validation checking clinical rules, mathematical consistency, and patent-aligned reasoning layers.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="flex gap-2 items-center">
            <label htmlFor="scenario-select" className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Scenario:
            </label>
            <select
              id="scenario-select"
              value={selectedId}
              onChange={(e) => handleLoadScenario(e.target.value)}
              className="bg-bg-primary text-xs font-semibold text-text-primary border border-border-tertiary rounded px-3 py-1.5 focus:outline-none focus:border-text-info cursor-pointer"
            >
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => runStressTest()}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-text-info hover:bg-text-info/90 text-white font-bold text-xs px-3.5 py-1.5 rounded transition disabled:opacity-55"
          >
            <Cpu className="w-3.5 h-3.5" />
            Run Complete Validation
          </button>
        </div>
      </div>

      {/* Main Grid: Info | Checker | Stress Test Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 border-t border-border-tertiary/40 pt-4">
        
        {/* Scenario Narrative Column */}
        <div className="lg:col-span-1 space-y-4 bg-bg-primary/40 border border-border-tertiary/20 p-4 rounded-lg flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-bold text-text-info tracking-wider">Clinical Case Study</span>
              <span className="text-[10px] text-text-secondary font-semibold">{activeScenario.patientName} | {activeScenario.condition}</span>
            </div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide">
              {activeScenario.name}
            </h3>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              {activeScenario.narrative}
            </p>
          </div>

          <div className="border-t border-border-tertiary/30 pt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-text-tertiary">
            <div>
              <span className="block font-bold uppercase text-[8px] text-text-tertiary">Patient ID</span>
              <span className="font-mono text-text-secondary font-bold">{activeScenario.patientId}</span>
            </div>
            <div>
              <span className="block font-bold uppercase text-[8px] text-text-tertiary">DOB</span>
              <span className="font-mono text-text-secondary font-semibold">{activeScenario.dob}</span>
            </div>
            <div>
              <span className="block font-bold uppercase text-[8px] text-text-tertiary">Expected Spec</span>
              <span className="font-semibold text-text-secondary font-mono">{activeScenario.expectedMetric}</span>
            </div>
          </div>
        </div>

        {/* Live Patent Validator Column */}
        <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 flex flex-col justify-between gap-3 relative overflow-hidden">
          <div className="space-y-2.5">
            <span className="text-[9px] uppercase font-bold text-text-info tracking-wider block">Real-time Rule Verification</span>
            <h3 className="text-[11px] font-bold text-text-primary uppercase tracking-wider">8-Layer Audit Dashboard</h3>
            
            {/* 8 layers grid checklist */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 text-[11px]">
              <div className="flex justify-between items-center border-b border-border-tertiary/10 pb-1">
                <span className="text-text-secondary">1. Metric Layer:</span>
                {crceReport ? getStatusBadge(crceReport.validationResults.metrics.status) : getStatusBadge('WARNING')}
              </div>
              <div className="flex justify-between items-center border-b border-border-tertiary/10 pb-1">
                <span className="text-text-secondary">5. Recommendation:</span>
                {crceReport ? getStatusBadge(crceReport.validationResults.recommendations.status) : getStatusBadge('WARNING')}
              </div>
              <div className="flex justify-between items-center border-b border-border-tertiary/10 pb-1">
                <span className="text-text-secondary">2. Latent State:</span>
                {crceReport ? getStatusBadge(crceReport.validationResults.latents.status) : getStatusBadge('WARNING')}
              </div>
              <div className="flex justify-between items-center border-b border-border-tertiary/10 pb-1">
                <span className="text-text-secondary">6. Prediction:</span>
                {crceReport ? getStatusBadge(crceReport.validationResults.predictions.status) : getStatusBadge('WARNING')}
              </div>
              <div className="flex justify-between items-center border-b border-border-tertiary/10 pb-1">
                <span className="text-text-secondary">3. Composite:</span>
                {crceReport ? getStatusBadge(crceReport.validationResults.composites.status) : getStatusBadge('WARNING')}
              </div>
              <div className="flex justify-between items-center border-b border-border-tertiary/10 pb-1">
                <span className="text-text-secondary">7. Digital Twin:</span>
                {crceReport ? getStatusBadge(crceReport.validationResults.digitalTwin.status) : getStatusBadge('WARNING')}
              </div>
              <div className="flex justify-between items-center border-b border-border-tertiary/10 pb-1">
                <span className="text-text-secondary">4. Risk Assessment:</span>
                {crceReport ? getStatusBadge(crceReport.validationResults.risk.status) : getStatusBadge('WARNING')}
              </div>
              <div className="flex justify-between items-center border-b border-border-tertiary/10 pb-1">
                <span className="text-text-secondary">8. Explainability:</span>
                {crceReport ? getStatusBadge(crceReport.validationResults.explainability.status) : getStatusBadge('WARNING')}
              </div>
            </div>
          </div>

          {/* Validation Status Badge */}
          {crceReport ? (
            crceReport.overallStatus === 'PASS' ? (
              <div className="bg-text-success/10 text-text-success border border-text-success/20 py-2 px-3 rounded text-center text-[9px] font-black tracking-wide uppercase flex items-center justify-center gap-1.5 leading-normal">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Fully Validated | Patent Logic Consistency Verified | Clinical Rule Consistency Verified | 100% PASS
              </div>
            ) : crceReport.overallStatus === 'WARNING' ? (
              <div className="bg-text-warning/10 text-text-warning border border-text-warning/20 py-2 rounded text-center text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Validated With Warnings (Score: {crceReport.overallCompliance}%)
              </div>
            ) : (
              <div className="bg-text-danger/10 text-text-danger border border-text-danger/20 py-2 rounded text-center text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-1.5">
                <ShieldAlert className="w-4 h-4 animate-bounce" /> Logic Inconsistent (Score: {crceReport.overallCompliance}%)
              </div>
            )
          ) : (
            <div className="bg-text-warning/15 text-text-warning border border-text-warning/20 py-2 rounded text-center text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-1.5">
              <RefreshCw className="w-4 h-4 animate-spin" /> Awaiting Engine Calculation...
            </div>
          )}
        </div>

        {/* Validation Summary (Stress Test Results) Column */}
        <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 flex flex-col justify-between gap-3 relative overflow-hidden">
          <div className="space-y-2.5">
            <span className="text-[9px] uppercase font-bold text-text-info tracking-wider block">Stress Test Diagnostics</span>
            <h3 className="text-[11px] font-bold text-text-primary uppercase tracking-wider">Validation Suite Summary</h3>
            
            {stressTestSummary ? (
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between border-b border-border-tertiary/10 pb-1">
                  <span className="text-text-secondary">Scenarios Passed:</span>
                  <span className="font-bold text-text-primary font-mono">{stressTestSummary.scenariosPassed} / 10</span>
                </div>
                <div className="flex justify-between border-b border-border-tertiary/10 pb-1">
                  <span className="text-text-secondary">Average Compliance:</span>
                  <span className="font-bold text-text-primary font-mono">{stressTestSummary.averageCompliance}%</span>
                </div>
                <div className="flex justify-between border-b border-border-tertiary/10 pb-1">
                  <span className="text-text-secondary">Average Confidence:</span>
                  <span className="font-bold text-text-primary font-mono">{stressTestSummary.averageConfidence}%</span>
                </div>
                <div className="flex justify-between border-b border-border-tertiary/10 pb-1">
                  <span className="text-text-secondary">Average Runtime:</span>
                  <span className="font-bold text-text-primary font-mono">{stressTestSummary.averageRuntimeMs} ms</span>
                </div>
                <div className="flex justify-between border-b border-border-tertiary/10 pb-1">
                  <span className="text-text-secondary">Total Warnings/Errors:</span>
                  <span className="font-semibold font-mono">
                    <span className="text-text-warning">{stressTestSummary.totalWarnings}W</span> / <span className="text-text-danger">{stressTestSummary.totalErrors}E</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-28 flex flex-col items-center justify-center text-center gap-1">
                <FileText className="w-8 h-8 text-text-tertiary/50" />
                <span className="text-[10px] text-text-tertiary font-semibold">Stress Test Idle</span>
                <span className="text-[9px] text-text-tertiary max-w-[160px] leading-snug">Click "Run Complete Validation" to test all 10 synthetic scenario profiles.</span>
              </div>
            )}
          </div>

          {/* Patent Ready Badge */}
          {stressTestSummary ? (
            stressTestSummary.patentReady === 'YES' ? (
              <div className="bg-text-success text-white py-2 rounded text-center text-xs font-black tracking-widest uppercase">
                Patent Ready: YES
              </div>
            ) : (
              <div className="bg-text-danger text-white py-2 rounded text-center text-xs font-black tracking-widest uppercase">
                Patent Ready: NO
              </div>
            )
          ) : (
            <div className="bg-bg-secondary border border-border-tertiary text-text-tertiary py-2 rounded text-center text-xs font-bold uppercase">
              Validation Suite Pending
            </div>
          )}
        </div>
      </div>

      {/* Warnings list section */}
      {crceReport && crceReport.warnings.length > 0 && (
        <div className="bg-text-warning/5 border border-text-warning/20 p-3 rounded-lg flex flex-col gap-1.5">
          <h4 className="text-[10px] uppercase font-bold text-text-warning flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            VALIDATION WARNINGS ({crceReport.warnings.length})
          </h4>
          <ul className="list-disc list-inside text-[10px] text-text-secondary space-y-1 font-mono">
            {crceReport.warnings.slice(0, 3).map((w, idx) => (
              <li key={idx} className="truncate">
                [{w.module}] {w.message}
              </li>
            ))}
            {crceReport.warnings.length > 3 && (
              <li className="list-none text-text-tertiary italic pl-4">
                ...and {crceReport.warnings.length - 3} more warnings.
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Intelligent Failure Reports section */}
      {crceReport && crceReport.errors.length > 0 && (
        <div className="bg-text-danger/5 border border-text-danger/20 p-4 rounded-lg flex flex-col gap-3">
          <h4 className="text-[10px] uppercase font-bold text-text-danger flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
            INTELLIGENT FAILURE REPORTS ({crceReport.errors.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            {crceReport.errors.slice(0, 2).map((err, idx) => (
              <div key={idx} className="bg-bg-primary/60 border border-border-tertiary/20 p-3 rounded flex flex-col gap-1">
                <div className="flex items-center justify-between border-b border-border-tertiary/10 pb-1">
                  <span className="font-bold text-text-danger uppercase text-[9px] tracking-wide">{err.module}</span>
                  <span className="text-[9px] text-text-tertiary font-mono">Error #{idx+1}</span>
                </div>
                <div className="text-text-secondary leading-snug pt-1 font-bold">{err.message}</div>
                <div className="grid grid-cols-2 gap-2 mt-1.5 text-[10px] font-mono text-text-tertiary">
                  <div>
                    <span className="block text-[8px] uppercase font-bold text-text-tertiary">Observed</span>
                    <span className="text-text-danger font-medium">{err.observed || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase font-bold text-text-tertiary">Expected</span>
                    <span className="text-text-success font-medium">{err.expected || 'N/A'}</span>
                  </div>
                </div>
                {err.fix && (
                  <div className="mt-2 pt-1.5 border-t border-border-tertiary/10 text-[10px] text-text-info font-medium leading-normal">
                    <span className="font-bold uppercase text-[8px] block text-text-secondary mb-0.5">Suggested Fix</span>
                    {err.fix}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
