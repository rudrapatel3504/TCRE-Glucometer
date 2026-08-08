"use client";

import React, { useState } from "react";
import { AnalysisResult } from "../store/useTCREStore";
import { generatePredictions, TwinScenario } from "../lib/predictionEngine";
import { Cpu, Activity, ShieldCheck, Scale, Award, ArrowRight, ShieldAlert, CheckCircle2, TrendingDown } from "lucide-react";

import { useTCREStore } from "../store/useTCREStore";

interface DigitalTwinSimulatorProps {
  analysis: AnalysisResult | null;
  isLoading: boolean;
}

export default function DigitalTwinSimulator({ analysis, isLoading }: DigitalTwinSimulatorProps) {
  const setActiveExplainabilityTab = useTCREStore(state => state.setActiveExplainabilityTab);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("B");

  if (isLoading || !analysis) {
    return (
      <section className="bg-bg-secondary rounded-lg p-5 border border-border-tertiary h-64 flex items-center justify-center">
        <span className="text-xs text-text-tertiary animate-pulse">Initializing clinical digital twin models...</span>
      </section>
    );
  }

  const { scenarios, rankings } = generatePredictions(analysis);
  const activeScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  // Risk Tier Colors Helper
  const getRiskTierBadgeClass = (tier: string) => {
    switch (tier) {
      case "Critical":
        return "bg-rose-700/10 text-rose-700 dark:text-rose-400 border border-rose-700/20 font-bold";
      case "High":
        return "bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold";
      case "Moderate":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold";
      case "Low":
        return "bg-teal-500/10 text-teal-500 border border-teal-500/20 font-medium";
      case "Minimal":
      default:
        return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium";
    }
  };

  // Status Colors Helper
  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("active") || s.includes("crisis")) {
      return "bg-text-danger/10 text-text-danger border border-text-danger/20 font-bold";
    }
    if (s.includes("escalating")) {
      return "bg-red-500/10 text-red-500 border border-red-500/20 font-bold";
    }
    if (s.includes("candidate")) {
      return "bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold";
    }
    if (s.includes("stable")) {
      return "bg-slate-400/10 text-slate-400 border border-slate-400/20 font-bold";
    }
    return "bg-text-success/10 text-text-success border border-text-success/20 font-medium";
  };

  // Difference highlight helper
  const renderDiffPill = (curr: number, prev: number, invert = false) => {
    const diff = curr - prev;
    if (diff === 0) return <span className="text-[10px] text-text-tertiary font-mono">no change</span>;
    
    // Invert: generally a drop in glucose scores is positive
    const isGood = invert ? diff > 0 : diff < 0;
    
    if (isGood) {
      return (
        <span className="bg-text-success/10 text-text-success border border-text-success/20 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
          ↓ {Math.abs(diff)}
        </span>
      );
    } else {
      return (
        <span className="bg-text-danger/10 text-text-danger border border-text-danger/20 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
          ↑ {Math.abs(diff)}
        </span>
      );
    }
  };

  const handleExplainClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveExplainabilityTab("twin");
    const element = document.getElementById("patent-explainability-explorer");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="bg-bg-secondary rounded-lg p-5 border border-border-tertiary flex flex-col gap-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <div className="flex justify-between items-center w-full">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Cpu className="w-4 h-4 text-text-info animate-pulse" />
            CLINICAL DIGITAL TWIN SIMULATOR (TCDTE)
          </h2>
          <button 
            onClick={handleExplainClick}
            className="text-[10px] text-text-info hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            Explain simulation logic →
          </button>
        </div>
        <p className="text-[11px] text-text-secondary">
          Simulated metabolic response forecasting and clinical scenario modeling.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Scenario Selector & Dynamic Simulation Dashboard */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {/* Scenario Tab Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedScenarioId(s.id)}
                className={`px-3 py-2 text-xs rounded border text-left font-semibold transition duration-150 cursor-pointer ${
                  selectedScenarioId === s.id
                    ? "bg-text-info/10 text-text-info border-text-info"
                    : "bg-bg-primary text-text-secondary border-border-tertiary hover:border-border-secondary hover:text-text-primary"
                }`}
              >
                <div className="text-[8px] uppercase font-bold text-text-tertiary">Scenario {s.id}</div>
                <div className="truncate mt-0.5">{s.name.replace(`Scenario ${s.id}: `, '')}</div>
              </button>
            ))}
          </div>

          {/* Active Simulation Display */}
          <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 flex flex-col gap-4 shadow-xs">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] uppercase font-bold text-text-info tracking-wider">Simulated Intervention Parameters</span>
                <h3 className="text-xs font-bold text-text-primary">{activeScenario.name}</h3>
                <p className="text-[10px] text-text-secondary leading-relaxed mt-0.5">{activeScenario.description}</p>
              </div>

              {(activeScenario.interventionAssumptions || activeScenario.physiologicalExplanation) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 pt-2.5 border-t border-border-tertiary/40 text-[10px]">
                  {activeScenario.interventionAssumptions && (
                    <div className="bg-bg-secondary/40 border border-border-tertiary/40 rounded p-2">
                      <span className="text-[8px] uppercase font-bold text-text-tertiary tracking-wider block mb-0.5">Intervention Assumptions</span>
                      <p className="text-text-secondary leading-relaxed">{activeScenario.interventionAssumptions}</p>
                    </div>
                  )}
                  {activeScenario.physiologicalExplanation && (
                    <div className="bg-text-info/5 border border-text-info/10 rounded p-2">
                      <span className="text-[8px] uppercase font-bold text-text-info tracking-wider block mb-0.5">Physiological Explanation</span>
                      <p className="text-text-primary leading-relaxed">{activeScenario.physiologicalExplanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Core Simulated Indicators Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Risk Evaluation */}
              <div className="bg-bg-secondary/40 border border-border-tertiary/60 p-3 rounded flex flex-col justify-between gap-2">
                <span className="text-[9px] uppercase font-bold text-text-tertiary flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-text-info" /> Simulated Risk Tier
                </span>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="space-y-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${getRiskTierBadgeClass(activeScenario.predictedRisk.tier)}`}>
                      {activeScenario.predictedRisk.tier}
                    </span>
                    <div className="text-[10px] text-text-secondary">
                      Score: <strong className="text-text-primary font-mono">{activeScenario.predictedRisk.score}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-text-tertiary">Baseline: {activeScenario.predictedRisk.prevScore} ({activeScenario.predictedRisk.prevTier})</div>
                    <div className="mt-1">{renderDiffPill(activeScenario.predictedRisk.score, activeScenario.predictedRisk.prevScore)}</div>
                  </div>
                </div>

                <div className="border-t border-border-tertiary/40 pt-1.5 flex justify-between items-center text-[10px] text-text-tertiary">
                  <span>Data Confidence:</span>
                  <span className="font-mono font-bold text-text-secondary">
                    {activeScenario.predictedRisk.confidence}% 
                    {activeScenario.predictedRisk.confidence !== activeScenario.predictedRisk.prevConfidence && 
                      ` (${activeScenario.predictedRisk.confidence > activeScenario.predictedRisk.prevConfidence ? "+" : ""}${activeScenario.predictedRisk.confidence - activeScenario.predictedRisk.prevConfidence}%)`
                    }
                  </span>
                </div>
              </div>

              {/* Composite State */}
              <div className="bg-bg-secondary/40 border border-border-tertiary/60 p-3 rounded flex flex-col justify-between gap-2">
                <span className="text-[9px] uppercase font-bold text-text-tertiary flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-text-danger" /> Simulated Composite State
                </span>

                <div className="flex items-center justify-between mt-1">
                  <div className="space-y-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${getStatusBadgeClass(activeScenario.predictedComposite.status)}`}>
                      {activeScenario.predictedComposite.status}
                    </span>
                    <div className="text-[10px] text-text-secondary">
                      Score: <strong className="text-text-primary font-mono">{activeScenario.predictedComposite.score}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-text-tertiary">Baseline: {activeScenario.predictedComposite.prevScore} ({activeScenario.predictedComposite.prevStatus})</div>
                    <div className="mt-1">{renderDiffPill(activeScenario.predictedComposite.score, activeScenario.predictedComposite.prevScore)}</div>
                  </div>
                </div>

                <div className="border-t border-border-tertiary/40 pt-1.5 flex justify-between items-center text-[10px] text-text-tertiary">
                  <span>Composite State:</span>
                  <span className="text-text-secondary font-semibold">Emerging Crisis</span>
                </div>
              </div>

            </div>

            {/* Latent States Grid */}
            <div className="bg-bg-secondary/40 border border-border-tertiary/60 p-3 rounded space-y-3">
              <span className="text-[9px] uppercase font-bold text-text-tertiary flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-text-info" /> Simulated Latent States
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: "sd", name: "Silent Deterioration" },
                  { key: "hv", name: "High Variability" },
                  { key: "cb", name: "Chronic Burden" },
                  { key: "fr", name: "False Recovery" }
                ].map((st) => {
                  const stateVal = (activeScenario.predictedStates as any)[st.key];
                  return (
                    <div key={st.key} className="bg-bg-primary/50 border border-border-tertiary/30 p-2 rounded text-center space-y-1">
                      <span className="text-[9px] font-bold text-text-secondary block truncate">{st.name}</span>
                      <div className="font-mono text-base font-extrabold text-text-primary">
                        {stateVal.score}
                      </div>
                      <div className="text-[9px] text-text-tertiary font-mono">Baseline: {stateVal.prevScore}</div>
                      <div className="pt-0.5">{renderDiffPill(stateVal.score, stateVal.prevScore)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulated Recommendations */}
            <div className="border-t border-border-tertiary pt-3 space-y-2">
              <span className="text-[9px] uppercase font-bold text-text-tertiary block">Simulated Recommendation Updates</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeScenario.predictedRecommendations.map((rec, idx) => (
                  <div key={idx} className="bg-bg-secondary/50 border border-border-tertiary/40 p-2.5 rounded flex gap-2 items-start text-[11px] leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-text-primary block font-semibold">{rec.title}</strong>
                      <span className="text-text-secondary text-[10px]">Benefit: {rec.benefit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Scenario Ranking Engine (Module 4) */}
        <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 flex flex-col gap-4 shadow-xs">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-text-warning" />
              Scenario Ranking Engine
            </h3>
            <p className="text-[10px] text-text-secondary leading-normal">
              Utility-ranked interventions based on simulated risk reduction and patient compliance.
            </p>
          </div>

          {/* Rankings List */}
          <div className="flex flex-col gap-3.5">
            {rankings.map((r) => {
              const isBest = r.rank === 1;
              const matchingTwin = scenarios.find(s => s.id === r.scenarioId);
              
              return (
                <div 
                  key={r.rank}
                  className={`border rounded-lg p-3 space-y-2 relative transition duration-150 cursor-pointer ${
                    selectedScenarioId === r.scenarioId
                      ? "bg-text-info/5 border-text-info"
                      : "bg-bg-secondary border-border-tertiary hover:border-border-secondary"
                  }`}
                  onClick={() => setSelectedScenarioId(r.scenarioId)}
                >
                  <div className="flex justify-between items-start gap-1.5">
                    <div className="space-y-0.5">
                      <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border tracking-wide inline-block ${
                        isBest
                          ? "bg-text-success/15 text-text-success border-text-success/20 animate-pulse"
                          : r.rank === 2
                            ? "bg-text-info/15 text-text-info border-text-info/20"
                            : "bg-bg-tertiary text-text-secondary border-border-tertiary"
                      }`}>
                        {r.badge}
                      </span>
                      <h4 className="text-xs font-bold text-text-primary pt-1 flex items-center gap-1">
                        <Award className={`w-3.5 h-3.5 ${isBest ? "text-text-success" : "text-text-tertiary"}`} />
                        Scenario {r.scenarioId}: {r.scenarioName}
                      </h4>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-text-primary font-mono">{r.score}</div>
                      <div className="text-[8px] uppercase tracking-wider text-text-tertiary">Utility Score</div>
                    </div>
                  </div>

                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    {r.reason}
                  </p>

                  {/* Criteria sub-scores breakdown */}
                  {matchingTwin && (
                    <div className="border-t border-border-tertiary/40 pt-2 grid grid-cols-5 gap-1 text-[8px] font-bold text-center uppercase text-text-tertiary">
                      <div>
                        <span>Risk Red.</span>
                        <span className="block text-text-primary font-mono font-bold mt-0.5">{matchingTwin.riskReduction}</span>
                      </div>
                      <div>
                        <span>Conf.</span>
                        <span className="block text-text-primary font-mono font-bold mt-0.5">{matchingTwin.confidence}</span>
                      </div>
                      <div>
                        <span>Traj.</span>
                        <span className="block text-text-primary font-mono font-bold mt-0.5">{matchingTwin.trajectoryImprovement}</span>
                      </div>
                      <div>
                        <span>Time Sav.</span>
                        <span className="block text-text-primary font-mono font-bold mt-0.5">{matchingTwin.timeSaved}</span>
                      </div>
                      <div>
                        <span>Reserve</span>
                        <span className="block text-text-primary font-mono font-bold mt-0.5">{matchingTwin.reservePreservation}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
