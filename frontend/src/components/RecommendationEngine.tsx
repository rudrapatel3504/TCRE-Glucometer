"use client";

import React, { useState } from "react";
import { RecommendationDetail } from "../store/useTCREStore";
import { CheckSquare, ShieldCheck, Heart, AlertCircle, ChevronDown, ChevronUp, Activity, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface RecommendationEngineProps {
  recommendations: RecommendationDetail[] | null;
  isLoading: boolean;
}

export default function RecommendationEngine({ recommendations, isLoading }: RecommendationEngineProps) {
  const [expandedRecs, setExpandedRecs] = useState<Record<string, boolean>>({});

  if (isLoading || !recommendations) {
    return (
      <section className="bg-bg-secondary rounded-lg p-6 border border-border-tertiary h-48 flex items-center justify-center shadow-sm">
        <span className="text-sm text-text-tertiary animate-pulse">Formulating clinical recommendations...</span>
      </section>
    );
  }

  const toggleExpand = (key: string) => {
    setExpandedRecs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Group recommendations by priority levels
  const immediate = recommendations.filter(r => r.type === "URGENT");
  const followUp = recommendations.filter(r => r.type === "PRIMARY");
  const monitoring = recommendations.filter(r => r.type === "SECONDARY");
  const lifestyle = recommendations.filter(r => r.type !== "URGENT" && r.type !== "PRIMARY" && r.type !== "SECONDARY");

  const getPriorityLabel = (type: string) => {
    switch (type) {
      case "URGENT": return "Immediate Action";
      case "PRIMARY": return "Recommended Follow-up";
      case "SECONDARY": return "Monitoring Action";
      default: return "Lifestyle & Long-Term";
    }
  };

  const getPriorityBadgeClass = (type: string) => {
    switch (type) {
      case "URGENT":
        return "bg-text-danger/10 text-text-danger border border-text-danger/30 font-extrabold animate-pulse";
      case "PRIMARY":
        return "bg-text-warning/10 text-text-warning border border-text-warning/20 font-bold";
      case "SECONDARY":
        return "bg-text-info/10 text-text-info border border-text-info/20 font-medium";
      default:
        return "bg-bg-primary text-text-secondary border border-border-secondary font-medium";
    }
  };

  const getPriorityIcon = (type: string) => {
    switch (type) {
      case "URGENT": return <AlertCircle className="w-5 h-5 text-text-danger animate-pulse" />;
      case "PRIMARY": return <Activity className="w-5 h-5 text-text-warning" />;
      case "SECONDARY": return <ShieldCheck className="w-5 h-5 text-text-info" />;
      default: return <Heart className="w-5 h-5 text-text-success" />;
    }
  };

  const renderRecommendationCard = (rec: RecommendationDetail, groupKey: string, index: number) => {
    const uniqueKey = `${groupKey}-${index}`;
    const isExpanded = expandedRecs[uniqueKey] || false;

    // Convert technical terminology in recommendations to human-readable terms
    const cleanLatentState = rec.activatedLatentState
      ?.replace("Silent Deterioration", "Hidden Glycemic Decline")
      ?.replace("False Recovery", "Temporary Stability Illusion")
      ?.replace("Chronic Burden", "Prolonged Glucose Stress")
      ?.replace("High Volatility", "Frequent Sugar Swings");

    return (
      <div 
        key={uniqueKey}
        className={`bg-bg-primary border rounded-lg p-5 flex flex-col justify-between transition-all duration-200 ${
          rec.type === "URGENT" 
            ? "border-text-danger/40 shadow-xs hover:shadow-md bg-text-danger/5" 
            : "border-border-tertiary shadow-xs hover:shadow-md hover:border-text-info/30"
        }`}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{getPriorityIcon(rec.type)}</div>
            <div className="space-y-1">
              <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border ${getPriorityBadgeClass(rec.type)}`}>
                {getPriorityLabel(rec.type)}
              </span>
              <h3 className="text-base font-bold text-text-primary leading-snug">
                {rec.title}
              </h3>
            </div>
          </div>
          
          <div className="text-right flex items-center gap-1">
            <span className="text-[10px] text-text-tertiary">Confidence:</span>
            <span className="text-xs font-bold text-text-success">{rec.confidence}</span>
          </div>
        </div>

        <div className="mt-4 space-y-4 pt-3 border-t border-border-tertiary/50">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary block">
              Expected Benefit
            </span>
            <p className="text-sm text-text-secondary mt-1 leading-relaxed">
              {rec.benefit}
            </p>
          </div>

          {rec.physiologicalEffect && (
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary block">
                Primary Reason
              </span>
              <p className="text-sm text-text-primary mt-1 leading-relaxed">
                {rec.physiologicalEffect}
              </p>
            </div>
          )}

          {/* Collapsed Technical Evidence Box */}
          <div className="pt-2">
            <button
              onClick={() => toggleExpand(uniqueKey)}
              className="inline-flex items-center gap-1.5 text-xs text-text-info hover:text-text-info/80 transition-colors font-semibold focus:outline-hidden"
            >
              {isExpanded ? (
                <>Hide Technical Explanation <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>Show Technical Explanation <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>

            {isExpanded && (
              <div className="mt-3 p-3 bg-bg-secondary/60 rounded border border-border-tertiary space-y-2 text-xs font-mono text-text-secondary">
                <div>
                  <span className="text-text-tertiary font-bold">Rule Engine Trigger:</span>
                  <span className="block mt-0.5 text-text-primary bg-bg-primary px-2 py-0.5 rounded border border-border-tertiary inline-block">{rec.source}</span>
                </div>
                {rec.activatedCompositeState && (
                  <div>
                    <span className="text-text-tertiary font-bold">Overall Condition (Composite State):</span>
                    <span className="block mt-0.5 text-text-primary">{rec.activatedCompositeState}</span>
                  </div>
                )}
                {cleanLatentState && (
                  <div>
                    <span className="text-text-tertiary font-bold">Underlying Pattern (Latent State):</span>
                    <span className="block mt-0.5 text-text-primary">{cleanLatentState}</span>
                  </div>
                )}
                {rec.dominantMetric && (
                  <div>
                    <span className="text-text-tertiary font-bold">Dominant Metric:</span>
                    <span className="block mt-0.5 text-text-primary">{rec.dominantMetric}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGroup = (title: string, list: RecommendationDetail[], groupKey: string) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase text-text-secondary tracking-wider flex items-center gap-2 border-b border-border-tertiary/60 pb-2">
          <span>{title}</span>
          <span className="px-2 py-0.5 rounded-full bg-bg-secondary text-[10px] font-bold text-text-tertiary">
            {list.length}
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((rec, idx) => renderRecommendationCard(rec, groupKey, idx))}
        </div>
      </div>
    );
  };

  return (
    <section id="recommendation-engine" className="bg-bg-secondary rounded-lg p-6 border border-border-tertiary flex flex-col gap-6 shadow-sm w-full">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-text-success" />
          Recommended Actions
          <Tooltip>
            <TooltipTrigger className="text-text-tertiary hover:text-text-primary transition-colors cursor-help bg-transparent border-0 p-0">
              <HelpCircle className="w-4 h-4 ml-0.5" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              Actions generated by the clinical reasoning engine (TCARE) to optimize therapy and prevent complications.
            </TooltipContent>
          </Tooltip>
        </h2>
        <p className="text-xs text-text-secondary leading-relaxed">
          Dynamic clinical guidelines computed from your active glycemic profiles and stress index layers.
        </p>
      </div>

      <div className="space-y-6">
        {immediate.length === 0 && followUp.length === 0 && monitoring.length === 0 && lifestyle.length === 0 ? (
          <div className="bg-bg-primary/45 border border-border-tertiary rounded-lg p-8 text-center italic text-sm text-text-tertiary">
            No clinical recommendations generated for the current patient profile.
          </div>
        ) : (
          <>
            {renderGroup("Immediate Actions", immediate, "immediate")}
            {renderGroup("Recommended Follow-up", followUp, "followup")}
            {renderGroup("Monitoring Actions", monitoring, "monitoring")}
            {renderGroup("Lifestyle & Long-Term Recommendations", lifestyle, "lifestyle")}
          </>
        )}
      </div>
    </section>
  );
}
