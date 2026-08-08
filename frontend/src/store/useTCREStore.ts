import { create } from 'zustand';
import { CRCEValidationReport } from '../lib/clinicalRuleValidator';

export interface PatientRecord {
  name: string;
  dob: string;
  age: number;
  patientId: string;
  sex?: string;
}

export interface Measurement {
  date: string; // ISO date string or YYYY-MM-DD
  glucose: number; // mg/dL
  source: 'manual' | 'csv_upload' | 'system';
  medication?: string;
  intervention?: string;
  consumedSugarLast6Hours?: 'YES' | 'NO';
}

export interface PatientData {
  patientId: string;
  name: string;
  age: number;
  sex: string;
  measurements: Measurement[];
  firstMeasurementDate: string;
  latestMeasurementDate: string;
  latestGlucose: number;
  sugarYesCount: number;
  sugarNoCount: number;
}

export interface MetricDetail {
  raw: number;
  normalized: number;
  confidence: number;
  trend: 'up' | 'down' | 'flat';
}

export interface MetricsOutput {
  vi: MetricDetail;
  ai: MetricDetail;
  vol: MetricDetail;
  bdi: MetricDetail;
  cbi: MetricDetail;
  sci: MetricDetail;
}

export interface LatentStateContribution {
  name: string;
  value: number;
}

export interface LatentStateGate {
  name: string;
  met: boolean;
}

export interface LatentStateDetail {
  score: number;
  confidence: number;
  severity: 'Normal' | 'Moderate' | 'High' | 'Severe' | 'Low Confidence' | 'Moderate Confidence' | 'High Confidence' | 'Very High Confidence';
  status: string; // Lifecycle Status (Emerging, Active, Escalating, Stable, Decaying, Resolved)
  evidence: string[];
  contributions: LatentStateContribution[];
  gates: LatentStateGate[];
  limitingFactors: string[];
  reasoningTree: string[];
  reasoningNarrative: string;
  // Standardized Audit Pipeline Fields (Optional for backward compatibility with predictions/twin simulations)
  clinicalInputs?: { name: string; value: string | number }[];
  intermediateCalculations?: { name: string; value: string | number }[];
  rawScore?: number;
  activationGates?: { name: string; met: boolean }[];
  persistenceGates?: { name: string; met: boolean }[];
  confidenceAdjustment?: string;
  finalScore?: number;
}

export interface LatentStatesOutput {
  sd: LatentStateDetail;
  fr: LatentStateDetail;
  cb: LatentStateDetail;
  hv: LatentStateDetail;
  rd?: LatentStateDetail;
  tc?: LatentStateDetail;
  tnr?: LatentStateDetail;
  sc?: LatentStateDetail;
}

export interface RecommendationDetail {
  type: 'URGENT' | 'PRIMARY' | 'SECONDARY' | 'SUPPORTING';
  title: string;
  confidence: 'Low' | 'Moderate' | 'High' | 'Very High';
  benefit: string;
  source: string;
  activatedLatentState?: string;
  activatedCompositeState?: string;
  dominantMetric?: string;
  physiologicalEffect?: string;
}

export interface CompositeStateOutput {
  name: string;
  score: number;
  confidence: number;
  severity: 'Normal' | 'Moderate' | 'High' | 'Severe';
  status: 'Inactive' | 'Candidate' | 'Emerging' | 'Active' | 'Escalating' | 'Stable' | 'Decaying' | 'Resolved';
  contributingStates: { name: string; score: number }[];
  interactionStrength: number;
  persistenceDays: number;
  reasoningNarrative: string;
  gates: LatentStateGate[];
}

export interface RiskOutput {
  score: number;
  confidence: number;
  tier: 'Minimal' | 'Low' | 'Moderate' | 'High' | 'Critical';
  trend: string;
  drivers: string[];
  amplifiers: string[];
  reducers: string[];
}

export interface ExplainabilityOutput {
  summary: string;
  drivers: string[];
  limitations: string[];
}

export interface ReasoningConfidence {
  stateConfidence: number;
  compositeConfidence: number;
  riskConfidence: number;
  recommendationConfidence: number;
}

