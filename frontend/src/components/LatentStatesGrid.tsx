"use client";

import React, { useState } from "react";
import { LatentStatesOutput, LatentStateDetail, useTCREStore } from "../store/useTCREStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Info, ShieldAlert, Award, FileText, CheckCircle } from "lucide-react";

interface LatentStatesGridProps {
  states: LatentStatesOutput | null;
  isLoading: boolean;
}

export default function LatentStatesGrid({ states, isLoading }: LatentStatesGridProps) {
  const setActiveExplainabilityTab = useTCREStore(state => state.setActiveExplainabilityTab);
  const setSelectedExplainabilityState = useTCREStore(state => state.setSelectedExplainabilityState);
  
  if (!states) {
    return (
      <section className="w-full bg-bg-secondary rounded-lg p-6 flex items-center justify-center text-center h-48 border border-border-tertiary">
        <span className="text-xs text-text-tertiary animate-pulse">Running latent state analysis...</span>
      </section>
    );
  }

  // Get color badges for severity
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

  const getConfidenceBadgeClass = (severity: string) => {
    switch (severity) {
      case "Very High Confidence":
        return "bg-text-success/15 text-text-success border border-text-success/25 font-bold";
      case "High Confidence":
        return "bg-text-success/10 text-text-success border border-text-success/15 font-bold";
      case "Moderate Confidence":
        return "bg-text-info/10 text-text-info border border-text-info/20 font-medium";
      case "Low Confidence":
      default:
        return "bg-text-danger/10 text-text-danger border border-text-danger/20 font-medium";
    }
  };

  // Get color for Status labels (Standardized V2 Colors)
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
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
      default:
        return "bg-bg-tertiary text-text-secondary border border-border-tertiary font-bold";
    }
  };

  // State Card Component
  interface StateCardProps {
    name: string;
    detail: LatentStateDetail;
    colorBg: string;
    colorBorder: string;
    colorText: string;
    stateKey: string;
  }

  const StateCard = ({ name, detail, colorBg, colorBorder, colorText, stateKey }: StateCardProps) => {
    const handleClick = () => {
      setActiveExplainabilityTab("latent");
      setSelectedExplainabilityState(stateKey);
      const element = document.getElementById("patent-explainability-explorer");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    return (
      <div
        onClick={handleClick}
        style={{
          backgroundColor: colorBg,
          borderColor: colorBorder,
        }}
        className={`border rounded-lg p-4 flex flex-col justify-between shadow-xs hover:shadow-md transition duration-200 relative group cursor-pointer hover:border-text-info/40`}
      >
        <div className="flex flex-col gap-2">
          <h3
            style={{ color: colorText }}
            className="text-sm font-bold tracking-tight uppercase"
          >
            {name}
          </h3>

          <div className="grid grid-cols-2 gap-y-2.5 gap-x-1.5 text-[11px] mt-2 border-t border-black/5 dark:border-white/5 pt-3">
            <div>
              <p className="text-text-secondary/70 dark:text-text-secondary/60">Score</p>
              <p style={{ color: colorText }} className="text-lg font-bold font-mono leading-none mt-0.5">
                {detail.score}
              </p>
            </div>

            <div>
              <p className="text-text-secondary/70 dark:text-text-secondary/60">Confidence</p>
              <p style={{ color: colorText }} className="text-sm font-semibold leading-none mt-1">
                {detail.confidence}%
              </p>
            </div>

            <div>
              <p className="text-text-secondary/70 dark:text-text-secondary/60 mb-0.5">Lifecycle</p>
              <span className={`inline-block px-1.5 py-0.5 rounded-[3px] text-[10px] border ${getStatusBadgeClass(detail.status)}`}>
                {detail.status}
              </span>
            </div>

            <div>
              <p className="text-text-secondary/70 dark:text-text-secondary/60 mb-0.5">
                {stateKey === "sc" ? "Confidence Level" : "Severity"}
              </p>
              <span className={`inline-block px-1.5 py-0.5 rounded-[3px] text-[10px] border ${
                stateKey === "sc" ? getConfidenceBadgeClass(detail.severity) : getSeverityBadgeClass(detail.severity)
              }`}>
                {detail.severity}
              </span>
            </div>
          </div>
        </div>

        {/* Dialog for details */}
        <Dialog>
          <DialogTrigger
            style={{ color: colorText }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveExplainabilityTab("latent");
              setSelectedExplainabilityState(stateKey);
            }}
            className="text-[11px] font-semibold flex items-center gap-1 hover:underline cursor-pointer mt-4 pt-2 border-t border-dashed border-black/5 dark:border-white/5 w-full text-left"
          >
            <FileText className="w-3.5 h-3.5" /> View evidence →
          </DialogTrigger>
          <DialogContent className="bg-bg-primary text-text-primary border-border-secondary max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-text-info animate-pulse" />
                State Evidence: {name}
              </DialogTitle>
              <DialogDescription className="text-xs text-text-secondary">
                Model logic evaluation, metric contributions, and temporal reasoning tree.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* STATE SUMMARY */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  State Summary
                </h4>
                <div className="bg-bg-secondary p-3 rounded border border-border-tertiary grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between items-center pr-2 border-r border-border-tertiary">
                    <span className="text-text-secondary">State:</span>
                    <strong className="text-text-primary font-semibold">{name}</strong>
                  </div>
                  <div className="flex justify-between items-center pl-2">
                    <span className="text-text-secondary">Score:</span>
                    <strong className="text-text-primary font-mono text-sm">{detail.score}/100</strong>
                  </div>
                  <div className="flex justify-between items-center pr-2 border-r border-border-tertiary">
                    <span className="text-text-secondary">Confidence:</span>
                    <strong className="text-text-primary font-mono text-sm">{detail.confidence}%</strong>
                  </div>
                  <div className="flex justify-between items-center pl-2">
                    <span className="text-text-secondary">
                      {stateKey === "sc" ? "Confidence Level:" : "Severity:"}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                      stateKey === "sc" ? getConfidenceBadgeClass(detail.severity) : getSeverityBadgeClass(detail.severity)
                    }`}>
                      {detail.severity}
                    </span>
                  </div>
                  <div className="col-span-2 border-t border-border-tertiary pt-2 mt-1 flex justify-between items-center">
                    <span className="text-text-secondary">Lifecycle Status:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${getStatusBadgeClass(detail.status)}`}>
                      {detail.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* METRIC CONTRIBUTIONS */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Metric Contributions
                </h4>
                <div className="bg-bg-secondary/60 p-3 rounded border border-border-tertiary space-y-2">
                  {detail.contributions?.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-mono">
                      <span className="text-text-secondary">{c.name}</span>
                      <span className="flex-1 border-b border-dotted border-border-tertiary mx-2 h-2"></span>
                      <span className="text-text-primary font-bold">+{c.value}</span>
                    </div>
                  ))}
                  {(!detail.contributions || detail.contributions.length === 0) && (
                    <p className="text-xs text-text-tertiary">No metric contributions calculated.</p>
                  )}
                </div>
              </div>

              {/* ACTIVATION GATES */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Activation Gates
                </h4>
                <div className="grid grid-cols-1 gap-2 bg-bg-secondary/60 p-3 rounded border border-border-tertiary">
                  {detail.gates?.map((gate, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className={gate.met ? "text-text-primary" : "text-text-tertiary line-through"}>
                        {gate.name}
                      </span>
                      <span className="flex-1 border-b border-dotted border-border-tertiary mx-2 h-2"></span>
                      <span className="flex items-center gap-1">
                        {gate.met ? (
                          <span className="text-text-success font-bold font-mono">✓ MET</span>
                        ) : (
                          <span className="text-text-tertiary font-bold font-mono">✗ BYPASS</span>
                        )}
                      </span>
                    </div>
                  ))}
                  {(!detail.gates || detail.gates.length === 0) && (
                    <p className="text-xs text-text-tertiary">No eligibility gates configured.</p>
                  )}
                </div>
              </div>

              {/* LIMITING FACTORS */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Limiting Factors
                </h4>
                <ul className="bg-bg-secondary/60 p-3 rounded border border-border-tertiary space-y-1.5 list-disc pl-5">
                  {detail.limitingFactors?.map((factor, idx) => (
                    <li key={idx} className="text-xs text-text-secondary leading-relaxed">
                      {factor}
                    </li>
                  ))}
                  {(!detail.limitingFactors || detail.limitingFactors.length === 0) && (
                    <li className="text-xs text-text-tertiary">No limiting factors detected.</li>
                  )}
                </ul>
              </div>

              {/* REASONING NARRATIVE */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Reasoning Narrative
                </h4>
                <div className="bg-bg-secondary/60 p-3 rounded border border-border-tertiary">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {detail.reasoningNarrative || "No narrative generated for this state."}
                  </p>
                </div>
              </div>

              {/* CLINICAL REASONING TREE */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Clinical Reasoning Tree
                </h4>
                <div className="bg-bg-secondary/60 p-3 rounded border border-border-tertiary space-y-3">
                  <div className="space-y-3 pl-2 border-l-2 border-border-secondary ml-2">
                    {detail.reasoningTree?.map((step, idx) => (
                      <div key={idx} className="relative flex items-center gap-2">
                        <div className="absolute -left-[13px] w-2 h-2 rounded-full bg-border-secondary border border-bg-primary"></div>
                        <span className="text-[11px] text-text-secondary font-mono leading-relaxed">{step}</span>
                      </div>
                    ))}
                    {(!detail.reasoningTree || detail.reasoningTree.length === 0) && (
                      <p className="text-xs text-text-tertiary">No reasoning tree generated.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <section className="w-full bg-bg-secondary rounded-lg p-5 border border-border-tertiary flex flex-col gap-4 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-bold text-text-primary">Latent Clinical Reasoning States</h2>
        <p className="text-[11px] text-text-secondary">
          Decoupled clinical states inferred through temporal data analysis, confidence weightings, and evidence trees.
        </p>
      </div>

      {/* 8 Column Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(states).map(([key, detail]) => {
          if (!detail) return null;
          
          let colorBg = "var(--color-state-sd-bg)";
          let colorBorder = "var(--color-state-sd-border)";
          let colorText = "var(--color-state-sd-text)";
          let displayName = "";
          
          switch (key) {
            case "sd":
              displayName = "Silent Deterioration";
              colorBg = "var(--color-state-sd-bg)";
              colorBorder = "var(--color-state-sd-border)";
              colorText = "var(--color-state-sd-text)";
              break;
            case "fr":
              displayName = "False Recovery";
              colorBg = "var(--color-state-fr-bg)";
              colorBorder = "var(--color-state-fr-border)";
              colorText = "var(--color-state-fr-text)";
              break;
            case "cb":
              displayName = "Chronic Burden";
              colorBg = "var(--color-state-cb-bg)";
              colorBorder = "var(--color-state-cb-border)";
              colorText = "var(--color-state-cb-text)";
              break;
            case "hv":
              displayName = "High Variability";
              colorBg = "var(--color-state-hv-bg)";
              colorBorder = "var(--color-state-hv-border)";
              colorText = "var(--color-state-hv-text)";
              break;
            case "rd":
              displayName = "Recovery Deceleration";
              colorBg = "rgba(249, 115, 22, 0.05)";
              colorBorder = "rgba(249, 115, 22, 0.2)";
              colorText = "rgb(234, 88, 12)";
              break;
            case "tc":
              displayName = "Threshold Convergence";
              colorBg = "rgba(168, 85, 247, 0.05)";
              colorBorder = "rgba(168, 85, 247, 0.2)";
              colorText = "rgb(147, 51, 234)";
              break;
            case "tnr":
              displayName = "Treatment Non-Responsiveness";
              colorBg = "rgba(239, 68, 68, 0.05)";
              colorBorder = "rgba(239, 68, 68, 0.2)";
              colorText = "rgb(220, 38, 38)";
              break;
            case "sc":
              displayName = "State Confidence";
              colorBg = "rgba(14, 165, 233, 0.05)";
              colorBorder = "rgba(14, 165, 233, 0.2)";
              colorText = "rgb(2, 132, 199)";
              break;
            default:
              displayName = key.toUpperCase();
          }
          
          return (
            <StateCard
              key={key}
              name={displayName}
              detail={detail}
              colorBg={colorBg}
              colorBorder={colorBorder}
              colorText={colorText}
              stateKey={key}
            />
          );
        })}
      </div>
    </section>
  );
}
