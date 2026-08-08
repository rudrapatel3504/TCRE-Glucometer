"use client";

import React from "react";
import { ExplainabilityOutput, ReasoningConfidence, ConsistencyValidationReport, CompositeStateOutput } from "../store/useTCREStore";
import { MessageSquareText, ShieldQuestion, Brain, CheckCircle, AlertTriangle } from "lucide-react";

interface ExplainabilityPanelProps {
  explainability: ExplainabilityOutput | null;
  reasoningConfidence: ReasoningConfidence | undefined;
  consistencyReport: ConsistencyValidationReport | undefined;
  compositeState: CompositeStateOutput | null | undefined;
  isLoading: boolean;
}

export default function ExplainabilityPanel({ 
  explainability, 
  reasoningConfidence, 
  consistencyReport, 
  compositeState,
  isLoading 
}: ExplainabilityPanelProps) {
  
  if (!explainability) {
    return (
      <section className="w-full bg-bg-secondary rounded-lg p-6 flex items-center justify-center text-center h-48 border border-border-tertiary">
        <span className="text-xs text-text-tertiary animate-pulse">Assembling clinical reasoning data...</span>
      </section>
    );
  }

  const getProgressColor = (val: number) => {
    if (val >= 80) return "bg-text-success";
    if (val >= 50) return "bg-text-warning";
    return "bg-text-danger";
  };

  const getOverallStatus = () => {
    if (!consistencyReport) return 'PASS';
    const checks = Object.values(consistencyReport.checks);
    if (checks.some(c => c.status === 'FAIL')) return 'FAIL';
    if (checks.some(c => c.status === 'WARNING')) return 'WARNING';
    return 'PASS';
  };

  const overallStatus = getOverallStatus();

  return (
    <section className="w-full bg-bg-secondary rounded-lg p-5 border border-border-tertiary flex flex-col gap-4 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
          <MessageSquareText className="w-4 h-4 text-text-info" /> Clinical Explainability Engine
        </h2>
        <p className="text-[11px] text-text-secondary">
          Clinical reasoning narrative, active drivers, and signal confidence limits.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Panel 1: Clinical Reasoning Summary */}
        <div className="bg-text-info/10 border border-text-info/20 rounded-lg p-4 shadow-xs">
          <h4 className="text-xs font-bold text-text-info uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MessageSquareText className="w-3.5 h-3.5" /> Clinical Reasoning Narrative
          </h4>
          <p className="text-xs text-text-primary leading-relaxed">
            {explainability.summary}
          </p>
        </div>

        {/* NEW: Reasoning Confidence Dashboard (Rule 4) */}
        {reasoningConfidence && (
          <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 shadow-xs">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-text-info" /> Layer-by-Layer Confidence
            </h4>
            <div className="space-y-3">
              {[
                { label: "State Confidence", val: reasoningConfidence.stateConfidence },
                { label: "Composite Confidence", val: reasoningConfidence.compositeConfidence },
                { label: "Risk Confidence", val: reasoningConfidence.riskConfidence },
                { label: "Recommendation Confidence", val: reasoningConfidence.recommendationConfidence }
              ].map((c, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-text-secondary">{c.label}</span>
                    <span className="font-mono font-bold text-text-primary">{c.val}%</span>
                  </div>
                  <div className="w-full bg-bg-secondary h-1.5 rounded-full overflow-hidden border border-border-tertiary/40">
                    <div 
                      className={`h-full ${getProgressColor(c.val)} transition-all duration-500`}
                      style={{ width: `${c.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEW: Reasoning Consistency Check (Rule 3) */}
        {consistencyReport && (
          <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                Automated Consistency Checks
              </h4>
              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-extrabold border ${
                overallStatus === 'FAIL'
                  ? "bg-text-danger/15 text-text-danger border-text-danger/30"
                  : overallStatus === 'WARNING'
                    ? "bg-text-warning/15 text-text-warning border-text-warning/30"
                    : "bg-text-success/15 text-text-success border-text-success/30"
              }`}>
                {overallStatus === 'FAIL' ? "CONTRADICTION" : overallStatus === 'WARNING' ? "WARNING" : "PASSED"}
              </span>
            </div>

            {/* Warnings Alert Box */}
            {consistencyReport.warnings.length > 0 && (
              <div className="bg-text-danger/10 border border-text-danger/25 rounded p-2.5 mb-3 text-[11px] text-text-danger space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Clinical Contradictions Found:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  {consistencyReport.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Composite Activation Gates (Composite Candidate / Emerging) */}
            {compositeState && (compositeState.status === 'Candidate' || compositeState.status === 'Emerging') && (
              <div className="bg-text-warning/10 border border-text-warning/25 rounded p-3 mb-3 text-[11px] text-text-primary space-y-1.5">
                <p className="font-bold flex items-center gap-1 text-text-warning">
                  <AlertTriangle className="w-3.5 h-3.5" /> Activation Gates (Composite State):
                </p>
                <div className="grid grid-cols-1 gap-1.5 pl-1 my-1">
                  {compositeState.gates?.map((gate, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                      {gate.met ? (
                        <span className="text-text-success font-bold">✓</span>
                      ) : (
                        <span className="text-text-danger font-bold">✗</span>
                      )}
                      <span className={gate.met ? "text-text-primary" : "text-text-secondary line-through opacity-85"}>
                        {gate.name}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-text-secondary italic mt-1">
                  Result: Composite remains <strong className="text-text-warning uppercase font-bold">{compositeState.status}</strong>.
                </p>
              </div>
            )}

            {/* Individual Checks List */}
            <div className="space-y-2 text-xs">
              {Object.values(consistencyReport.checks).map((check, idx) => {
                let badgeBg = "bg-text-success/10 border-text-success/20";
                let badgeText = "text-text-success";
                let Icon = CheckCircle;
                if (check.status === 'WARNING') {
                  badgeBg = "bg-text-warning/10 border-text-warning/20";
                  badgeText = "text-text-warning";
                  Icon = AlertTriangle;
                } else if (check.status === 'FAIL') {
                  badgeBg = "bg-text-danger/10 border-text-danger/20";
                  badgeText = "text-text-danger";
                  Icon = AlertTriangle;
                }

                return (
                  <div key={idx} className={`flex items-start gap-2 border p-2 rounded ${badgeBg}`}>
                    <Icon className={`w-3.5 h-3.5 ${badgeText} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <h5 className={`font-bold text-[11px] ${badgeText}`}>{check.name}</h5>
                        <span className={`px-1 py-0.2 rounded text-[8px] font-extrabold uppercase ${badgeBg} border`}>
                          {check.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">{check.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Panel 2: Primary Drivers */}
        <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 shadow-xs">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
            Primary Glycemic Risk Factors
          </h4>
          <div className="flex flex-wrap gap-2">
            {explainability.drivers.map((driver) => (
              <span
                key={driver}
                className="inline-flex items-center gap-1 px-3 py-1 bg-text-warning/10 text-text-warning border border-text-warning/20 rounded text-xs font-medium"
              >
                ⚠️ {driver}
              </span>
            ))}
          </div>
        </div>

        {/* Panel 3: Confidence Limitations */}
        <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 shadow-xs">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ShieldQuestion className="w-3.5 h-3.5 text-text-tertiary" /> Signal Confidence Limitations
          </h4>
          <ul className="space-y-2">
            {explainability.limitations.map((limitation, i) => (
              <li key={i} className="flex gap-2 text-xs text-text-secondary leading-normal">
                <span className="text-text-warning flex-shrink-0">⚠️</span>
                <span>{limitation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