export interface ConsistencyCheckNode {
  status: 'PASS' | 'WARNING' | 'FAIL';
  name: string;
  message: string;
}

export interface ConsistencyValidationReport {
  overallPassed: boolean;
  checks: {
    stateCheck: ConsistencyCheckNode;
    compositeCheck: ConsistencyCheckNode;
    riskCheck: ConsistencyCheckNode;
    recommendationCheck: ConsistencyCheckNode;
  };
  warnings: string[];
}

export interface TimelineNode {
  day: number;
  date: string;
  states: string[];
  description: string;
}

export interface AnalysisResult {
  window: {
    measurementCount: number;
    totalDays: number;
    dataQuality: 'high' | 'moderate' | 'low';
  };
  metrics: MetricsOutput;
  states: LatentStatesOutput;
  compositeState: CompositeStateOutput;
  risk: RiskOutput;
  explainability: ExplainabilityOutput;
  recommendations: RecommendationDetail[];
  reasoningConfidence: ReasoningConfidence;
  consistencyReport: ConsistencyValidationReport;
}

export interface StressTestSummary {
  scenariosPassed: number;
  averageCompliance: number;
  averageConfidence: number;
  averageRuntimeMs: number;
  totalWarnings: number;
  totalErrors: number;
  patentReady: 'YES' | 'NO';
}

interface TCREStore {
  // Data
  patient: PatientRecord | null;
  measurements: Measurement[];
  analysis: AnalysisResult | null;
  timeline: TimelineNode[];
  crceReport: CRCEValidationReport | null;
  stressTestSummary: StressTestSummary | null;
  
  // Multi-patient Data
  uploadedPatients: PatientData[];
  selectedPatientId: string | null;
  
  // UI
  selectedWindow: number | null; // number of days (7, 14, 30, 90) or null (All)
  isLoading: boolean;
  error: string | null;
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  
  // Preferences
  units: 'mg/dL' | 'mmol/L';
  targetMin: number;
  targetMax: number;
  
