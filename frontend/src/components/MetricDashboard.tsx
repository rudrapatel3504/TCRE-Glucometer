"use client";

import React from "react";
import { MetricsOutput } from "../store/useTCREStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Progress } from "./ui/progress";
import { HelpCircle, TrendingUp, TrendingDown, MoveRight } from "lucide-react";

import { useTCREStore } from "../store/useTCREStore";

interface MetricDashboardProps {
  metrics: MetricsOutput | null;
  isLoading: boolean;
}

export default function MetricDashboard({ metrics, isLoading }: MetricDashboardProps) {
  const setActiveExplainabilityTab = useTCREStore(state => state.setActiveExplainabilityTab);
  
  if (!metrics) {
    return (
      <section className="w-full bg-bg-secondary rounded-lg p-6 flex items-center justify-center text-center h-48 border border-border-tertiary">
        <span className="text-xs text-text-tertiary animate-pulse">Waiting for metabolic calculations...</span>
      </section>
    );
  }

  // Trend labels according to spec
  const getTrendLabel = (value: number, name: string): string => {
    const key = name.toUpperCase();
    if (key === "VI" || key === "AI" || key === "BDI" || key === "CBI" || key === "VELOCITY INDEX" || key === "ACCELERATION INDEX" || key === "BASELINE DEVIATION" || key === "CUMULATIVE BURDEN") {
      if (value < 30) return "Low";
      if (value < 60) return "Moderate";
      return "High";
    }
    if (key === "VOL" || key === "VOLATILITY INDEX" || key === "VOLATILITY") {
      if (value < 25) return "Stable";
      if (value < 50) return "Variable";
      return "Highly Variable";
    }
    if (key === "SCI" || key === "STATE CONFIDENCE" || key === "STATE CONFIDENCE INDEX") {
      if (value < 50) return "Low Confidence";
      if (value < 75) return "Moderate Confidence";
      return "High Confidence";
    }
    return "Unknown";
  };

  // Color functions for metric values
  const getMetricColorClass = (value: number, name: string): string => {
    const key = name.toUpperCase();
    if (key === "VI" || key === "AI" || key === "BDI" || key === "CBI" || key === "VELOCITY INDEX" || key === "ACCELERATION INDEX" || key === "BASELINE DEVIATION" || key === "CUMULATIVE BURDEN") {
      if (value < 30) return "text-text-success";
      if (value < 60) return "text-text-warning";
      return "text-text-danger";
    }
    if (key === "VOL" || key === "VOLATILITY INDEX" || key === "VOLATILITY") {
      if (value < 25) return "text-text-success";
      if (value < 50) return "text-text-warning";
      return "text-text-danger";
    }
    // SCI color
    if (value < 50) return "text-text-danger";
    if (value < 75) return "text-text-warning";
    return "text-text-success";
  };

  const getSciColor = (value: number): string => {
    if (value < 50) return "bg-text-danger";
    if (value < 75) return "bg-text-warning";
    return "bg-text-success";
  };

  // Render trend icon
  const renderTrendIcon = (trend: "up" | "down" | "flat", colorClass: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className={`w-3.5 h-3.5 inline ${colorClass}`} />;
      case "down":
        return <TrendingDown className={`w-3.5 h-3.5 inline ${colorClass}`} />;
      case "flat":
      default:
        return <MoveRight className="w-3.5 h-3.5 inline text-text-tertiary" />;
    }
  };

  // Card subcomponent
  interface MetricCardProps {
    name: string;
    value: number;
    confidence: number;
    trend: "up" | "down" | "flat";
    description: string;
  }

  const MetricCard = ({ name, value, confidence, trend, description }: MetricCardProps) => {
    const colorClass = getMetricColorClass(value, name);
    const trendText = getTrendLabel(value, name);

    const handleClick = () => {
      setActiveExplainabilityTab("metrics");
      const nameMap: Record<string, string> = {
        "Velocity Index": "vi",
        "Acceleration Index": "ai",
        "Volatility Index": "vol",
        "Baseline Deviation": "bdi",
        "Cumulative Burden": "cbi",
        "State Confidence": "sci"
      };
      const metricId = nameMap[name];
      if (metricId) {
        useTCREStore.getState().setSelectedExplainabilityMetric(metricId);
      }
      const element = document.getElementById("patent-explainability-explorer");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    return (
      <div 
        onClick={handleClick}
        className="bg-bg-primary border border-border-tertiary rounded-lg p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer hover:border-text-info/40"
      >
        <div className="flex justify-between items-start mb-2 gap-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{name}</p>
          <Tooltip>
            <TooltipTrigger 
              onClick={(e) => e.stopPropagation()} 
              className="text-text-tertiary hover:text-text-primary transition-colors cursor-help bg-transparent border-0 p-0"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              {description}
            </TooltipContent>
          </Tooltip>
        </div>

        <p className={`text-2xl font-bold ${colorClass} mb-3 font-mono`}>{value}</p>

        <div className="flex items-center justify-between text-xs mt-auto pt-2 border-t border-border-tertiary/40">
          <span className={`flex items-center gap-1 font-semibold ${colorClass}`}>
            {renderTrendIcon(trend, colorClass)}
            {trendText}
          </span>
          <span className="text-text-tertiary text-[10px]">Conf: <strong className="text-text-secondary">{confidence}%</strong></span>
        </div>
      </div>
    );
  };

  return (
    <section className="w-full bg-bg-secondary rounded-lg p-5 border border-border-tertiary flex flex-col gap-4 shadow-sm">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-bold text-text-primary">Glycemic Metric Engine</h2>
        <p className="text-[11px] text-text-secondary">
          Deep temporal indicators analyzing velocity, acceleration, baseline shift, and stress accumulation.
        </p>
      </div>

      {/* Grid of 6 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          name="Velocity Index"
          value={metrics.vi.raw}
          confidence={metrics.vi.confidence}
          trend={metrics.vi.trend}
          description="Measures rate of change (mg/dL per day). Higher values indicate faster glucose rise."
        />

        <MetricCard
          name="Acceleration Index"
          value={metrics.ai.raw}
          confidence={metrics.ai.confidence}
          trend={metrics.ai.trend}
          description="Measures change in velocity. Positive = worsening/accelerating, Negative = improving."
        />

        <MetricCard
          name="Volatility Index"
          value={metrics.vol.raw}
          confidence={metrics.vol.confidence}
          trend={metrics.vol.trend}
          description="Measures instability, swings, and oscillation. Higher values = more glycemic instability."
        />

        <MetricCard
          name="Baseline Deviation"
          value={metrics.bdi.raw}
          confidence={metrics.bdi.confidence}
          trend={metrics.bdi.trend}
          description="Deviation from patient's clinical baseline. Higher values = further from target fasting ranges."
        />

        <MetricCard
          name="Cumulative Burden"
          value={metrics.cbi.raw}
          confidence={metrics.cbi.confidence}
          trend={metrics.cbi.trend}
          description="Accumulated physiological stress over time. Measures duration and extent of hyperglycemia."
        />

        <MetricCard
          name="State Confidence"
          value={metrics.sci.raw}
          confidence={metrics.sci.confidence}
          trend={metrics.sci.trend}
          description="Confidence level in the overall model state assessment based on data density and noise."
        />
      </div>

      {/* SCI Progress Bar */}
      <div className="bg-bg-primary border border-border-tertiary rounded-lg p-4 mt-2 flex flex-col gap-2 shadow-sm">
        <div className="flex justify-between items-center">
          <p className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
            Overall State Confidence Index (SCI)
            <Tooltip>
              <TooltipTrigger className="text-text-tertiary hover:text-text-primary transition-colors cursor-help bg-transparent border-0 p-0">
                <HelpCircle className="w-3.5 h-3.5" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                Confidence reflects measurement count, temporal distribution, gaps, and sensor noise stability.
              </TooltipContent>
            </Tooltip>
          </p>
          <span className={`text-xs font-bold font-mono ${getMetricColorClass(metrics.sci.raw, "sci")}`}>
            {metrics.sci.raw}%
          </span>
        </div>

        <div className="w-full bg-bg-secondary rounded-full h-2.5 overflow-hidden border border-border-tertiary">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${getSciColor(metrics.sci.raw)}`}
            style={{ width: `${metrics.sci.raw}%` }}
          />
        </div>
      </div>
    </section>
  );
}
