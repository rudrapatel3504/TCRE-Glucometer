"use client";

import React from "react";
import { BrainCircuit, Cpu, Hourglass } from "lucide-react";

export default function FutureEnginePlaceholders() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch w-full">
      {/* Trajectory Prediction Placeholder */}
      <div className="bg-bg-secondary rounded-lg p-5 border border-border-tertiary border-dashed flex flex-col gap-4 relative overflow-hidden shadow-xs group hover:border-border-secondary transition duration-200">
        {/* Blurry mock interface container */}
        <div className="absolute inset-0 bg-bg-primary/20 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-4">
          <div className="bg-bg-secondary/90 border border-border-secondary px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 animate-bounce">
            <Hourglass className="w-4 h-4 text-text-warning" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary">
              Coming in Version 3
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-0.5 filter blur-[1px] select-none">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-text-tertiary" />
            Glycemic Trajectory Prediction (TCTPE)
          </h2>
          <p className="text-[11px] text-text-secondary">
            Predictive forecasting models mapping multi-day glycemic trends.
          </p>
        </div>

        {/* Mock Chart Layout */}
        <div className="flex-1 min-h-[90px] border border-border-tertiary/60 rounded p-3 bg-bg-tertiary/20 flex flex-col justify-between filter blur-[1px] select-none">
          <div className="h-2 bg-border-tertiary w-1/3 rounded"></div>
          <div className="flex gap-2 items-end h-12">
            <div className="bg-border-tertiary w-full h-8 rounded-t"></div>
            <div className="bg-border-tertiary w-full h-10 rounded-t"></div>
            <div className="bg-border-tertiary w-full h-6 rounded-t"></div>
            <div className="bg-border-tertiary w-full h-12 rounded-t"></div>
          </div>
        </div>
      </div>

      {/* Digital Twin Placeholder */}
      <div className="bg-bg-secondary rounded-lg p-5 border border-border-tertiary border-dashed flex flex-col gap-4 relative overflow-hidden shadow-xs group hover:border-border-secondary transition duration-200">
        {/* Blurry mock interface container */}
        <div className="absolute inset-0 bg-bg-primary/20 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-4">
          <div className="bg-bg-secondary/90 border border-border-secondary px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 animate-bounce">
            <Hourglass className="w-4 h-4 text-text-warning" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary">
              Coming in Version 3
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-0.5 filter blur-[1px] select-none">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Cpu className="w-4 h-4 text-text-tertiary" />
            Clinical Digital Twin Simulation (TCDTE)
          </h2>
          <p className="text-[11px] text-text-secondary">
            Simulated metabolic response forecasting and clinical scenario modeling.
          </p>
        </div>

        {/* Mock Controls Layout */}
        <div className="flex-1 min-h-[90px] border border-border-tertiary/60 rounded p-3 bg-bg-tertiary/20 flex flex-col gap-2 filter blur-[1px] select-none">
          <div className="h-2.5 bg-border-tertiary w-1/2 rounded"></div>
          <div className="h-2.5 bg-border-tertiary w-3/4 rounded"></div>
          <div className="h-2.5 bg-border-tertiary w-2/3 rounded"></div>
        </div>
      </div>
    </div>
  );
}
