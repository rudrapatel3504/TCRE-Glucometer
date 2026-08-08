"use client";

import React from "react";
import { AnalysisResult } from "../store/useTCREStore";
import { generatePredictions, TrajectoryPathway } from "../lib/predictionEngine";
import { BrainCircuit, Calendar, TrendingUp, Sparkles, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";

import { useTCREStore } from "../store/useTCREStore";

interface TrajectoryPredictionPanelProps {
  analysis: AnalysisResult | null;
  isLoading: boolean;
}

export default function TrajectoryPredictionPanel({ analysis, isLoading }: TrajectoryPredictionPanelProps) {
  const setActiveExplainabilityTab = useTCREStore(state => state.setActiveExplainabilityTab);

  if (isLoading || !analysis) {
    return (
      <section className="bg-bg-secondary rounded-lg p-5 border border-border-tertiary h-64 flex items-center justify-center">
        <span className="text-xs text-text-tertiary animate-pulse">Modeling clinical trajectories...</span>
      </section>
    );
  }

  const { pathways, recommendationForecast } = generatePredictions(analysis);

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

  const getProgressColor = (val: number) => {
    if (val >= 80) return "bg-text-success";
    if (val >= 60) return "bg-text-warning";
    return "bg-text-danger";
  };

  return (
    <section className="bg-bg-secondary rounded-lg p-5 border border-border-tertiary flex flex-col gap-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-text-info" />
          TRAJECTORY PREDICTION ENGINE (TCTPE)
        </h2>
        <p className="text-[11px] text-text-secondary">
          Future-state pathway forecasts and dynamic risk projections.
        </p>
      </div>

      {/* Pathways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pathways.map((pathway) => {
          const isHighProb = pathway.probability >= 50;
          const handleClick = () => {
            setActiveExplainabilityTab("predictions");
            const element = document.getElementById("patent-explainability-explorer");
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          };

          return (
            <div 
              key={pathway.id}
              onClick={handleClick}
              className={`bg-bg-primary border rounded-lg p-4 flex flex-col justify-between gap-4 transition duration-200 relative cursor-pointer hover:border-text-info/40 ${
                isHighProb ? "border-text-info/30 shadow-xs hover:border-text-info/40" : "border-border-tertiary hover:border-border-secondary"
              }`}
            >
              {isHighProb && (
                <span className="absolute top-2 right-2 bg-text-info/10 text-text-info border border-text-info/20 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Primary Pathway
                </span>
              )}

              {/* Title & Probability */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-text-primary">{pathway.name}</h3>
                  <span className="text-sm font-extrabold font-mono text-text-info">
                    {pathway.probability}%
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-text-tertiary">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" /> {pathway.estimatedTime}
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary leading-relaxed pt-1">
                  {pathway.description}
                </p>
                {pathway.reasoning && pathway.reasoning.length > 0 && (
                  <ul className="mt-1.5 space-y-1 pl-4 list-disc text-[9.5px] text-text-secondary">
                    {pathway.reasoning.map((reason, rIdx) => (
                      <li key={rIdx} className="leading-normal">
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Outcome Transition Display */}
              <div className="bg-bg-secondary/60 border border-border-tertiary/40 rounded p-2 text-center">
                <span className="text-[9px] uppercase font-bold text-text-tertiary block mb-1">Outcome Projection</span>
                <span className="text-[11px] font-bold text-text-primary flex items-center justify-center gap-1">
                  {pathway.outcome}
                </span>
              </div>

              {/* Projections Detail Block */}
              <div className="space-y-2 border-t border-dashed border-border-tertiary pt-3 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-text-tertiary">Risk Tier:</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase ${getRiskTierBadgeClass(pathway.predictedRisk.tier)}`}>
                    {pathway.predictedRisk.tier}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-tertiary">Risk Score:</span>
                  <span className="font-mono font-bold text-text-primary">{pathway.predictedRisk.score}/100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-tertiary">Composite Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase ${getStatusBadgeClass(pathway.predictedComposite.status)}`}>
                    {pathway.predictedComposite.status}
                  </span>
                </div>

                {/* Micro-states score bars */}
                <div className="space-y-1 pt-1.5 border-t border-border-tertiary/30">
                  <div className="flex justify-between text-[9px] text-text-secondary">
                    <span>States: SD / HV / CB</span>
                    <span className="font-mono font-bold">
                      {pathway.predictedStates.sd.score} / {pathway.predictedStates.hv.score} / {pathway.predictedStates.cb.score}
                    </span>
                  </div>
                  <div className="flex gap-1 h-1 w-full rounded-full overflow-hidden bg-bg-secondary">
                    <div className="bg-text-warning" style={{ width: `${pathway.predictedStates.sd.score}%` }}></div>
                    <div className="bg-text-danger" style={{ width: `${pathway.predictedStates.hv.score}%` }}></div>
                    <div className="bg-text-info" style={{ width: `${pathway.predictedStates.cb.score}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Pathway recommendations */}
              {pathway.predictedRecommendations.length > 0 && (
                <div className="border-t border-border-tertiary/40 pt-2.5 space-y-1.5">
                  <span className="text-[9px] uppercase font-bold text-text-tertiary block">Simulated Actions</span>
                  <div className="space-y-1">
                    {pathway.predictedRecommendations.map((rec, idx) => (
                      <div key={idx} className="flex gap-1.5 items-start text-[10px] text-text-secondary leading-normal">
                        <CheckCircle2 className="w-3.5 h-3.5 text-text-success flex-shrink-0 mt-0.5" />
                        <span>{rec.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Future Recommendation Forecasting */}
      <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 space-y-4 shadow-xs">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-text-warning" />
            Future Recommendation Forecasting
          </h3>
          <p className="text-[10px] text-text-secondary">
            Predictive therapy guidance timeline matching the primary trajectory.
          </p>
        </div>

        {/* Timeline flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {recommendationForecast.map((forecast, idx) => (
            <div key={idx} className="flex flex-col justify-between gap-2 bg-bg-secondary/40 border border-border-tertiary/40 p-3 rounded relative">
              {idx < 3 && (
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10 text-border-secondary font-bold">
                  <ArrowRight className="w-4 h-4 text-text-tertiary" />
                </div>
              )}
              
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-extrabold text-text-info tracking-wider block">
                  {forecast.timeframe}
                </span>
                <h4 className="text-xs font-bold text-text-primary leading-snug">
                  {forecast.title}
                </h4>
                <p className="text-[10px] text-text-secondary leading-relaxed pt-1">
                  Benefit: <span className="italic text-text-primary">"{forecast.benefit}"</span>
                </p>
              </div>

              {/* Confidence Progress */}
              <div className="space-y-1 pt-2 border-t border-border-tertiary/40">
                <div className="flex justify-between text-[9px] font-bold">
                  <span className="text-text-tertiary">Forecast Confidence</span>
                  <span className="font-mono text-text-primary">{forecast.confidence}%</span>
                </div>
                <div className="w-full bg-bg-primary h-1 rounded-full overflow-hidden border border-border-tertiary/20">
                  <div 
                    className={`h-full ${getProgressColor(forecast.confidence)} transition-all duration-300`}
                    style={{ width: `${forecast.confidence}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
