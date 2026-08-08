"use client";

import React from "react";
import { RiskOutput } from "../store/useTCREStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Shield, TrendingUp, TrendingDown, ArrowRight, HelpCircle } from "lucide-react";

import { useTCREStore } from "../store/useTCREStore";

interface RiskAssessmentProps {
  risk: RiskOutput | null;
  isLoading: boolean;
}

export default function RiskAssessment({ risk, isLoading }: RiskAssessmentProps) {
  const setActiveExplainabilityTab = useTCREStore(state => state.setActiveExplainabilityTab);

  if (!risk) {
    return (
      <section className="w-full bg-bg-secondary rounded-lg p-6 flex items-center justify-center text-center h-48 border border-border-tertiary">
        <span className="text-xs text-text-tertiary animate-pulse">Running clinical risk algorithms...</span>
      </section>
    );
  }

  // Risk score color mapping
  const getRiskColor = (score: number): string => {
    if (score <= 30) return "#10b981"; // Success Green
    if (score <= 60) return "#f59e0b"; // Warning Orange
    return "#ef4444"; // Danger Red
  };

  const getRiskColorClass = (score: number): string => {
    if (score <= 30) return "text-text-success";
    if (score <= 60) return "text-text-warning";
    return "text-text-danger";
  };

  // Risk Tier bg mapping
  const getTierBgClass = (tier: string): string => {
    const tierColors: Record<string, string> = {
      Minimal: "bg-emerald-500 text-white dark:bg-emerald-600",
      Low: "bg-teal-500 text-white dark:bg-teal-600",
      Moderate: "bg-amber-500 text-white dark:bg-amber-600",
      High: "bg-rose-500 text-white dark:bg-rose-600",
      Critical: "bg-rose-700 text-white dark:bg-rose-800 animate-pulse",
    };
    return tierColors[tier] || "bg-slate-500 text-white";
  };

  const getTierDescription = (tier: string): string => {
    const desc: Record<string, string> = {
      Minimal: "Glycemic profile exhibits negligible risk of short-term complications.",
      Low: "Glycemic profile is stable. Maintain current diet and therapy regimens.",
      Moderate: "Glycemic deviations are moderate. Review logs and consider therapy tweaks.",
      High: "Significant glycemic instability. Close clinical monitoring is highly advised.",
      Critical: "Severe metabolic indices. Urgent clinical action or assessment is recommended.",
    };
    return desc[tier] || "Risk tier parameters are within baseline ranges.";
  };

  // Trend mapping
  const getTrendIcon = (trend: string): string => {
    if (trend.toLowerCase().includes("escalating") || trend.toLowerCase().includes("worsening")) return "↗";
    if (trend.toLowerCase().includes("improving") || trend.toLowerCase().includes("declining")) return "↘";
    return "→";
  };

  const getTrendColorClass = (trend: string): string => {
    if (trend.toLowerCase().includes("escalating") || trend.toLowerCase().includes("worsening")) return "text-text-danger";
    if (trend.toLowerCase().includes("improving") || trend.toLowerCase().includes("declining")) return "text-text-success";
    return "text-text-warning";
  };

  const getTrendSubtext = (trend: string): string => {
    if (trend.toLowerCase().includes("escalating") || trend.toLowerCase().includes("worsening")) {
      return "Risk has increased over the last 5 observation days.";
    }
    if (trend.toLowerCase().includes("improving") || trend.toLowerCase().includes("declining")) {
      return "Glycemic risk markers show a downward trend recently.";
    }
    return "No significant risk variation detected in this window.";
  };

  // Driver detail tooltip helper
  const getDriverImpactText = (driver: string) => {
    const name = driver.toLowerCase();
    if (name.includes("volatility") || name.includes("variability")) {
      return `${driver} indicates rapid fluctuations. Adds substantial weight (+20) to risk score.`;
    }
    if (name.includes("burden")) {
      return `${driver} indicates prolonged hyperglycemia. Adds significant weight (+18) to risk score.`;
    }
    if (name.includes("deviation")) {
      return `${driver} indicates shift from fasting targets. Adds moderate weight (+15) to risk score.`;
    }
    if (name.includes("velocity")) {
      return `${driver} indicates rate of upward rise. Adds light weight (+10) to risk score.`;
    }
    return `${driver} contributes directly to the overall clinical risk assessment.`;
  };

  const handleClick = () => {
    setActiveExplainabilityTab("risk");
    const element = document.getElementById("patent-explainability-explorer");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section 
      onClick={handleClick}
      className="w-full bg-bg-secondary rounded-lg p-5 border border-border-tertiary flex flex-col gap-4 shadow-sm cursor-pointer hover:border-text-info/40"
    >
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-text-info" /> Metabolic Risk Evaluation
        </h2>
        <p className="text-[11px] text-text-secondary">
          Weighted safety scoring and trend assessments generated from combined temporal indicators.
        </p>
      </div>

      {/* 3 Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Risk Score (circular SVG Gauge) */}
        <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5 flex flex-col items-center justify-between shadow-sm">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 w-full text-left">
            Glycemic Risk Score
          </h3>
          
          <div className="flex justify-center items-center my-1 relative">
            <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
              {/* Background Circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="var(--color-border-tertiary)"
                strokeWidth="8"
              />
              {/* Progress Arc */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={getRiskColor(risk.score)}
                strokeWidth="8"
                strokeDasharray={`${(risk.score / 100) * 314.16} 314.16`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-text-primary font-mono leading-none">
                {risk.score}
              </span>
              <span className="text-[9px] text-text-secondary uppercase tracking-wider mt-0.5">
                Scale 0-100
              </span>
            </div>
          </div>
          
          <p className="text-[10px] text-text-tertiary text-center mt-3">
            Confidence: <strong className="text-text-secondary font-semibold">{risk.confidence}%</strong>
          </p>
        </div>

        {/* Card 2: Risk Tier */}
        <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5 flex flex-col justify-between shadow-sm">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Clinical Risk Tier
          </h3>
          
          <div className="my-auto flex flex-col items-center justify-center py-2">
            <span className={`inline-flex items-center justify-center py-1.5 px-4 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-xs ${getTierBgClass(risk.tier)}`}>
              {risk.tier}
            </span>
          </div>
          
          <p className="text-[10px] text-text-secondary leading-relaxed text-center mt-2">
            {getTierDescription(risk.tier)}
          </p>
        </div>

        {/* Card 3: Risk Trend */}
        <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5 flex flex-col justify-between shadow-sm">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
            Glycemic Trend Line
          </h3>

          <div className="my-auto py-2 flex flex-col items-center justify-center">
            <span className={`text-4xl font-extrabold leading-none ${getTrendColorClass(risk.trend)}`}>
              {getTrendIcon(risk.trend)}
            </span>
            <span className={`text-xs font-bold uppercase tracking-wider mt-1.5 ${getTrendColorClass(risk.trend)}`}>
              {risk.trend}
            </span>
          </div>

          <p className="text-[10px] text-text-secondary leading-relaxed text-center mt-2">
            {getTrendSubtext(risk.trend)}
          </p>
        </div>
      </div>

      {/* Risk Drivers Section */}
      <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 flex flex-col gap-2.5 shadow-sm">
        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
          Primary Risk Drivers
        </h4>
        
        <div className="flex flex-wrap gap-2">
          {risk.drivers.map((driver) => (
            <Tooltip key={driver}>
              <TooltipTrigger className="inline-flex items-center gap-1 px-3 py-1 bg-text-warning/10 text-text-warning hover:bg-text-warning/15 border border-text-warning/20 rounded-full text-xs font-medium cursor-help transition-all">
                <span>⚠️ {driver}</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                {getDriverImpactText(driver)}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Risk V2 Amplifiers & Reducers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Amplifiers */}
        <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 flex flex-col gap-2.5 shadow-sm">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-text-danger" /> Risk Amplifiers (Worsening Factors)
          </h4>
          <div className="flex flex-wrap gap-2">
            {risk.amplifiers?.map((amp, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-text-danger/10 text-text-danger border border-text-danger/20 rounded-full text-xs font-medium">
                ⚡ {amp}
              </span>
            ))}
            {(!risk.amplifiers || risk.amplifiers.length === 0) && (
              <span className="text-xs text-text-tertiary">No active amplifying risk factors.</span>
            )}
          </div>
        </div>

        {/* Reducers */}
        <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 flex flex-col gap-2.5 shadow-sm">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-text-success" /> Risk Reducers (Mitigating Factors)
          </h4>
          <div className="flex flex-wrap gap-2">
            {risk.reducers?.map((red, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-text-success/10 text-text-success border border-text-success/20 rounded-full text-xs font-medium">
                🛡️ {red}
              </span>
            ))}
            {(!risk.reducers || risk.reducers.length === 0) && (
              <span className="text-xs text-text-tertiary">No active mitigating risk factors.</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
