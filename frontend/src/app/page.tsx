"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTCREStore, Measurement, PatientRecord } from "../store/useTCREStore";
import { analyzeGlucose, generateHistoricalTimeline } from "../lib/api";
import { generatePredictions } from "../lib/predictionEngine";
import { validateTCREOutput } from "../lib/clinicalRuleValidator";
import PatientHeader from "../components/PatientHeader";
import InputControls from "../components/InputControls";
import GlucoseTrendChart from "../components/GlucoseTrendChart";
import MetricDashboard from "../components/MetricDashboard";
import LatentStatesGrid from "../components/LatentStatesGrid";
import CompositeStatePanel from "../components/CompositeStatePanel";
import StateTimeline from "../components/StateTimeline";
import TrajectoryPredictionPanel from "../components/TrajectoryPredictionPanel";
import DigitalTwinSimulator from "../components/DigitalTwinSimulator";
import ScenarioLoader from "../components/ScenarioLoader";
import RiskAssessment from "../components/RiskAssessment";
import PatentExplainabilityExplorer from "../components/PatentExplainabilityExplorer";
import PatientReasoningPathway from "../components/PatientReasoningPathway";
import RecommendationEngine from "../components/RecommendationEngine";
import ActionFooter from "../components/ActionFooter";
import CustomToaster from "../components/ui/custom-toaster";

