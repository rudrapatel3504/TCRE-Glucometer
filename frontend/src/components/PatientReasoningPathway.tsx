"use client";

import React from "react";
import { AnalysisResult } from "../store/useTCREStore";
import { ArrowDown, GitCommit } from "lucide-react";

interface PatientReasoningPathwayProps {
  analysis: AnalysisResult | null;
  isLoading: boolean;
}

export default function PatientReasoningPathway({ analysis, isLoading }: PatientReasoningPathwayProps) {
  if (isLoading || !analysis) {
    return (
      <section className="bg-bg-secondary rounded-lg p-5 border border-border-tertiary h-48 flex items-center justify-center">
        <span className="text-xs text-text-tertiary animate-pulse">Constructing patient reasoning pathway...</span>
      </section>
    );
  }

  const { window, metrics, states, compositeState, risk, recommendations } = analysis;

  // Active latent states helper
  const activeLatentStates = Object.entries(states)
    .map(([key, state]) => ({
      key,
      name: key === 'sd' ? 'Silent Deterioration' :
            key === 'fr' ? 'False Recovery' :
            key === 'cb' ? 'Chronic Burden' :
            key === 'hv' ? 'High Variability' :
            key === 'rd' ? 'Recovery Deceleration' :
            key === 'tc' ? 'Threshold Convergence' :
            key === 'tnr' ? 'Treatment Non-Responsiveness' :
            key === 'sc' ? 'State Confidence' : 'Latent State',
      score: state.score,
      status: state.status
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <section id="patient-reasoning-pathway" className="bg-bg-secondary rounded-lg p-5 border border-border-tertiary flex flex-col gap-4 shadow-sm w-full">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-text-info" />
          Patient Reasoning Pathway (Patent Figure 4.1)
        </h2>
        <p className="text-[11px] text-text-secondary">
          High-fidelity clinical visualization tracing glycemic telemetry propagation through index layers, latent state space, composite coupling, risk synthesis, and downstream recommendations.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-4 bg-bg-primary/40 rounded-lg border border-border-tertiary/60 p-4 space-y-4">
        
        {/* Layer 1: Measurements */}
        <div className="w-full max-w-xl bg-bg-secondary border border-border-tertiary rounded-lg p-3 flex items-center justify-between shadow-xs hover:border-text-info/50 transition">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded bg-blue-500/10 text-blue-500 text-xs font-bold font-mono">L1</span>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Glucose Telemetry Inputs</h4>
              <p className="text-xs font-semibold text-text-primary mt-0.5">
                {window.measurementCount} Blood Glucose Readings
              </p>
            </div>
          </div>
          <div className="text-right text-[10px] text-text-tertiary font-mono">
            <span>Period: {window.totalDays} Days</span>
            <span className="mx-1.5">|</span>
            <span className="uppercase text-text-success font-bold">Quality: {window.dataQuality}</span>
          </div>
        </div>

        <ArrowDown className="w-4 h-4 text-text-tertiary" />

        {/* Layer 2: Metric Engines */}
        <div className="w-full max-w-xl bg-bg-secondary border border-border-tertiary rounded-lg p-3 shadow-xs hover:border-text-info/50 transition">
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="p-1.5 rounded bg-purple-500/10 text-purple-500 text-xs font-bold font-mono">L2</span>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Metric Index Engines</h4>
              <p className="text-[10px] text-text-tertiary mt-0.5">Normalized mathematical indices evaluated via sub-window baseline deviations</p>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { label: 'VOL', val: metrics.vol.raw, name: 'Volatility' },
              { label: 'CBI', val: metrics.cbi.raw, name: 'Cumulative Burden' },
              { label: 'BDI', val: metrics.bdi.raw, name: 'Baseline Dev' },
              { label: 'VI', val: metrics.vi.raw, name: 'Velocity' },
              { label: 'AI', val: metrics.ai.raw, name: 'Acceleration' },
              { label: 'SCI', val: metrics.sci.raw, name: 'Confidence' }
            ].map((m, idx) => (
              <div key={idx} className="bg-bg-primary/60 border border-border-tertiary/80 rounded p-1.5 text-center flex flex-col justify-center">
                <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">{m.label}</span>
                <span className="text-xs font-extrabold font-mono text-text-primary mt-0.5">{m.val}</span>
              </div>
            ))}
          </div>
        </div>

        <ArrowDown className="w-4 h-4 text-text-tertiary" />

        {/* Layer 3: Latent Clinical States */}
        <div className="w-full max-w-xl bg-bg-secondary border border-border-tertiary rounded-lg p-3 shadow-xs hover:border-text-info/50 transition">
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="p-1.5 rounded bg-indigo-500/10 text-indigo-500 text-xs font-bold font-mono">L3</span>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Latent Clinical State Inferences</h4>
              <p className="text-[10px] text-text-tertiary mt-0.5">Decoupled state probabilities and activation gates</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {activeLatentStates.map((state, idx) => (
              <div key={idx} className="bg-bg-primary/60 border border-border-tertiary rounded p-1.5 flex flex-col justify-between items-center text-center">
                <span className="text-[9px] font-bold text-text-secondary uppercase truncate w-full">{state.name}</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs font-extrabold font-mono text-text-primary">{state.score}</span>
                  <span className={`text-[8px] font-bold px-1 rounded-sm uppercase ${
                    state.status === 'Escalating' || state.status === 'Active' ? 'bg-red-500/10 text-red-500' : 'bg-text-success/10 text-text-success'
                  }`}>{state.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ArrowDown className="w-4 h-4 text-text-tertiary" />

        {/* Layer 4: Composite States */}
        <div className="w-full max-w-xl bg-bg-secondary border border-border-tertiary rounded-lg p-3 flex items-center justify-between shadow-xs hover:border-text-info/50 transition">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded bg-amber-500/10 text-amber-500 text-xs font-bold font-mono">L4</span>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Composite Synthesis Formation</h4>
              <p className="text-xs font-semibold text-text-primary mt-0.5">
                {compositeState.name} ({compositeState.status !== 'Inactive' ? 'Active coupling detected' : 'Low coupling'})
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold border ${
              compositeState.status === 'Escalating' || compositeState.status === 'Active' 
                ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                : 'bg-bg-tertiary text-text-secondary border-border-tertiary'
            }`}>
              SCORE: {compositeState.score}
            </span>
          </div>
        </div>

        <ArrowDown className="w-4 h-4 text-text-tertiary" />

        {/* Layer 5: Risk Engine */}
        <div className="w-full max-w-xl bg-bg-secondary border border-border-tertiary rounded-lg p-3 flex items-center justify-between shadow-xs hover:border-text-info/50 transition">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded bg-rose-500/10 text-rose-500 text-xs font-bold font-mono">L5</span>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Risk Synthesis Output</h4>
              <p className="text-xs font-semibold text-text-primary mt-0.5">
                Metabolic Risk: {risk.score}/100 ({risk.tier} Tier)
              </p>
            </div>
          </div>
          <div className="text-right text-[10px] text-text-secondary font-mono">
            <span>Trend: {risk.trend}</span>
          </div>
        </div>

        <ArrowDown className="w-4 h-4 text-text-tertiary" />

        {/* Layer 6: Recommendation Engine */}
        <div className="w-full max-w-xl bg-bg-secondary border border-border-tertiary rounded-lg p-3 shadow-xs hover:border-text-info/50 transition">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-1.5 rounded bg-emerald-500/10 text-emerald-500 text-xs font-bold font-mono">L6</span>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Downstream Recommendation</h4>
              <p className="text-[10px] text-text-tertiary mt-0.5">Actionable outputs computed by the TCARE engine</p>
            </div>
          </div>
          {recommendations && recommendations.length > 0 ? (
            <div className="bg-bg-primary/60 border border-border-border rounded p-2 flex justify-between items-center text-xs border border-border-tertiary">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-text-success tracking-wider">
                  {recommendations[0].type} RECOMMENDATION
                </span>
                <span className="font-semibold text-text-primary mt-0.5">{recommendations[0].title}</span>
              </div>
              <span className="text-[10px] font-mono text-text-tertiary">Source: {recommendations[0].source}</span>
            </div>
          ) : (
            <p className="text-xs text-text-tertiary italic">No active recommendations generated.</p>
          )}
        </div>

      </div>
    </section>
  );
}
