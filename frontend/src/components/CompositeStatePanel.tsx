"use client";

import React from "react";
import { CompositeStateOutput } from "../store/useTCREStore";
import { ShieldAlert, Activity, Sparkles, TrendingUp, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

import { useTCREStore } from "../store/useTCREStore";

interface CompositeStatePanelProps {
  compositeState: CompositeStateOutput | null;
  isLoading: boolean;
}

export default function CompositeStatePanel({ compositeState, isLoading }: CompositeStatePanelProps) {
  const setActiveExplainabilityTab = useTCREStore(state => state.setActiveExplainabilityTab);

  if (isLoading || !compositeState) {
    return (
      <section className="bg-bg-secondary rounded-lg p-5 border border-border-tertiary h-48 flex items-center justify-center">
        <span className="text-xs text-text-tertiary animate-pulse">Running composite state synthesis...</span>
      </section>
    );
  }

  const isActive = compositeState.status !== "Inactive";

  // Severity style helper
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "Severe":
        return "bg-text-danger/10 text-text-danger border border-text-danger/20 font-bold";
      case "High":
        return "bg-text-warning/10 text-text-warning border border-text-warning/20 font-bold";
      case "Moderate":
        return "bg-text-info/10 text-text-info border border-text-info/20 font-medium";
      case "Normal":
      default:
        return "bg-text-success/10 text-text-success border border-text-success/20 font-medium";
    }
  };

  // Standardized V2 Status Colors
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Candidate":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold";
      case "Emerging":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold";
      case "Active":
        return "bg-green-500/10 text-green-500 border border-green-500/20 font-bold";
      case "Escalating":
        return "bg-red-500/10 text-red-500 border border-red-500/20 font-bold";
      case "Stable":
        return "bg-slate-400/10 text-slate-400 border border-slate-400/20 font-bold";
      case "Decaying":
        return "bg-orange-500/10 text-orange-500 border border-orange-500/20 font-bold";
      case "Resolved":
        return "bg-slate-600/10 text-slate-600 border border-slate-600/20 font-bold";
      case "Inactive":
      default:
        return "bg-bg-tertiary text-text-secondary border border-border-tertiary font-bold";
    }
  };

  const handleClick = () => {
    setActiveExplainabilityTab("composite");
    const element = document.getElementById("patent-explainability-explorer");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section 
      onClick={handleClick}
      className="bg-bg-secondary rounded-lg p-5 border border-border-tertiary flex flex-col gap-4 shadow-sm relative overflow-hidden cursor-pointer hover:border-text-info/40"
    >
      {/* Decorative pulse background if active */}
      {isActive && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-text-danger/5 rounded-full filter blur-3xl pointer-events-none -mr-20 -mt-20 animate-pulse"></div>
      )}

      <div className="flex flex-col gap-0.5 relative z-10">
        <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <ShieldAlert className={`w-4 h-4 ${isActive ? "text-text-danger" : "text-text-secondary"}`} />
          Composite State Synthesis
        </h2>
        <p className="text-[11px] text-text-secondary">
          High-order clinical states evaluated via interaction coupling models.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch relative z-10">
        {/* Left Side: Score display */}
        <div className={`p-4 rounded-lg border flex flex-col justify-center items-center text-center gap-2 transition duration-200 ${
          isActive 
            ? "bg-text-danger/5 border-text-danger/20" 
            : "bg-bg-tertiary/60 border-border-tertiary"
        }`}>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary mb-1">
              {compositeState.name}
            </span>
            <span className={`text-4xl font-bold font-mono ${isActive ? "text-text-danger" : "text-text-secondary"}`}>
              {compositeState.score}
            </span>
            <span className="text-[10px] text-text-tertiary mt-0.5">Synthesis Score</span>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center mt-2">
            <span className={`px-2 py-0.5 rounded text-[10px] border ${getSeverityBadgeClass(compositeState.severity)}`}>
              {compositeState.severity}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] border ${getStatusBadgeClass(compositeState.status)}`}>
              {compositeState.status}
            </span>
          </div>

          {/* Dialog for Composite Evidence */}
          <Dialog>
            <DialogTrigger 
              onClick={(e) => {
                e.stopPropagation();
                setActiveExplainabilityTab("composite");
              }}
              className="text-[11px] font-semibold text-text-primary hover:underline cursor-pointer flex items-center justify-center gap-1 mt-2.5 pt-2 border-t border-dashed border-border-tertiary w-full text-center"
            >
              <FileText className="w-3.5 h-3.5" /> View evidence →
            </DialogTrigger>
            <DialogContent className="bg-bg-primary text-text-primary border-border-secondary max-w-md p-6 max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-text-warning animate-pulse" />
                  Composite State Evidence: {compositeState.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-text-secondary">
                  Synthesis coupling pathway, constituent states, and temporal persistence.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* COMPOSITE SUMMARY */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    Composite Summary
                  </h4>
                  <div className="bg-bg-secondary p-3 rounded border border-border-tertiary grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between items-center pr-2 border-r border-border-tertiary">
                      <span className="text-text-secondary">State:</span>
                      <strong className="text-text-primary font-semibold">{compositeState.name}</strong>
                    </div>
                    <div className="flex justify-between items-center pl-2">
                      <span className="text-text-secondary">Composite Score:</span>
                      <strong className="text-text-primary font-mono text-sm">{compositeState.score}/100</strong>
                    </div>
                    <div className="flex justify-between items-center pr-2 border-r border-border-tertiary">
                      <span className="text-text-secondary">Confidence:</span>
                      <strong className="text-text-primary font-mono text-sm">{compositeState.confidence}%</strong>
                    </div>
                    <div className="flex justify-between items-center pl-2">
                      <span className="text-text-secondary">Severity:</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] border ${getSeverityBadgeClass(compositeState.severity)}`}>
                        {compositeState.severity}
                      </span>
                    </div>
                    <div className="col-span-2 border-t border-border-tertiary pt-2 mt-1 flex justify-between items-center">
                      <span className="text-text-secondary">Lifecycle:</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] border ${getStatusBadgeClass(compositeState.status)}`}>
                        {compositeState.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CONSTITUENT STATES */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    Constituent States
                  </h4>
                  <div className="bg-bg-secondary/60 p-3 rounded border border-border-tertiary space-y-2">
                    {compositeState.contributingStates.map((state, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-mono">
                        <span className="text-text-secondary">{state.name}</span>
                        <span className="flex-1 border-b border-dotted border-border-tertiary mx-2 h-2"></span>
                        <span className="text-text-primary font-bold">{state.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* COUPLING METRICS */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    Coupling &amp; Temporal Metrics
                  </h4>
                  <div className="bg-bg-secondary/60 p-3 rounded border border-border-tertiary grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="flex justify-between items-center pr-2 border-r border-border-tertiary">
                      <span className="text-text-secondary">Interaction Strength:</span>
                      <span className="text-text-primary font-bold">{(compositeState.interactionStrength * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center pl-2">
                      <span className="text-text-secondary">Persistence:</span>
                      <span className="text-text-primary font-bold">{compositeState.persistenceDays.toFixed(1)} Days</span>
                    </div>
                  </div>
                </div>

                {/* ACTIVATION GATES */}
                {compositeState.gates && compositeState.gates.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                      Activation Gates &amp; Status
                    </h4>
                    <div className="bg-bg-secondary p-3 rounded border border-border-tertiary space-y-1.5 text-xs">
                      {compositeState.gates.map((gate, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-text-secondary">{gate.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            gate.met 
                              ? "bg-text-success/15 text-text-success border border-text-success/20" 
                              : "bg-text-danger/15 text-text-danger border border-text-danger/20"
                          }`}>
                            {gate.met ? "PASSED ✓" : "FAILED ✗"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* REASONING NARRATIVE */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                    Synthesis Pathway &amp; Narrative
                  </h4>
                  <div className="bg-bg-secondary/60 p-3 rounded border border-border-tertiary space-y-3">
                    <p className="text-xs text-text-secondary leading-relaxed">
                      "{compositeState.reasoningNarrative}"
                    </p>
                    
                    {/* Synthesis Pathway Diagram */}
                    <div className="border-t border-border-tertiary pt-3 mt-1">
                      <p className="text-[10px] uppercase font-bold text-text-tertiary mb-2">Synthesis Pathway Map</p>
                      <div className="bg-bg-primary border border-border-tertiary rounded p-3 text-center text-[10px] font-mono space-y-1.5 text-text-secondary">
                        <div className="flex justify-around items-center">
                          <span className="bg-bg-secondary px-1.5 py-0.5 rounded border border-border-tertiary">
                            SD ({compositeState.contributingStates.find(s => s.name === "Silent Deterioration")?.score || 0})
                          </span>
                          <span className="text-text-tertiary">⚡</span>
                          <span className="bg-bg-secondary px-1.5 py-0.5 rounded border border-border-tertiary">
                            HV ({compositeState.contributingStates.find(s => s.name === "High Variability")?.score || 0})
                          </span>
                        </div>
                        <div className="text-text-tertiary">↓</div>
                        <div className="flex justify-center gap-1 items-center">
                          <span>Interaction Coupling:</span>
                          <span className="text-text-info font-bold">{(compositeState.interactionStrength * 100).toFixed(0)}%</span>
                        </div>
                        <div className="text-text-tertiary">↓</div>
                        <div className="flex justify-center gap-1 items-center">
                          <span>Persistence (≥ 3d):</span>
                          <span className={compositeState.persistenceDays >= 3.0 ? "text-text-success font-bold font-mono" : "text-text-danger font-bold font-mono"}>
                            {compositeState.persistenceDays >= 3.0 ? "✓" : "✗"} {compositeState.persistenceDays.toFixed(1)}d
                          </span>
                        </div>
                        <div className="text-text-tertiary">↓</div>
                        <div className={`px-2 py-0.5 rounded inline-block uppercase font-bold border ${
                          compositeState.status === 'Active' || compositeState.status === 'Escalating'
                            ? "bg-text-danger/10 text-text-danger border-text-danger/20"
                            : "bg-text-warning/10 text-text-warning border border-text-warning/20"
                        }`}>
                          {compositeState.name} ({compositeState.status}: {compositeState.score})
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Center Side: Contributing Factors & Interaction */}
        <div className="bg-bg-tertiary/40 border border-border-tertiary rounded-lg p-4 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-text-info" /> Contributing State Inputs
            </span>
            <div className="space-y-1.5 mt-2">
              {compositeState.contributingStates.map((state, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">{state.name}</span>
                  <span className="font-mono font-bold text-text-primary">{state.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border-tertiary pt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-[10px] text-text-tertiary">Interaction Strength</p>
              <p className="font-mono font-bold text-text-primary mt-0.5">
                {(compositeState.interactionStrength * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] text-text-tertiary">Persistence Period</p>
              <p className="font-mono font-bold text-text-primary mt-0.5">
                {compositeState.persistenceDays.toFixed(1)} Days
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Explainability Narrative */}
        <div className="bg-bg-tertiary/40 border border-border-tertiary rounded-lg p-4 flex flex-col gap-2 justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-text-warning" /> Reasoning Narrative
            </span>
            <p className="text-[11px] text-text-secondary leading-relaxed mt-1">
              "{compositeState.reasoningNarrative}"
            </p>
          </div>

          <div className="border-t border-border-tertiary pt-2 flex items-center gap-1.5 text-[10px] text-text-tertiary">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Confidence index: {compositeState.confidence}%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
