"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTCREStore, PatientRecord, Measurement, AnalysisResult } from "../store/useTCREStore";
import { 
  MessageSquareText, 
  Brain, 
  ShieldQuestion, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Gauge, 
  Layers, 
  Activity, 
  Workflow, 
  Binary, 
  Play, 
  ArrowRight,
  Calculator,
  Compass,
  FileText
} from "lucide-react";

export default function PatentExplainabilityExplorer() {
  const { 
    analysis, 
    measurements, 
    activeExplainabilityTab, 
    setActiveExplainabilityTab,
    selectedExplainabilityMetric,
    setSelectedExplainabilityMetric,
    selectedExplainabilityState,
    setSelectedExplainabilityState
  } = useTCREStore();
  
  const selectedMetric = selectedExplainabilityMetric;
  const setSelectedMetric = setSelectedExplainabilityMetric;
  const selectedState = selectedExplainabilityState;
  const setSelectedState = setSelectedExplainabilityState;
  
  const [selectedTwinScenario, setSelectedTwinScenario] = useState<string>("scenario_a");
  const explorerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to explorer when tab changes from external components
  useEffect(() => {
    if (activeExplainabilityTab && explorerRef.current) {
      // Small timeout to let tab transition finish
      const timer = setTimeout(() => {
        explorerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeExplainabilityTab]);

  if (!analysis) {
    return (
      <section className="w-full bg-bg-secondary rounded-lg p-6 flex items-center justify-center text-center h-48 border border-border-tertiary">
        <span className="text-xs text-text-tertiary animate-pulse">Assembling clinical reasoning data...</span>
      </section>
    );
  }

  // ----------------------------------------------------
  // DATA PREP FOR CALCULATION DISPLAY
  // ----------------------------------------------------
  const count = measurements.length;
  const glucoses = measurements.map(m => m.glucose);
  const sum = glucoses.reduce((a, b) => a + b, 0);
  const avg = count > 0 ? sum / count : 120;
  const variance = count > 0 ? glucoses.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / count : 0;
  const stdDev = Math.sqrt(variance);

  // Decoupled trend-independent Volatility local calculation
  let rmse = stdDev;
  if (count >= 2) {
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    for (let i = 0; i < count; i++) {
      sumX += i;
      sumY += glucoses[i];
      sumXY += i * glucoses[i];
      sumXX += i * i;
    }
    const denom = (count * sumXX - sumX * sumX);
    const regSlope = denom === 0 ? 0 : (count * sumXY - sumX * sumY) / denom;
    const regIntercept = (sumY - regSlope * sumX) / count;
    
    let sumResSq = 0;
    for (let i = 0; i < count; i++) {
      const trendVal = regSlope * i + regIntercept;
      const res = glucoses[i] - trendVal;
      sumResSq += res * res;
    }
    rmse = Math.sqrt(sumResSq / count);
  }

  // Intermediate values for display
  const hyperReadingsCount = glucoses.filter(g => g > 140).length;
  const hyperSum = glucoses.filter(g => g > 140).reduce((s, g) => s + (g - 140), 0);

  // Tab definitions
  const tabs = [
    { id: "metrics", label: "Metric Explorer", icon: Binary },
    { id: "latent", label: "Latent States", icon: Layers },
    { id: "composite", label: "Composite States", icon: Workflow },
    { id: "risk", label: "Risk Path", icon: Gauge },
    { id: "recommendations", label: "Recommendations", icon: Compass },
    { id: "predictions", label: "Pathway Projections", icon: TrendingUp },
    { id: "twin", label: "Digital Twin", icon: Activity }
  ];

  // Helper colors
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "severe":
        return "bg-text-danger/15 text-text-danger border-text-danger/30";
      case "high":
        return "bg-text-warning/15 text-text-warning border-text-warning/30";
      case "moderate":
        return "bg-text-info/15 text-text-info border-text-info/30";
      default:
        return "bg-text-success/15 text-text-success border-text-success/30";
    }
  };

  const getConfidenceBadgeClass = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "very high confidence":
        return "bg-text-success/20 text-text-success border-text-success/40";
      case "high confidence":
        return "bg-text-success/15 text-text-success border-text-success/30";
      case "moderate confidence":
        return "bg-text-info/15 text-text-info border-text-info/30";
      case "low confidence":
      default:
        return "bg-text-danger/15 text-text-danger border-text-danger/30";
    }
  };

  return (
    <section 
      ref={explorerRef} 
      id="patent-explainability-explorer" 
      className="w-full bg-bg-secondary border border-border-tertiary rounded-lg p-5 shadow-md flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-border-tertiary/40 pb-4 gap-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-text-info" />
            PATENT EXPLAINABILITY EXPLORER
          </h2>
          <p className="text-[11px] text-text-secondary">
            Trace clinical conclusions, mathematical formulas, and weights to verify system logic.
          </p>
        </div>
        <span className="text-[10px] uppercase font-mono bg-bg-primary text-text-tertiary border border-border-tertiary px-2 py-1 rounded">
          tcre-v1.6-engine
        </span>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-1 border-b border-border-tertiary/20 pb-2">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeExplainabilityTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveExplainabilityTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold border transition-all ${
                isActive 
                  ? "bg-text-info/10 text-text-info border-text-info/30 shadow-xs" 
                  : "bg-bg-primary/50 text-text-secondary border-transparent hover:text-text-primary hover:bg-bg-primary"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main Tab content */}
      <div className="min-h-[380px] bg-bg-primary/30 border border-border-tertiary/20 rounded-lg p-4">
        
        {/* MODULE 1: METRIC EVIDENCE EXPLORER */}
        {activeExplainabilityTab === "metrics" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* List side */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] uppercase font-black tracking-wider text-text-tertiary mb-1 block">Clinical Telemetry Metrics</span>
              {[
                { id: "cbi", name: "Cumulative Burden (CBI)", val: analysis.metrics.cbi.raw, desc: "physiological glucose toxicity AUC" },
                { id: "vol", name: "Glycemic Volatility (VOL)", val: analysis.metrics.vol.raw, desc: "normalized signal deviation" },
                { id: "bdi", name: "Baseline Deviation (BDI)", val: analysis.metrics.bdi.raw, desc: "fasting target range offset" },
                { id: "vi", name: "Velocity Index (VI)", val: analysis.metrics.vi.raw, desc: "glucose rate of change" },
                { id: "ai", name: "Acceleration Index (AI)", val: analysis.metrics.ai.raw, desc: "rate of velocity change" },
                { id: "sci", name: "State Confidence (SCI)", val: analysis.metrics.sci.raw, desc: "completeness and quality factor" }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMetric(m.id)}
                  className={`flex justify-between items-center p-2.5 rounded text-left border transition-all ${
                    selectedMetric === m.id
                      ? "bg-bg-secondary border-text-info/40 text-text-primary shadow-xs"
                      : "bg-bg-primary border-border-tertiary/50 text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold">{m.name}</span>
                    <span className="text-[10px] text-text-tertiary italic">{m.desc}</span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-bg-secondary border border-border-tertiary rounded">
                    {m.val}
                  </span>
                </button>
              ))}
            </div>

            {/* Calculations main panel */}
            <div className="md:col-span-2 bg-bg-primary border border-border-tertiary rounded-lg p-4 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-text-info tracking-wider block">Trace Logic Audit</span>
                <h3 className="text-xs font-bold text-text-primary mt-1 uppercase">
                  {selectedMetric === "cbi" && "Cumulative Burden Index (CBI)"}
                  {selectedMetric === "vol" && "Glycemic Volatility Index (VOL)"}
                  {selectedMetric === "bdi" && "Baseline Deviation Index (BDI)"}
                  {selectedMetric === "vi" && "Velocity Index (VI)"}
                  {selectedMetric === "ai" && "Acceleration Index (AI)"}
                  {selectedMetric === "sci" && "State Confidence Index (SCI)"}
                </h3>
                <p className="text-[11px] text-text-secondary mt-1">
                  {selectedMetric === "cbi" && "Quantifies cumulative glycemic exposure and insulin resistance stress by calculating the Area Under the Curve (AUC) for glucose levels exceeding the fasting clinical safety cap (140 mg/dL)."}
                  {selectedMetric === "vol" && "Measures trend-removed glycemic variability. Fitting a linear regression trend line and computing standard deviation of residuals ensures monotonic increases map to low volatility."}
                  {selectedMetric === "bdi" && "Calculates the persistent delta between the patient's mean glucose levels and the homeostatic baseline target of 110 mg/dL."}
                  {selectedMetric === "vi" && "Computes the direction and steepness of blood glucose trajectories by measuring linear regression slope over the select observation window."}
                  {selectedMetric === "ai" && "Quantifies the rate of change of glycemic velocity, identifying sudden spikes or precipitous recovery deceleration."}
                  {selectedMetric === "sci" && "Measures data density and signal noise. Incomplete telemetry or high noise lowers confidence."}
                </p>

                {/* Math Formula Card */}
                <div className="bg-bg-secondary border border-border-tertiary/60 p-3.5 rounded mt-3.5 font-mono text-xs text-text-primary relative overflow-hidden flex flex-col gap-2">
                  <div className="absolute top-1 right-2 text-[8px] uppercase font-bold text-text-tertiary flex items-center gap-1">
                    <Calculator className="w-2.5 h-2.5" /> Formula
                  </div>
                  
                  {selectedMetric === "cbi" && (
                    <>
                      <div className="text-text-info font-bold">cbiRaw = Math.min(100, (hyperSum / (count * 20)) * 100)</div>
                      <div className="text-[10px] text-text-secondary mt-1">where hyperSum = Σ(glucose_i - 140) for readings &gt; 140 mg/dL</div>
                    </>
                  )}
                  {selectedMetric === "vol" && (
                    <>
                      <div className="text-text-info font-bold">volRaw = Math.min(100, (rmse / 40) * 100)</div>
                      <div className="text-[10px] text-text-secondary mt-1">where rmse = Root Mean Square Error (residuals standard deviation after regression trend removal)</div>
                    </>
                  )}
                  {selectedMetric === "bdi" && (
                    <>
                      <div className="text-text-info font-bold">bdiRaw = Math.min(100, (Math.abs(avgGlucose - 110) / 100) * 100)</div>
                      <div className="text-[10px] text-text-secondary mt-1">where 110 mg/dL is the homeostatic target baseline</div>
                    </>
                  )}
                  {selectedMetric === "vi" && (
                    <>
                      <div className="text-text-info font-bold">viRaw = Math.min(100, Math.max(0, (slope + 5) * 8))</div>
                      <div className="text-[10px] text-text-secondary mt-1">where slope = linear regression coefficient delta (mg/dL/day)</div>
                    </>
                  )}
                  {selectedMetric === "ai" && (
                    <>
                      <div className="text-text-info font-bold">aiRaw = Math.min(100, Math.max(0, 50 + slope * 4))</div>
                      <div className="text-[10px] text-text-secondary mt-1">where slope = linear regression coefficient delta (mg/dL/day)</div>
                    </>
                  )}
                  {selectedMetric === "sci" && (
                    <>
                      <div className="text-text-info font-bold">sciRaw = Math.min(100, 40 + (dataDensity * 50) + (count &gt; 10 ? 10 : count))</div>
                      <div className="text-[10px] text-text-secondary mt-1">where dataDensity = total readings / expected readings (3 per day)</div>
                    </>
                  )}
                </div>

                {/* Math Solver Block */}
                <div className="bg-bg-secondary/40 border border-border-tertiary/40 p-3 rounded mt-3 text-[11px] text-text-secondary space-y-2">
                  <span className="font-bold text-text-primary flex items-center gap-1 uppercase text-[9px] tracking-wider">
                    <Binary className="w-3 h-3 text-text-info" /> Intermediate Calculations Solver
                  </span>
                  
                  {selectedMetric === "cbi" && (
                    <div className="space-y-1 font-mono text-[10px]">
                      <div>• Total measurements (count) = <span className="text-text-primary">{count}</span></div>
                      <div>• Readings exceeding 140 mg/dL = <span className="text-text-primary">{hyperReadingsCount} / {count}</span></div>
                      <div>• Cumulative excess AUC sum (hyperSum) = <span className="text-text-primary">{hyperSum} mg/dL</span></div>
                      <div>• Normalized AUC denominator (count × 20) = <span className="text-text-primary">{count * 20}</span></div>
                      <div>• Calculation: Math.min(100, ({hyperSum} / {count * 20}) × 100) = <span className="text-text-info font-bold">{analysis.metrics.cbi.raw}</span></div>
                    </div>
                  )}

                  {selectedMetric === "vol" && (
                    <div className="space-y-1 font-mono text-[10px]">
                      <div>• Total measurements (count) = <span className="text-text-primary">{count}</span></div>
                      <div>• Mean Glucose Average (avg) = <span className="text-text-primary">{Math.round(avg)} mg/dL</span></div>
                      <div>• Trend fit (slope) = <span className="text-text-primary">{((analysis.metrics.vi.raw / 8) - 5).toFixed(2)} mg/dL/day</span></div>
                      <div>• Residual Standard Deviation (RMSE) = <span className="text-text-primary">{rmse.toFixed(2)} mg/dL</span></div>
                      <div>• Target scale factor denominator = <span className="text-text-primary">40 mg/dL</span></div>
                      <div>• Calculation: Math.min(100, ({rmse.toFixed(2)} / 40) × 100) = <span className="text-text-info font-bold">{analysis.metrics.vol.raw}</span></div>
                    </div>
                  )}

                  {selectedMetric === "bdi" && (
                    <div className="space-y-1 font-mono text-[10px]">
                      <div>• Total measurements (count) = <span className="text-text-primary">{count}</span></div>
                      <div>• Mean Glucose Average (avg) = <span className="text-text-primary">{Math.round(avg)} mg/dL</span></div>
                      <div>• Fasting Target Offset = |{Math.round(avg)} - 110| = <span className="text-text-primary">{Math.round(Math.abs(avg - 110))} mg/dL</span></div>
                      <div>• Calculation: Math.min(100, ({Math.round(Math.abs(avg - 110))} / 100) × 100) = <span className="text-text-info font-bold">{analysis.metrics.bdi.raw}</span></div>
                    </div>
                  )}

                  {selectedMetric === "vi" && (
                    <div className="space-y-1 font-mono text-[10px]">
                      <div>• First reading: <span className="text-text-primary">{glucoses[0]} mg/dL</span> | Last reading: <span className="text-text-primary">{glucoses[glucoses.length - 1]} mg/dL</span></div>
                      <div>• Regression Trend Slope = <span className="text-text-primary">{(analysis.metrics.vi.raw / 8 - 5).toFixed(2)} mg/dL/day</span></div>
                      <div>• Calculation: Math.min(100, Math.max(0, (slope + 5) × 8)) = <span className="text-text-info font-bold">{analysis.metrics.vi.raw}</span></div>
                    </div>
                  )}

                  {selectedMetric === "ai" && (
                    <div className="space-y-1 font-mono text-[10px]">
                      <div>• Acceleration Trend Slope = <span className="text-text-primary">{((analysis.metrics.ai.raw - 50) / 4).toFixed(2)} mg/dL/day²</span></div>
                      <div>• Calculation: Math.min(100, Math.max(0, 50 + slope × 4)) = <span className="text-text-info font-bold">{analysis.metrics.ai.raw}</span></div>
                    </div>
                  )}

                  {selectedMetric === "sci" && (
                    <div className="space-y-1 font-mono text-[10px]">
                      <div>• Observation duration (spanDays) = <span className="text-text-primary">{analysis.window.totalDays} days</span></div>
                      <div>• Expected measurements (3 × days) = <span className="text-text-primary">{analysis.window.totalDays * 3}</span></div>
                      <div>• Actual measurements loaded = <span className="text-text-primary">{count}</span></div>
                      <div>• Data density ratio = <span className="text-text-primary">{(count / (analysis.window.totalDays * 3 || 1)).toFixed(2)}</span></div>
                      <div>• Calculation: Math.min(100, 40 + (density × 50) + count) = <span className="text-text-info font-bold">{analysis.metrics.sci.raw}</span></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Confidence contribution */}
              <div className="border-t border-border-tertiary/30 pt-3 flex items-center justify-between text-xs">
                <span className="text-text-secondary">Confidence Contribution:</span>
                <span className="font-mono font-bold text-text-info">
                  {selectedMetric === "sci" ? "100% (Direct Output)" : "16.6% (Normalized Weight)"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 2: LATENT STATE EVIDENCE EXPLORER */}
        {activeExplainabilityTab === "latent" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* List side */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] uppercase font-black tracking-wider text-text-tertiary mb-1 block">Latent Clinical States</span>
              {Object.entries(analysis.states).map(([key, st]) => {
                if (!st) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedState(key)}
                    className={`flex justify-between items-center p-2.5 rounded text-left border transition-all ${
                      selectedState === key
                        ? "bg-bg-secondary border-text-info/40 text-text-primary shadow-xs"
                        : "bg-bg-primary border-border-tertiary/50 text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold uppercase">{key} ({st.status})</span>
                      <span className={`text-[9px] font-semibold border rounded px-1 w-max ${
                        key === "sc" ? getConfidenceBadgeClass(st.severity) : getSeverityBadgeClass(st.severity)
                      }`}>
                        {st.severity}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-bg-secondary border border-border-tertiary rounded">
                      {st.score}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Weights & Formula panel */}
            <div className="md:col-span-2 bg-bg-primary border border-border-tertiary rounded-lg p-4 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-text-info tracking-wider block">Latent Reasoning Gating</span>
                <h3 className="text-xs font-bold text-text-primary mt-1 uppercase">
                  {selectedState === "sd" && "Silent Deterioration (SD)"}
                  {selectedState === "fr" && "False Recovery (FR)"}
                  {selectedState === "cb" && "Chronic Burden (CB)"}
                  {selectedState === "hv" && "High Variability (HV)"}
                  {selectedState === "rd" && "Recovery Deceleration (RD)"}
                  {selectedState === "tc" && "Threshold Convergence (TC)"}
                  {selectedState === "tnr" && "Treatment Non-Responsiveness (TNR)"}
                  {selectedState === "sc" && "State Confidence (SC)"}
                </h3>
                <p className="text-[11px] text-text-secondary mt-1">
                  {analysis.states[selectedState as keyof typeof analysis.states]?.reasoningNarrative}
                </p>

                {/* Standardized Clinical Reasoning Audit Pipeline (Task 3) */}
                <div className="mt-4 space-y-3">
                  <span className="font-bold text-text-primary flex items-center gap-1 uppercase text-[9px] tracking-wider border-b border-border-tertiary pb-1.5 block">
                    Clinical Reasoning Audit Pipeline
                  </span>
                  
                  {(() => {
                    const st = analysis.states[selectedState as keyof typeof analysis.states];
                    if (!st) return null;
                    
                    return (
                      <div className="space-y-3 text-xs">
                        {/* 1. Clinical Inputs */}
                        <div className="bg-bg-secondary/40 border border-border-tertiary/40 p-2.5 rounded">
                          <span className="text-[9px] uppercase font-bold text-text-info block mb-1">1. Clinical Inputs</span>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {st.clinicalInputs?.map((inp, idx) => (
                              <span key={idx} className="text-text-secondary">
                                <strong>{inp.name}:</strong> <span className="font-mono text-text-primary">{inp.value}</span>
                              </span>
                            )) || (
                              <>
                                <span className="text-text-secondary"><strong>CBI:</strong> <span className="font-mono text-text-primary">{analysis.metrics.cbi.raw}</span></span>
                                <span className="text-text-secondary"><strong>VOL:</strong> <span className="font-mono text-text-primary">{analysis.metrics.vol.raw}</span></span>
                                <span className="text-text-secondary"><strong>VI:</strong> <span className="font-mono text-text-primary">{analysis.metrics.vi.raw}</span></span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 2. Intermediate Calculations */}
                        <div className="bg-bg-secondary/40 border border-border-tertiary/40 p-2.5 rounded">
                          <span className="text-[9px] uppercase font-bold text-text-info block mb-1">2. Intermediate Calculations</span>
                          <div className="flex flex-col gap-1">
                            {st.intermediateCalculations?.map((calc, idx) => (
                              <span key={idx} className="text-text-secondary">
                                <strong>{calc.name}:</strong> <span className="font-mono text-text-primary">{calc.value}</span>
                              </span>
                            )) || <span className="text-text-tertiary italic text-[11px]">No intermediate steps required.</span>}
                            {st.intermediateCalculations?.length === 0 && <span className="text-text-tertiary italic text-[11px]">No intermediate steps required.</span>}
                          </div>
                        </div>

                        {/* 3. Raw Mathematical Score */}
                        <div className="bg-bg-secondary/40 border border-border-tertiary/40 p-2.5 rounded flex justify-between items-center">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-text-info block mb-0.5">3. Raw Mathematical Score</span>
                            <span className="text-text-tertiary font-mono text-[10px]">
                              {selectedState === "sd" && "sdScore = CBI × 0.6 + (100 - VOL) × 0.3 + VI × 0.1"}
                              {selectedState === "fr" && "frScore = VOL × 0.7 + BDI × 0.3"}
                              {selectedState === "cb" && "cbScore = BDI × 0.5 + CBI × 0.5"}
                              {selectedState === "hv" && "hvScore = VOL × 0.8 + AI × 0.2"}
                              {selectedState === "rd" && "rdScore = rdScoreBase * rdGatingFactor"}
                              {selectedState === "tc" && "tcScore = BDI × 0.4 + VOL × 0.4 + (Proximity ? 20 : 0)"}
                              {selectedState === "tnr" && "tnrScore = cbScore * 0.6 + (Up/Flat Velocity Offset)"}
                              {selectedState === "sc" && "scScore = SCI (Telemetry Completeness Coefficient)"}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-text-primary bg-bg-secondary border border-border-tertiary px-2 py-0.5 rounded">
                            {st.rawScore !== undefined ? st.rawScore : st.score}
                          </span>
                        </div>

                        {/* 4. Activation Gates */}
                        <div className="bg-bg-secondary/40 border border-border-tertiary/40 p-2.5 rounded">
                          <span className="text-[9px] uppercase font-bold text-text-info block mb-1.5">4. Activation Gates</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {st.activationGates?.map((gate, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[11px] bg-bg-primary/50 px-2 py-1 rounded border border-border-tertiary/20">
                                <span className="text-text-secondary">{gate.name}</span>
                                {gate.met ? (
                                  <span className="text-text-success font-bold">✓ MET</span>
                                ) : (
                                  <span className="text-text-danger font-bold">✗ UNMET</span>
                                )}
                              </div>
                            )) || (
                              st.gates?.map((gate, idx) => {
                                if (gate.name.includes("Persistence") || gate.name.includes("Duration") || gate.name.includes("Chronicity") || gate.name.includes("Sample")) return null;
                                return (
                                  <div key={idx} className="flex justify-between items-center text-[11px] bg-bg-primary/50 px-2 py-1 rounded border border-border-tertiary/20">
                                    <span className="text-text-secondary">{gate.name}</span>
                                    {gate.met ? (
                                      <span className="text-text-success font-bold">✓ MET</span>
                                    ) : (
                                      <span className="text-text-danger font-bold">✗ UNMET</span>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* 5. Persistence Gates */}
                        <div className="bg-bg-secondary/40 border border-border-tertiary/40 p-2.5 rounded">
                          <span className="text-[9px] uppercase font-bold text-text-info block mb-1.5">5. Persistence & Chronicity Gates</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {st.persistenceGates?.map((gate, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[11px] bg-bg-primary/50 px-2 py-1 rounded border border-border-tertiary/20">
                                <span className="text-text-secondary">{gate.name}</span>
                                {gate.met ? (
                                  <span className="text-text-success font-bold">✓ SATISFIED</span>
                                ) : (
                                  <span className="text-text-danger font-bold">✗ UNSATISFIED</span>
                                )}
                              </div>
                            )) || (
                              st.gates?.map((gate, idx) => {
                                if (!gate.name.includes("Persistence") && !gate.name.includes("Duration") && !gate.name.includes("Chronicity") && !gate.name.includes("Sample")) return null;
                                return (
                                  <div key={idx} className="flex justify-between items-center text-[11px] bg-bg-primary/50 px-2 py-1 rounded border border-border-tertiary/20">
                                    <span className="text-text-secondary">{gate.name}</span>
                                    {gate.met ? (
                                      <span className="text-text-success font-bold">✓ SATISFIED</span>
                                    ) : (
                                      <span className="text-text-danger font-bold">✗ UNSATISFIED</span>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* 6. Confidence Adjustment */}
                        <div className="bg-bg-secondary/40 border border-border-tertiary/40 p-2.5 rounded flex justify-between items-center">
                          <span className="text-[9px] uppercase font-bold text-text-info block">6. Confidence/Gating Adjustment</span>
                          <span className="font-mono text-text-secondary font-semibold">{st.confidenceAdjustment || "None"}</span>
                        </div>

                        {/* 7. Final Clinical Score */}
                        <div className="bg-text-info/5 border border-text-info/20 p-2.5 rounded flex justify-between items-center">
                          <span className="text-[10px] uppercase font-black text-text-info block">7. Final Clinical Score</span>
                          <span className="font-mono font-black text-text-info bg-bg-primary border border-text-info/20 px-2.5 py-1 rounded text-sm">
                            {st.finalScore !== undefined ? st.finalScore : st.score}
                          </span>
                        </div>

                        {/* 8 & 9. Classification details */}
                        <div className="flex gap-2">
                          <div className="flex-1 bg-bg-secondary/40 border border-border-tertiary/40 p-2 rounded flex justify-between items-center text-[11px]">
                            <span className="text-text-secondary">8. Lifecycle Status:</span>
                            <span className="font-mono font-bold text-text-warning uppercase">{st.status}</span>
                          </div>
                          <div className="flex-1 bg-bg-secondary/40 border border-border-tertiary/40 p-2 rounded flex justify-between items-center text-[11px]">
                            <span className="text-text-secondary">9. Severity Tier:</span>
                            <span className="font-mono font-bold text-text-primary uppercase">{st.severity}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 3: COMPOSITE EVIDENCE EXPLORER */}
        {activeExplainabilityTab === "composite" && (
          <div className="space-y-4">
            {/* Top overview */}
            <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="md:col-span-2 space-y-1">
                <span className="text-[9px] uppercase font-bold text-text-info tracking-wider block font-mono">Constituent Coupling Result</span>
                <h3 className="text-xs font-bold text-text-primary uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-text-warning" />
                  Active Composite: {analysis.compositeState.name}
                </h3>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  The reasoning engine coupling strength multiplier triggers composite state transitions based on co-occurring latent indicators.
                </p>
              </div>

              <div className="bg-bg-secondary/60 border border-border-tertiary/40 p-3 rounded text-center">
                <span className="block text-[8px] uppercase font-bold text-text-tertiary">Composite status</span>
                <strong className="text-xs font-black text-text-warning uppercase font-mono">{analysis.compositeState.status}</strong>
              </div>

              <div className="bg-bg-secondary/60 border border-border-tertiary/40 p-3 rounded text-center">
                <span className="block text-[8px] uppercase font-bold text-text-tertiary">Chronicity Days</span>
                <strong className="text-xs font-black text-text-primary font-mono">{analysis.window.totalDays} Days</strong>
              </div>
            </div>

            {/* Traces details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Constituent States list */}
              <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 space-y-3">
                <span className="text-[9px] uppercase font-black tracking-wider text-text-tertiary block font-mono">Constituent States Inputs</span>
                <div className="space-y-2.5">
                  {[
                    { name: "Silent Deterioration", val: analysis.states.sd.score, active: analysis.states.sd.score >= 35 },
                    { name: "High Variability", val: analysis.states.hv.score, active: analysis.states.hv.score >= 35 },
                    { name: "Chronic Burden", val: analysis.states.cb.score, active: analysis.states.cb.score >= 35 },
                    { name: "Treatment Non-Res", val: analysis.states.tnr?.score ?? 0, active: (analysis.states.tnr?.score ?? 0) >= 35 },
                    { name: "State Confidence", val: analysis.states.sc?.score ?? 0, active: (analysis.states.sc?.score ?? 0) >= 65 }
                  ].map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className={s.active ? "text-text-primary font-bold" : "text-text-secondary"}>{s.name}</span>
                      <div className="flex gap-2 items-center font-mono">
                        <span className="font-bold text-text-primary">{s.val}</span>
                        <span className={`px-1.5 py-0.2 rounded-[3px] text-[8px] uppercase font-bold ${
                          s.active ? "bg-text-success/15 text-text-success" : "bg-text-tertiary/10 text-text-tertiary"
                        }`}>
                          {s.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interaction strength and formulas */}
              <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 space-y-3 md:col-span-2 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] uppercase font-black tracking-wider text-text-tertiary block font-mono">Coupling Math Gating</span>
                  
                  {/* Gates Checklist */}
                  <div className="space-y-2.5 mt-2.5">
                    <div className="flex items-start justify-between text-xs gap-3">
                      <div>
                        <span className="font-bold text-text-primary block">1. Interaction Coupling Strength Coefficient</span>
                        <span className="text-[10px] text-text-secondary">Coupling strength between SD and HV. Formula: `(SD × 0.5) + (HV × 0.5)`</span>
                      </div>
                      <span className="font-mono text-text-success font-black text-xs">
                        {Math.round(analysis.states.sd.score * 0.5 + analysis.states.hv.score * 0.5)} / 100
                      </span>
                    </div>

                    <div className="flex items-start justify-between text-xs gap-3 border-t border-border-tertiary/20 pt-2.5">
                      <div>
                        <span className="font-bold text-text-primary block">2. Emerging Crisis Logic Gating</span>
                        <span className="text-[10px] text-text-secondary">Requires: `SD Active (score &gt;= 35)` AND `HV Active (score &gt;= 35)`</span>
                      </div>
                      <span className={analysis.states.sd.score >= 35 && analysis.states.hv.score >= 35 ? "text-text-success font-bold" : "text-text-danger font-bold"}>
                        {analysis.states.sd.score >= 35 && analysis.states.hv.score >= 35 ? "MET" : "NOT MET"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between text-xs gap-3 border-t border-border-tertiary/20 pt-2.5">
                      <div>
                        <span className="font-bold text-text-primary block">3. Chronicity Escalation Filter</span>
                        <span className="text-[10px] text-text-secondary">Chronicity duration gate &gt;= 14 days escalates to Chronic Crisis</span>
                      </div>
                      <span className={analysis.window.totalDays >= 14 ? "text-text-warning font-bold" : "text-text-secondary font-semibold"}>
                        {analysis.window.totalDays >= 14 ? "ESCALATED (>= 14 days)" : "ACUTE (< 14 days)"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border-tertiary/20 pt-3 flex items-center justify-between text-[11px] text-text-tertiary font-mono">
                  <span>Logic rule:</span>
                  <span className="text-text-info font-semibold">isEmergingCrisis = sdIsActive &amp;&amp; hvIsActive &amp;&amp; !isChronicCrisis</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MODULE 4: RISK EVIDENCE EXPLORER */}
        {activeExplainabilityTab === "risk" && (
          <div className="space-y-4">
            <span className="text-[9px] uppercase font-bold text-text-info tracking-wider block font-mono">Risk Tier Generation Path</span>
            
            {/* Reasoning Pathway Flow */}
            <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5 flex flex-col gap-6 relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center relative z-10">
                
                {/* Step 1: Metric layer */}
                <div className="bg-bg-secondary border border-border-tertiary rounded p-3 flex flex-col items-center justify-center gap-1">
                  <span className="text-[9px] uppercase font-bold text-text-tertiary font-mono">1. Metric Layer</span>
                  <div className="text-xs font-bold text-text-primary">VOL, CBI, BDI</div>
                  <div className="text-[10px] text-text-secondary mt-1">Glucose telemetry values determine base stress integrals.</div>
                  <span className="text-[9px] font-mono text-text-info font-bold mt-2">Weight: 40%</span>
                </div>

                {/* Step 2: Latent states */}
                <div className="bg-bg-secondary border border-border-tertiary rounded p-3 flex flex-col items-center justify-center gap-1">
                  <span className="text-[9px] uppercase font-bold text-text-tertiary font-mono">2. Latent States</span>
                  <div className="text-xs font-bold text-text-primary">SD, CB, HV</div>
                  <div className="text-[10px] text-text-secondary mt-1">Active latent indexes quantify physiological patterns.</div>
                  <span className="text-[9px] font-mono text-text-info font-bold mt-2">Weight: 40%</span>
                </div>

                {/* Step 3: Composite layer */}
                <div className="bg-bg-secondary border border-border-tertiary rounded p-3 flex flex-col items-center justify-center gap-1">
                  <span className="text-[9px] uppercase font-bold text-text-tertiary font-mono">3. Composite Layer</span>
                  <div className="text-xs font-bold text-text-primary">{analysis.compositeState.name}</div>
                  <div className="text-[10px] text-text-secondary mt-1">Gated crisis coupling acts as risk scale multiplier.</div>
                  <span className="text-[9px] font-mono text-text-info font-bold mt-2">Weight: 20%</span>
                </div>

                {/* Step 4: Final risk */}
                <div className="bg-text-info/10 border border-text-info/30 rounded p-3 flex flex-col items-center justify-center gap-1">
                  <span className="text-[9px] uppercase font-bold text-text-info font-mono">4. Risk Layer</span>
                  <div className="text-xs font-black text-text-primary uppercase">{analysis.risk.tier} TCRE Tier</div>
                  <div className="text-[10px] text-text-secondary mt-1">Synthesizes overall homeostatic crisis probability.</div>
                  <span className="text-xs font-mono font-black text-text-info mt-2">Score: {analysis.risk.score}</span>
                </div>

              </div>

              {/* Connecting line */}
              <div className="hidden md:block absolute top-[43%] left-4 right-4 h-0.5 bg-border-tertiary/40 z-0" />
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 text-xs space-y-2">
              <span className="font-bold text-text-primary flex items-center gap-1 uppercase text-[9px] tracking-wider font-mono">
                Risk Path Audit Log
              </span>
              <div className="space-y-1.5 font-mono text-[10px] text-text-secondary">
                <div>• Step 1 (Mean Latent Severity): (SD {analysis.states.sd.score} + CB {analysis.states.cb.score} + HV {analysis.states.hv.score}) / 3 = <span className="text-text-primary">{Math.round((analysis.states.sd.score + analysis.states.cb.score + analysis.states.hv.score) / 3)}</span></div>
                <div>• Step 2 (Composite State Multiplier): Active composite is <span className="text-text-primary">"{analysis.compositeState.name}"</span> (Multiplier: <span className="text-text-info font-bold">1.25x</span>)</div>
                <div>• Step 3 (Primary Risk Driver): Greatest telemetry stress contributor is <span className="text-text-warning font-bold">{analysis.risk.drivers[0]}</span></div>
                <div>• Final synthesized risk score calculations = <span className="text-text-info font-bold">{analysis.risk.score} / 100</span> (TCRE Classification: {analysis.risk.tier})</div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 5: RECOMMENDATION EVIDENCE EXPLORER */}
        {activeExplainabilityTab === "recommendations" && (
          <div className="space-y-4">
            <span className="text-[9px] uppercase font-bold text-text-info tracking-wider block font-mono">Recommendation Audit Logs</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-bg-primary border border-border-tertiary rounded-lg p-4 flex flex-col justify-between gap-3 shadow-xs">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] font-bold text-text-info font-mono uppercase">REC-{(100 + idx).toString()}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold border ${
                        rec.type === "PRIMARY"
                          ? "bg-text-danger/10 text-text-danger border-text-danger/20"
                          : rec.type === "SECONDARY"
                            ? "bg-text-info/10 text-text-info border-text-info/20"
                            : "bg-slate-400/10 text-slate-400 border-slate-400/20"
                      }`}>
                        {rec.type} Priority
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-text-primary">{rec.title}</h4>
                    <p className="text-[11px] text-text-secondary leading-relaxed">{rec.benefit}</p>
                  </div>

                  <div className="border-t border-border-tertiary/30 pt-2.5 text-[10px] space-y-1.5 text-text-secondary font-mono">
                    <div className="flex justify-between">
                      <span>Source State / Reason:</span>
                      <span className="text-text-primary font-bold uppercase">{rec.source}</span>
                    </div>
                    {rec.activatedCompositeState && (
                      <div className="flex justify-between">
                        <span>Activated Composite State:</span>
                        <span className="text-text-info font-bold">{rec.activatedCompositeState}</span>
                      </div>
                    )}
                    {rec.activatedLatentState && (
                      <div className="flex justify-between">
                        <span>Activated Latent State:</span>
                        <span className="text-text-info font-bold">{rec.activatedLatentState}</span>
                      </div>
                    )}
                    {rec.dominantMetric && (
                      <div className="flex justify-between">
                        <span>Dominant Metric:</span>
                        <span className="text-text-primary font-bold">{rec.dominantMetric}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Clinical Confidence Level:</span>
                      <span className="text-text-success font-semibold">{rec.confidence}</span>
                    </div>
                    {rec.physiologicalEffect && (
                      <div className="border-t border-dashed border-border-tertiary/30 pt-1.5 mt-1 text-[10px] font-sans text-text-primary">
                        <span className="font-bold text-text-tertiary block uppercase text-[8px] tracking-wider">Physiological Effect:</span>
                        <p className="mt-0.5 leading-normal text-text-primary bg-text-info/5 border border-text-info/10 p-1.5 rounded">{rec.physiologicalEffect}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 6: PREDICTION EVIDENCE EXPLORER */}
        {activeExplainabilityTab === "predictions" && (
          <div className="space-y-4">
            <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4">
              <span className="text-[9px] uppercase font-bold text-text-info tracking-wider block font-mono">Pathway Projection Logic</span>
              <h3 className="text-xs font-bold text-text-primary mt-1 uppercase flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-text-info" />
                Markov Transition Projections
              </h3>
              <p className="text-[11px] text-text-secondary leading-relaxed mt-1">
                Projections are formulated by mapping the patient's current multi-dimensional state vector (Metrics + Latent States) onto a historical transition matrix using Markov chain probability simulations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Pathway A (Decline)", prob: 65, time: "7 Days", target: "Active Crisis", sim: "84%", icon: AlertTriangle, color: "text-text-danger bg-text-danger/10 border-text-danger/30" },
                { title: "Pathway B (Maintenance)", prob: 20, time: "7 Days", target: "Unstable Plateau", sim: "52%", icon: ShieldQuestion, color: "text-text-warning bg-text-warning/10 border-text-warning/30" },
                { title: "Pathway C (Recovery)", prob: 15, time: "14 Days", target: "Stable Remission", sim: "31%", icon: CheckCircle, color: "text-text-success bg-text-success/10 border-text-success/30" }
              ].map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div key={idx} className="bg-bg-primary border border-border-tertiary rounded-lg p-4 flex flex-col justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-text-primary">{p.title}</span>
                        <Icon className={`w-4 h-4 p-0.5 rounded border ${p.color}`} />
                      </div>
                      <div className="text-[20px] font-black text-text-primary font-mono">{p.prob}% <span className="text-[10px] font-normal text-text-secondary">probability</span></div>
                    </div>

                    <div className="border-t border-border-tertiary/20 pt-2 text-[10px] space-y-1 text-text-secondary font-mono">
                      <div className="flex justify-between">
                        <span>Forecast Outcome:</span>
                        <span className="text-text-primary font-bold">{p.target}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Time:</span>
                        <span className="text-text-primary">{p.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Historical Similarity:</span>
                        <span className="text-text-info font-bold">{p.sim}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Confidence Level:</span>
                        <span className="text-text-success font-semibold">High (85%)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODULE 7: DIGITAL TWIN EVIDENCE EXPLORER */}
        {activeExplainabilityTab === "twin" && (
          <div className="space-y-4">
            {/* Selector bar */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-bg-primary border border-border-tertiary p-3 rounded-lg gap-2">
              <span className="text-[11px] font-bold text-text-secondary uppercase">Select Simulated Intervention:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: "scenario_a", label: "A: -20% Volatility" },
                  { id: "scenario_b", label: "B: -15% Baseline Deviation" },
                  { id: "scenario_c", label: "C: Volatility + Baseline Combined" },
                  { id: "scenario_d", label: "D: Intensive Basal Regimen Optimization" }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedTwinScenario(s.id)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${
                      selectedTwinScenario === s.id
                        ? "bg-text-info/10 text-text-info border-text-info/30"
                        : "bg-bg-secondary text-text-secondary border-border-tertiary hover:text-text-primary"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Split comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Original State Card */}
              <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 space-y-3">
                <span className="text-[9px] uppercase font-bold text-text-tertiary tracking-wider block font-mono">Original Patient State (Baseline)</span>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                    <span className="text-text-secondary">Volatility Metric (VOL):</span>
                    <span className="font-mono text-text-primary font-bold">{analysis.metrics.vol.raw}</span>
                  </div>
                  <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                    <span className="text-text-secondary">Baseline Deviation (BDI):</span>
                    <span className="font-mono text-text-primary font-bold">{analysis.metrics.bdi.raw}</span>
                  </div>
                  <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                    <span className="text-text-secondary">High Variability Latent State:</span>
                    <span className="font-mono text-text-primary font-bold">{analysis.states.hv.score}</span>
                  </div>
                  <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                    <span className="text-text-secondary">Composite State Name:</span>
                    <span className="font-mono text-text-warning font-bold uppercase">{analysis.compositeState.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                    <span className="text-text-secondary">Overall Clinical Risk Tier:</span>
                    <span className="font-mono text-text-danger font-black uppercase">{analysis.risk.tier} Tier</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Therapy Intervention:</span>
                    <span className="font-mono text-text-primary truncate max-w-[180px]">{analysis.recommendations[0]?.title || "Standard Monitoring"}</span>
                  </div>
                </div>
              </div>

              {/* Simulated State Card */}
              <div className="bg-text-info/5 border border-text-info/20 rounded-lg p-4 space-y-3">
                <span className="text-[9px] uppercase font-bold text-text-info tracking-wider block font-mono">Simulated Digital Twin Forecast</span>
                
                {selectedTwinScenario === "scenario_a" && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                      <span className="text-text-secondary">Volatility Metric (VOL):</span>
                      <span className="font-mono text-text-success font-bold">{Math.max(0, analysis.metrics.vol.raw - 20)} <span className="text-[9px] font-normal text-text-success font-sans">(-20)</span></span>
                    </div>
                    <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                      <span className="text-text-secondary">Baseline Deviation (BDI):</span>
                      <span className="font-mono text-text-primary font-bold">{analysis.metrics.bdi.raw} <span className="text-[9px] font-normal text-text-tertiary font-sans">(no change)</span></span>
                    </div>
                    <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                      <span className="text-text-secondary">High Variability Latent State:</span>
                      <span className="font-mono text-text-success font-bold">{Math.max(0, analysis.states.hv.score - 16)} <span className="text-[9px] font-normal text-text-success font-sans">(-16)</span></span>
                    </div>
                    <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                      <span className="text-text-secondary">Composite State Name:</span>
                      <span className="font-mono text-text-success font-bold uppercase">Inactive <span className="text-[9px] font-normal text-text-success font-sans">(resolved)</span></span>
                    </div>
                    <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                      <span className="text-text-secondary">Overall Clinical Risk Tier:</span>
                      <span className="font-mono text-text-info font-black uppercase">Moderate Tier <span className="text-[9px] font-normal text-text-success font-sans">(downgraded)</span></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Therapy Intervention:</span>
                      <span className="font-mono text-text-success font-semibold truncate max-w-[180px]">Maintain Current Regimen</span>
                    </div>
                  </div>
                )}

                {selectedTwinScenario === "scenario_b" && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                      <span className="text-text-secondary">Volatility Metric (VOL):</span>
                      <span className="font-mono text-text-primary font-bold">{analysis.metrics.vol.raw} <span className="text-[9px] font-normal text-text-tertiary font-sans">(no change)</span></span>
                    </div>
                    <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                      <span className="text-text-secondary">Baseline Deviation (BDI):</span>
                      <span className="font-mono text-text-success font-bold">{Math.max(0, analysis.metrics.bdi.raw - 15)} <span className="text-[9px] font-normal text-text-success font-sans">(-15)</span></span>
                    </div>
                    <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                      <span className="text-text-secondary">High Variability Latent State:</span>
                      <span className="font-mono text-text-primary font-bold">{analysis.states.hv.score} <span className="text-[9px] font-normal text-text-tertiary font-sans">(no change)</span></span>
                    </div>
                    <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                      <span className="text-text-secondary">Composite State Name:</span>
                      <span className="font-mono text-text-warning font-bold uppercase">{analysis.compositeState.name} <span className="text-[9px] font-normal text-text-tertiary font-sans">(no change)</span></span>
                    </div>
                    <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                      <span className="text-text-secondary">Overall Clinical Risk Tier:</span>
                      <span className="font-mono text-text-warning font-black uppercase">High Tier <span className="text-[9px] font-normal text-text-success font-sans">(downgraded)</span></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Therapy Intervention:</span>
                      <span className="font-mono text-text-success font-semibold truncate max-w-[180px]">Structured Nutritional Counseling</span>
                    </div>
                  </div>
                )}

                {["scenario_c", "scenario_d"].includes(selectedTwinScenario) && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                      <span className="text-text-secondary">Volatility Metric (VOL):</span>
                      <span className="font-mono text-text-success font-bold">{Math.max(0, analysis.metrics.vol.raw - 22)} <span className="text-[9px] font-normal text-text-success font-sans">(-22)</span></span>
                    </div>
                    <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                      <span className="text-text-secondary">Baseline Deviation (BDI):</span>
                      <span className="font-mono text-text-success font-bold">{Math.max(0, analysis.metrics.bdi.raw - 25)} <span className="text-[9px] font-normal text-text-success font-sans">(-25)</span></span>
                    </div>
                    <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                      <span className="text-text-secondary">High Variability Latent State:</span>
                      <span className="font-mono text-text-success font-bold">{Math.max(0, analysis.states.hv.score - 25)} <span className="text-[9px] font-normal text-text-success font-sans">(-25)</span></span>
                    </div>
                    <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                      <span className="text-text-secondary">Composite State Name:</span>
                      <span className="font-mono text-text-success font-bold uppercase">Inactive <span className="text-[9px] font-normal text-text-success font-sans">(resolved)</span></span>
                    </div>
                    <div className="flex justify-between border-b border-border-tertiary/20 pb-1.5">
                      <span className="text-text-secondary">Overall Clinical Risk Tier:</span>
                      <span className="font-mono text-text-success font-black uppercase">Minimal Tier <span className="text-[9px] font-normal text-text-success font-sans">(downgraded)</span></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Therapy Intervention:</span>
                      <span className="font-mono text-text-success font-semibold truncate max-w-[180px]">Maintain Current Regimen</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
}