// New Patient Management Layer imports
import PatientSelector from "../components/PatientSelector";
import PatientSummary from "../components/PatientSummary";
import MeasurementHistory from "../components/MeasurementHistory";
import PatientTimeline from "../components/PatientTimeline";
import { Users, ChevronDown, ChevronUp, AlertCircle, ShieldCheck, Activity, Heart, Shield, TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
import { groupMeasurementsToPatients } from "../lib/patientHelper";

export default function Home() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRawLogs, setShowRawLogs] = useState(false);

  const {
    patient,
    measurements,
    analysis,
    selectedWindow,
    timeline,
    isLoading,
    selectedPatientId,
    uploadedPatients,
    setPatient,
    addMeasurement,
    addMeasurements,
    setMeasurements,
    clearMeasurements,
    setAnalysis,
    setTimeline,
    setCrceReport,
    setSelectedWindow,
    setLoading,
    setError,
    showToast,
    fetchPatientsFromServer,
    uploadCsvMeasurements,
    addManualMeasurement,
  } = useTCREStore();

  // Load timeline and patients on client side mount to avoid SSR hydration mismatch
  useEffect(() => {
    fetchPatientsFromServer();

    if (typeof window !== 'undefined') {
      const persistedTimeline = localStorage.getItem('tcre_state_timeline');
      if (persistedTimeline) {
        try {
          setTimeline(JSON.parse(persistedTimeline));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [setTimeline, fetchPatientsFromServer]);

  // 2. Perform glycemic analysis whenever measurements or time window changes
  useEffect(() => {
    if (measurements.length > 0) {
      const triggerAnalysis = async () => {
        setLoading(true);
        try {
          const result = await analyzeGlucose(measurements, selectedWindow);
          setAnalysis(result);
          const timelineNodes = generateHistoricalTimeline(measurements);
          setTimeline(timelineNodes);

          // Generate predictions and run CRCE validation
          const predictions = generatePredictions(result);
          const report = validateTCREOutput(result, predictions, patient, measurements);
          setCrceReport(report);
        } catch (err: any) {
          setError(err.message || "Failed to analyze glucose data");
        } finally {
          setLoading(false);
        }
      };

      triggerAnalysis();
    }
  }, [measurements, selectedWindow, patient, setAnalysis, setTimeline, setCrceReport, setLoading, setError]);

  // 3. Filter measurements to the selected window for displaying on chart
  const filteredMeasurements = useMemo(() => {
    if (selectedWindow === null) return measurements;
    if (measurements.length === 0) return [];
    const sorted = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latestDate = new Date(sorted[sorted.length - 1].date);
    const cutoff = new Date(latestDate);
    cutoff.setDate(latestDate.getDate() - selectedWindow);
    return measurements.filter((m) => new Date(m.date) >= cutoff);
  }, [measurements, selectedWindow]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const result = await analyzeGlucose(measurements, selectedWindow);
      setAnalysis(result);
      const timelineNodes = generateHistoricalTimeline(measurements);
      setTimeline(timelineNodes);

      // Generate predictions and run CRCE validation
      const predictions = generatePredictions(result);
      const report = validateTCREOutput(result, predictions, patient, measurements);
      setCrceReport(report);
      showToast("Glycemic state analysis refreshed.", "success");
    } catch (err: any) {
      setError(err.message || "Refresh failed");
      showToast("Refresh analysis failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col font-sans">
      {/* Dynamic Header */}
      <PatientHeader
        patient={patient}
        analysis={analysis}
        selectedWindow={selectedWindow}
        onWindowChange={setSelectedWindow}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Main Container */}
      <main
        id="dashboard-content"
        className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6"
      >
        {/* Print-Only Report Header */}
        <div 
          id="print-report-header" 
          style={{ display: "none" }}
          className="w-full bg-bg-secondary border border-border-tertiary p-5 mb-4 rounded-lg text-center"
        >
          <h1 className="text-lg font-bold text-text-primary uppercase tracking-wider">
            Temporal Clinical Reasoning Engine (TCRE)
          </h1>
          <p className="text-xs text-text-secondary font-mono mt-1">
            Clinical Case Analysis Report &bull; System Version 2.0.0 (Patent Demonstration Copy)
          </p>
          <div className="grid grid-cols-4 gap-4 text-left border-t border-border-tertiary mt-4 pt-3 text-xs">
            <div>
              <span className="text-text-tertiary">Patient Name:</span>
              <strong className="block text-text-primary">{patient?.name}</strong>
            </div>
            <div>
              <span className="text-text-tertiary">Patient ID:</span>
              <strong className="block text-text-primary">{patient?.patientId}</strong>
            </div>
            <div>
              <span className="text-text-tertiary">Date of Birth:</span>
              <strong className="block text-text-primary">{patient?.dob} (Age {patient?.age})</strong>
            </div>
            <div>
              <span className="text-text-tertiary">Generated At:</span>
              <strong className="block text-text-primary font-mono" suppressHydrationWarning>
                {new Date().toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* Manual entry / CSV uploads */}
        <InputControls
          onMeasurementAdd={(m) => {
            addManualMeasurement(m.glucose, m.date);
          }}
          onCsvUpload={(newMeasurements) => {
            uploadCsvMeasurements(newMeasurements);
          }}
          isLoading={isLoading}
        />

        {/* Patient Selection Registry */}
        <PatientSelector />

        {!selectedPatientId ? (
          <div className="bg-bg-secondary border border-dashed border-border-tertiary rounded-lg p-10 text-center flex flex-col items-center justify-center gap-3">
            <div className="p-4 bg-text-info/10 rounded-full text-text-info animate-pulse">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Awaiting Patient Selection</h3>
            <p className="text-xs text-text-secondary max-w-md leading-relaxed">
              A clinical dataset has been uploaded. Please select a patient card from the registry above to initiate the TCRE reasoning analysis.
            </p>
          </div>
        ) : (
          <>
            {/* Section 1: Patient Overview */}
            <PatientSummary />

            {/* Section 2: Overall Health Status */}
            {analysis?.risk && (
              <div className="bg-bg-secondary border border-border-tertiary rounded-lg p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {analysis.risk.score <= 30 ? (
                      <span className="flex h-4 w-4 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                      </span>
                    ) : analysis.risk.score <= 60 ? (
                      <span className="flex h-4 w-4 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                      </span>
                    ) : analysis.risk.score <= 80 ? (
                      <span className="flex h-4 w-4 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                      </span>
                    ) : (
                      <span className="flex h-4 w-4 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-700"></span>
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl font-extrabold text-text-primary tracking-tight">
                        {analysis.risk.score <= 30 
                          ? "Stable Condition" 
                          : analysis.risk.score <= 60 
                            ? "Needs Attention" 
                            : analysis.risk.score <= 80 
                              ? "High Glycemic Risk" 
                              : "Critical Condition"}
                      </span>
                      <span className="text-xs text-text-secondary bg-bg-primary border border-border-tertiary px-2 py-0.5 rounded font-mono font-bold">
                        Score: {analysis.risk.score}/100
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
                      {analysis.risk.score <= 30 
                        ? "The patient's glucose levels have remained stable and within the recommended target ranges during this monitoring period." 
                        : analysis.risk.score <= 60 
                          ? "The patient's glycemic levels exhibit moderate variability and baseline deviation. Close monitoring is advised to prevent escalation." 
                          : analysis.risk.score <= 80 
                            ? "The patient's glucose data shows high variability with frequent hyper/hypoglycemic excursions. Therapeutic adjustment may be required." 
                            : "Critical glycemic instability and prolonged glucose burden detected. Immediate clinical intervention and review are recommended."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0 bg-bg-primary/50 border border-border-tertiary/60 px-4 py-3 rounded-lg text-xs">
                  <div className="text-text-tertiary">Engine Confidence:</div>
                  <div className="font-extrabold text-text-info text-sm">{analysis.risk.confidence}%</div>
                </div>
              </div>
            )}

            {/* Section 3: Key Findings */}
            {analysis?.metrics && (
              <div className="bg-bg-secondary border border-border-tertiary rounded-lg p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border-tertiary/60 pb-3">
                  <h2 className="text-base font-bold text-text-primary uppercase tracking-wider">Key Findings</h2>
                  <span className="text-xs text-text-secondary font-mono">Layman Summary</span>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    // Finding 1: Velocity
                    analysis.metrics.vi.raw > 50 
                      ? "Glucose levels show a rapid upward velocity." 
                      : analysis.metrics.vi.raw > 25 
                        ? "Glucose levels show moderate upward rate of change." 
                        : "Glucose velocity has remained within a safe, stable rate of change.",
                    // Finding 2: Volatility
                    analysis.metrics.vol.raw > 35 
                      ? "Large changes in glucose levels (high volatility) observed." 
                      : "Glycemic stability is good, with minimal day-to-day fluctuations.",
                    // Finding 3: Cumulative Burden
                    analysis.metrics.cbi.raw > 40 
                      ? "Glucose remained high for several consecutive measurements (elevated burden)." 
                      : "Cumulative metabolic burden is low, indicating minimal time spent in high glucose zones.",
                    // Finding 4: Baseline Deviation
                    analysis.metrics.bdi.raw > 40 
                      ? "Average readings deviate significantly from the patient's personal target baseline." 
                      : "Average readings are well-aligned with the target baseline range."
                  ].map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-text-secondary leading-relaxed bg-bg-primary/45 border border-border-tertiary/30 p-3.5 rounded-lg">
                      <span className="text-text-success font-black mt-0.5">✓</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section 4: Measurements & Trends */}
            <div className="bg-bg-secondary border border-border-tertiary rounded-lg p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border-tertiary/60 pb-3">
                <h2 className="text-base font-bold text-text-primary uppercase tracking-wider">Glucose Overview</h2>
                <span className="text-xs text-text-secondary font-mono">Interactive Chart</span>
              </div>
              <GlucoseTrendChart measurements={filteredMeasurements} isLoading={isLoading} />
            </div>

            {/* Section 5: Recommended Actions */}
            <RecommendationEngine recommendations={analysis?.recommendations || null} isLoading={isLoading} />

            {/* Section 6: Supporting Evidence */}
            {analysis?.risk && (
              <div className="bg-bg-secondary border border-border-tertiary rounded-lg p-6 shadow-sm space-y-6">
                <div className="flex flex-col gap-1 border-b border-border-tertiary/60 pb-3">
                  <h2 className="text-base font-bold text-text-primary uppercase tracking-wider">Supporting Evidence</h2>
                  <p className="text-xs text-text-secondary">
                    Biological factors and event timelines supporting the glycemic evaluation.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* What is Increasing Risk */}
                  <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5 flex flex-col gap-3 shadow-xs">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-wide border-b border-border-tertiary/40 pb-2">
                      <TrendingUp className="w-4 h-4 text-text-danger" />
                      What Is Increasing Risk?
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.risk.amplifiers?.map((amp, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-text-danger/10 text-text-danger border border-text-danger/25 rounded-full text-xs font-semibold">
                          ⚡ {amp}
                        </span>
                      ))}
                      {(!analysis.risk.amplifiers || analysis.risk.amplifiers.length === 0) && (
                        <span className="text-xs text-text-tertiary">No worsening risk factors identified.</span>
                      )}
                    </div>
                  </div>

                  {/* What is Helping Recovery */}
                  <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5 flex flex-col gap-3 shadow-xs">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-wide border-b border-border-tertiary/40 pb-2">
                      <TrendingDown className="w-4 h-4 text-text-success" />
                      What Is Helping Recovery?
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.risk.reducers?.map((red, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-text-success/10 text-text-success border border-text-success/25 rounded-full text-xs font-semibold">
                          🛡️ {red}
                        </span>
                      ))}
                      {(!analysis.risk.reducers || analysis.risk.reducers.length === 0) && (
                        <span className="text-xs text-text-tertiary">No mitigating safety factors identified.</span>
                      )}
                    </div>
                  </div>

                  {/* Glycemic Trend */}
                  <div className="bg-bg-primary border border-border-tertiary rounded-lg p-5 flex flex-col gap-3 shadow-xs justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-wide border-b border-border-tertiary/40 pb-2">
                        <Activity className="w-4 h-4 text-text-info" />
                        Observed Trend
                      </h3>
                      <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                        The glycemic trend shows dynamic rate of changes and deviations over the active monitoring period.
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-text-tertiary font-bold">Trend Status:</span>
                      <span className="text-xs font-black uppercase text-text-info bg-text-info/10 px-3 py-1 rounded-full border border-text-info/20">
                        {analysis.risk.trend}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Collapsible raw timeline logs */}
                <div className="border border-border-tertiary rounded-lg p-5 bg-bg-primary/30">
                  <button
                    onClick={() => setShowRawLogs(!showRawLogs)}
                    className="w-full flex justify-between items-center text-sm font-bold text-text-primary uppercase tracking-wide focus:outline-hidden"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-text-secondary" />
                      Show Raw Readings & Event Logs
                    </span>
                    {showRawLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showRawLogs && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5 pt-5 border-t border-border-tertiary animate-in slide-in-from-top-3 duration-300">
                      <MeasurementHistory />
                      <PatientTimeline />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 7: Advanced Analysis */}
            <div className="border border-border-tertiary rounded-lg bg-bg-secondary p-6 shadow-sm mt-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                    Advanced Technical Analysis
                  </h2>
                  <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
                    Inspect underlying mathematical index layers, latent state space matrices, rules validation, and patent explainability figures.
                  </p>
                </div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="px-5 py-2.5 bg-text-info hover:bg-text-info/90 text-white text-xs font-extrabold uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer focus:outline-hidden"
                >
                  {showAdvanced ? (
                    <>Hide Technical Details <ChevronUp className="w-4.5 h-4.5" /></>
                  ) : (
                    <>Show Technical Details <ChevronDown className="w-4.5 h-4.5" /></>
                  )}
                </button>
              </div>
              {showAdvanced && (
                <div className="flex flex-col gap-8 mt-6 pt-6 border-t border-border-tertiary/60 animate-in fade-in duration-300">
                  <ScenarioLoader />
                  <RiskAssessment risk={analysis?.risk || null} isLoading={isLoading} />
                  <MetricDashboard metrics={analysis?.metrics || null} isLoading={isLoading} />
                  <LatentStatesGrid states={analysis?.states || null} isLoading={isLoading} />
                  <CompositeStatePanel compositeState={analysis?.compositeState || null} isLoading={isLoading} />
                  <StateTimeline timeline={timeline} isLoading={isLoading} />
                  <TrajectoryPredictionPanel analysis={analysis} isLoading={isLoading} />
                  <DigitalTwinSimulator analysis={analysis} isLoading={isLoading} />
                  <PatientReasoningPathway analysis={analysis} isLoading={isLoading} />
                  <PatentExplainabilityExplorer />
                </div>
              )}
            </div>

            {/* Bottom Actions: Export Report, Details, Settings */}
            <ActionFooter patient={patient} analysis={analysis} />
          </>
        )}
      </main>

      {/* Toast Alert Popups */}
      <CustomToaster />
    </div>
  );
}
