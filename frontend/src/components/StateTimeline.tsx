"use client";

import React, { useRef } from "react";
import { TimelineNode } from "../store/useTCREStore";
import { Calendar, ChevronRight, Activity, ArrowRightLeft } from "lucide-react";

interface StateTimelineProps {
  timeline: TimelineNode[];
  isLoading: boolean;
}

export default function StateTimeline({ timeline, isLoading }: StateTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (isLoading || timeline.length === 0) {
    return (
      <section className="bg-bg-secondary rounded-lg p-5 border border-border-tertiary h-48 flex items-center justify-center">
        <span className="text-xs text-text-tertiary animate-pulse">Reconstructing clinical timeline history...</span>
      </section>
    );
  }

  // Get state badges
  const getStateBadgeClass = (stateName: string) => {
    if (stateName === "Emerging Crisis") {
      return "bg-text-danger/10 text-text-danger border-text-danger/20";
    }
    if (stateName === "Silent Deterioration") {
      return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
    }
    if (stateName === "High Variability") {
      return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    }
    if (stateName === "Chronic Burden") {
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }
    if (stateName === "False Recovery") {
      return "bg-text-info/10 text-text-info border-text-info/20";
    }
    return "bg-bg-tertiary text-text-secondary border-border-tertiary";
  };

  return (
    <section className="bg-bg-secondary rounded-lg p-5 border border-border-tertiary flex flex-col gap-4 shadow-sm relative">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-info" />
            Clinical State Timeline
          </h2>
          <p className="text-[11px] text-text-secondary">
            Chronological state progression synthesized across historical patient measurements.
          </p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-text-tertiary">
          <span>Scroll horizontally</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>

      {/* Horizontal Scrollable Container */}
      <div 
        ref={containerRef}
        className="w-full overflow-x-auto pb-4 pt-2 flex items-stretch gap-6 scrollbar-thin scrollbar-thumb-border-tertiary scrollbar-track-transparent"
      >
        {timeline.map((node, index) => {
          const isCrisis = node.states.includes("Emerging Crisis");
          const isStable = node.states.includes("Stable Profile");
          
          return (
            <div key={index} className="flex items-stretch flex-shrink-0 min-w-[240px] relative group">
              {/* Connecting line */}
              {index < timeline.length - 1 && (
                <div className="absolute top-[28px] left-[150px] right-[-24px] h-0.5 border-t-2 border-dashed border-border-tertiary z-0"></div>
              )}

              {/* Node Card */}
              <div className="flex flex-col gap-2 bg-bg-tertiary/40 border border-border-tertiary hover:border-border-secondary rounded-lg p-4 w-full z-10 transition duration-200">
                {/* Node Header */}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-text-info bg-text-info/5 px-2 py-0.5 rounded-[4px] border border-text-info/15 font-mono">
                    Day {node.day}
                  </span>
                  <span className="text-[10px] text-text-tertiary font-mono">{node.date}</span>
                </div>

                {/* State list */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {node.states.map((state, sIdx) => (
                    <span 
                      key={sIdx} 
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-[3px] border ${getStateBadgeClass(state)}`}
                    >
                      {state}
                    </span>
                  ))}
                </div>

                {/* Node Description */}
                <p className="text-[11px] text-text-secondary leading-relaxed mt-2 italic">
                  "{node.description}"
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