  // Actions
  setPatient: (patient: PatientRecord) => void;
  addMeasurement: (measurement: Measurement) => void;
  addMeasurements: (measurements: Measurement[]) => void;
  setMeasurements: (measurements: Measurement[]) => void;
  clearMeasurements: () => void;
  setAnalysis: (analysis: AnalysisResult | null) => void;
  setTimeline: (timeline: TimelineNode[]) => void;
  setCrceReport: (report: CRCEValidationReport | null) => void;
  setStressTestSummary: (summary: StressTestSummary | null) => void;
  runStressTest: () => void;
  setSelectedWindow: (days: number | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setUnits: (units: 'mg/dL' | 'mmol/L') => void;
  setTargetRange: (min: number, max: number) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  activeExplainabilityTab: string;
  setActiveExplainabilityTab: (tab: string) => void;
  selectedExplainabilityMetric: string;
  setSelectedExplainabilityMetric: (metric: string) => void;
  selectedExplainabilityState: string;
  setSelectedExplainabilityState: (state: string) => void;
  setUploadedPatients: (patients: PatientData[]) => void;
  setSelectedPatientId: (id: string | null) => void;
  selectPatient: (patientId: string) => void;
  fetchPatientsFromServer: () => Promise<void>;
  uploadMeasurementsToServer: (measurements: any[]) => Promise<void>;
  uploadCsvMeasurements: (newMeasurements: any[]) => Promise<void>;
  addManualMeasurement: (glucose: number, date: string) => Promise<void>;
  deletePatientFromServer: (patientId: string) => Promise<void>;
  deleteMeasurementFromServer: (patientId: string, date: string) => Promise<void>;
}

const generateInitialMockGlucose = (days: number): Measurement[] => {
  const data: Measurement[] = [];
  // Use a fixed start date so build time (SSR) and client run time match exactly
  const start = new Date("2026-06-30T00:00:00.000Z");

  const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i <= days; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dateStr = currentDate.toISOString().split("T")[0];

    const trendOffset = i * 2.2;
    const volatilityOffset = Math.sin(i * 1.5) * 25;

    // Use deterministic inputs based on i
    const rand1 = pseudoRandom(i * 3 + 1);
    const rand2 = pseudoRandom(i * 3 + 2);
    const rand3 = pseudoRandom(i * 3 + 3);

    data.push({
      date: `${dateStr}T08:00:00.000Z`,
      glucose: Math.floor(95 + trendOffset + volatilityOffset + rand1 * 20),
      source: "system",
      consumedSugarLast6Hours: rand1 > 0.7 ? "YES" : "NO",
    });

    data.push({
      date: `${dateStr}T13:00:00.000Z`,
      glucose: Math.floor(130 + trendOffset - volatilityOffset + rand2 * 30),
      source: "system",
      consumedSugarLast6Hours: rand2 > 0.5 ? "YES" : "NO",
    });

    data.push({
      date: `${dateStr}T20:00:00.000Z`,
      glucose: Math.floor(110 + trendOffset + volatilityOffset * 0.5 + rand3 * 25),
      source: "system",
      consumedSugarLast6Hours: rand3 > 0.6 ? "YES" : "NO",
    });
  }
  return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const initialMockGlucose = generateInitialMockGlucose(30);

const DEFAULT_PATIENT: PatientRecord = {
  name: "Evelyn Harper",
  dob: "1972-04-12",
  age: 54,
  patientId: "P-88291",
  sex: "Female",
};

const initialPatientData: PatientData = {
  patientId: "P-88291",
  name: "Evelyn Harper",
  age: 54,
  sex: "Female",
  measurements: initialMockGlucose,
  firstMeasurementDate: initialMockGlucose[0].date,
  latestMeasurementDate: initialMockGlucose[initialMockGlucose.length - 1].date,
  latestGlucose: initialMockGlucose[initialMockGlucose.length - 1].glucose,
  sugarYesCount: initialMockGlucose.filter(m => m.consumedSugarLast6Hours === "YES").length,
  sugarNoCount: initialMockGlucose.filter(m => m.consumedSugarLast6Hours === "NO").length,
};

export const useTCREStore = create<TCREStore>((set, get) => ({
  patient: DEFAULT_PATIENT,
  measurements: initialMockGlucose,
  analysis: null,
  timeline: [],
  crceReport: null,
  stressTestSummary: null,
  uploadedPatients: [initialPatientData],
  selectedPatientId: "P-88291",
  selectedWindow: 30,
  isLoading: false,
  error: null,
  toasts: [],
  units: 'mg/dL',
  targetMin: 70,
  targetMax: 130,
  activeExplainabilityTab: 'metrics',
  selectedExplainabilityMetric: 'cbi',
  selectedExplainabilityState: 'sd',
  
  setUploadedPatients: (uploadedPatients) => set({ uploadedPatients }),
  setSelectedPatientId: (selectedPatientId) => set({ selectedPatientId }),
  selectPatient: (patientId) => {
    const patients = get().uploadedPatients;
    const selected = patients.find(p => p.patientId === patientId);
    if (selected) {
      set({
        patient: {
          name: selected.name,
          dob: "",
          age: selected.age,
          patientId: selected.patientId,
          sex: selected.sex,
        },
        measurements: selected.measurements,
        selectedPatientId: patientId,
        analysis: null,
        crceReport: null,
      });
    } else {
      set({
        patient: null,
        measurements: [],
        selectedPatientId: null,
        analysis: null,
        crceReport: null,
      });
    }
  },
  
  setActiveExplainabilityTab: (tab) => set({ activeExplainabilityTab: tab }),
  setSelectedExplainabilityMetric: (metric) => set({ selectedExplainabilityMetric: metric }),
  setSelectedExplainabilityState: (state) => set({ selectedExplainabilityState: state }),
  
  setPatient: (patient) => set({ patient }),
  addMeasurement: (measurement) => set((state) => {
    const updated = [...state.measurements, measurement].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return { measurements: updated };
  }),
  addMeasurements: (measurements) => set((state) => {
    const updated = [...state.measurements, ...measurements].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return { measurements: updated };
  }),
  setMeasurements: (measurements) => set({
    measurements: [...measurements].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }),
  clearMeasurements: () => set({ measurements: [] }),
  setAnalysis: (analysis) => set({ analysis }),
  setCrceReport: (crceReport) => set({ crceReport }),
  setStressTestSummary: (stressTestSummary) => set({ stressTestSummary }),
  runStressTest: () => {
    set({ isLoading: true });
    setTimeout(async () => {
      try {
        const { SCENARIOS, generateScenarioData } = await import('../lib/scenarioData');
        const { generateLocalAnalysis } = await import('../lib/api');
        const { generatePredictions } = await import('../lib/predictionEngine');
        const { validateTCREOutput } = await import('../lib/clinicalRuleValidator');

        let passedCount = 0;
        let totalCompliance = 0;
        let totalConfidence = 0;
        let totalRuntime = 0;
        let totalWarningsCount = 0;
        let totalErrorsCount = 0;

        SCENARIOS.forEach(sc => {
          const telemetry = generateScenarioData(sc.id);
          const patientRec = {
            name: sc.patientName,
            age: parseInt(sc.dob.split("-")[0]) ? (new Date().getFullYear() - parseInt(sc.dob.split("-")[0])) : 50,
            dob: sc.dob,
            patientId: sc.patientId
          };

          const start = performance.now();
          const localAnalysis = generateLocalAnalysis(telemetry, 30);
          const predictions = generatePredictions(localAnalysis);
          const report = validateTCREOutput(localAnalysis, predictions, patientRec, telemetry);
          const end = performance.now();

          const runtime = end - start;
          totalRuntime += runtime;

          if (report.overallStatus !== 'FAIL') {
            passedCount++;
          }
          totalCompliance += report.overallCompliance;

          const confValues = [
            localAnalysis.reasoningConfidence.stateConfidence,
            localAnalysis.reasoningConfidence.compositeConfidence,
            localAnalysis.reasoningConfidence.riskConfidence,
            localAnalysis.reasoningConfidence.recommendationConfidence
          ];
          const avgConf = confValues.reduce((a, b) => a + b, 0) / confValues.length;
          totalConfidence += avgConf;

          totalWarningsCount += report.warnings.length;
          totalErrorsCount += report.errors.length;
        });

        const count = SCENARIOS.length;
        const averageCompliance = Math.round(totalCompliance / count);
        const averageConfidence = Math.round(totalConfidence / count);
        const averageRuntimeMs = Math.round((totalRuntime / count) * 100) / 100;

        const summary = {
          scenariosPassed: passedCount,
          averageCompliance,
          averageConfidence,
          averageRuntimeMs,
          totalWarnings: totalWarningsCount,
          totalErrors: totalErrorsCount,
          patentReady: (averageCompliance >= 95 && passedCount === count) ? ('YES' as const) : ('NO' as const)
        };

        set({
          stressTestSummary: summary,
          isLoading: false
        });
        get().showToast(`Stress test: ${passedCount}/${count} passed. Avg compliance: ${averageCompliance}%.`, "success");
      } catch (err: any) {
        set({ isLoading: false });
        get().showToast(`Stress test failed: ${err.message || err}`, "error");
      }
    }, 100);
  },
  setTimeline: (timeline) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tcre_state_timeline', JSON.stringify(timeline));
    }
    set({ timeline });
  },
  setSelectedWindow: (days) => set({ selectedWindow: days }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setUnits: (units) => set({ units }),
  setTargetRange: (min, max) => set({ targetMin: min, targetMax: max }),
  showToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      get().dismissToast(id);
    }, 4000);
  },
  dismissToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),
  fetchPatientsFromServer: async () => {
    try {
      const res = await fetch("/api/patients");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.patients) {
          set({ uploadedPatients: data.patients });
          
          // Re-sync currently selected patient's measurements if a selection is active
          const currentId = get().selectedPatientId;
          if (currentId) {
            const selected = data.patients.find((p: any) => p.patientId === currentId);
            if (selected) {
              set({
                patient: {
                  name: selected.name,
                  dob: "",
                  age: selected.age,
                  patientId: selected.patientId,
                  sex: selected.sex,
                },
                measurements: selected.measurements,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch patients from server:", err);
    }
  },
  uploadMeasurementsToServer: async (measurements) => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(measurements),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          get().showToast(
            `Measurements processed: ${data.measurementsAdded} added, ${data.duplicatesIgnored} duplicates ignored.`,
            "success"
          );
          await get().fetchPatientsFromServer();
        } else {
          get().showToast(`Upload failed: ${data.error}`, "error");
        }
      } else {
        get().showToast("Network error uploading measurements.", "error");
      }
    } catch (err: any) {
      get().showToast(`Upload failed: ${err.message || err}`, "error");
    } finally {
      set({ isLoading: false });
    }
  },
  uploadCsvMeasurements: async (newMeasurements) => {
    if (newMeasurements.length === 0) return;
    
    // Check if it is multi-patient or single-patient
    const isMulti = (newMeasurements[0] as any).patientId || (newMeasurements[0] as any).PatientID;
    
    if (isMulti) {
      // It has patient info already, send directly
      await get().uploadMeasurementsToServer(newMeasurements);
    } else {
      // It is single-patient, attach current patient details
      const currentPatient = get().patient;
      if (!currentPatient) {
        get().showToast("Select a patient first to import single-patient CSV data.", "error");
        return;
      }
      
      const mapped = newMeasurements.map(m => ({
        patientId: currentPatient.patientId,
        name: currentPatient.name,
        age: currentPatient.age,
        sex: currentPatient.sex || "Unknown",
        date: m.date,
        glucose: m.glucose,
        source: "csv_upload",
        consumedSugarLast6Hours: m.consumedSugarLast6Hours || "NO"
      }));
      
      await get().uploadMeasurementsToServer(mapped);
    }
  },
  addManualMeasurement: async (glucose, date) => {
    const currentPatient = get().patient;
    if (!currentPatient) {
      get().showToast("No active patient selected for manual entry.", "error");
      return;
    }
    const measurement = {
      patientId: currentPatient.patientId,
      name: currentPatient.name,
      age: currentPatient.age,
      sex: currentPatient.sex || "Unknown",
      date: `${date}T12:00:00.000Z`,
      glucose,
      source: "manual",
      consumedSugarLast6Hours: "NO"
    };
    await get().uploadMeasurementsToServer([measurement]);
  },
  deletePatientFromServer: async (patientId: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/patients?patientId=${patientId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          get().showToast("Patient records deleted successfully.", "success");
          set({ uploadedPatients: data.patients });
          if (get().selectedPatientId === patientId) {
            // Unselect patient
            set({
              patient: null,
              measurements: [],
              selectedPatientId: null,
              analysis: null,
              crceReport: null,
            });
          }
        } else {
          get().showToast(`Failed to delete patient: ${data.error}`, "error");
        }
      } else {
        get().showToast("Network error deleting patient.", "error");
      }
    } catch (err: any) {
      get().showToast(`Delete failed: ${err.message || err}`, "error");
    } finally {
      set({ isLoading: false });
    }
  },
  deleteMeasurementFromServer: async (patientId: string, date: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/patients?patientId=${patientId}&date=${encodeURIComponent(date)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          get().showToast("Measurement record deleted.", "success");
          set({ uploadedPatients: data.patients });
          
          // Re-sync current patient measurements
          const currentId = get().selectedPatientId;
          if (currentId === patientId) {
            const selected = data.patients.find((p: any) => p.patientId === patientId);
            if (selected) {
              set({
                patient: {
                  name: selected.name,
                  dob: "",
                  age: selected.age,
                  patientId: selected.patientId,
                  sex: selected.sex,
                },
                measurements: selected.measurements,
              });
            } else {
              set({
                patient: null,
                measurements: [],
                selectedPatientId: null,
                analysis: null,
                crceReport: null,
              });
            }
          }
        } else {
          get().showToast(`Failed to delete measurement: ${data.error}`, "error");
        }
      } else {
        get().showToast("Network error deleting measurement.", "error");
      }
    } catch (err: any) {
      get().showToast(`Delete failed: ${err.message || err}`, "error");
    } finally {
      set({ isLoading: false });
    }
  },
}));
