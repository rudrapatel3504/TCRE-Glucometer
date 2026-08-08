export interface PatientRecord {
  name: string;
  dob: string;
  age: number;
  patientId: string;
  sex?: string;
}

export interface Measurement {
  date: string;
  glucose: number;
  source: 'manual' | 'csv_upload' | 'system';
  medication?: string;
  intervention?: string;
  consumedSugarLast6Hours?: 'YES' | 'NO';
  patientId?: string;
  name?: string;
  age?: number;
  sex?: string;
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

export interface ImportLog {
  importDate: string;
  importTime: string;
  deviceName: string;
  measurementsImported: number;
  duplicatesIgnored: number;
  importDuration: string;
}

export interface DeviceStatus {
  connected: boolean;
  model: string;
  firmware: string;
  recordCount: number;
  capacity: number;
  status: string; // "Idle", "Connecting", "Reading EEPROM", "Converting", "Uploading", "Completed", "Error"
  progress: number; // 0 to 100
  error: string | null;
  importRequested: boolean;
  lastTriggerTime?: string;
  patientsAdded?: number;
  measurementsAdded?: number;
  duplicatesIgnored?: number;
  databaseUpdated?: boolean;
  arduinoCleared?: boolean;
  clearFailed?: boolean;
  importTime?: string;
  importDuration?: string;
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

export interface CRCEValidationNode {
  status: 'PASS' | 'WARNING' | 'FAIL';
  compliance: number;
  reason: string;
  errors: string[];
  warnings: string[];
}

export interface CRCEAuditEntry {
  timestamp: string;
  module: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  reason: string;
  durationMs: number;
}

export interface CRCEValidationReport {
  overallStatus: 'PASS' | 'WARNING' | 'FAIL';
  overallCompliance: number;
  validationResults: {
    metrics: CRCEValidationNode;
    latents: CRCEValidationNode;
    composites: CRCEValidationNode;
    risk: CRCEValidationNode;
    recommendations: CRCEValidationNode;
    predictions: CRCEValidationNode;
    digitalTwin: CRCEValidationNode;
    explainability: CRCEValidationNode;
  };
  warnings: { module: string; message: string; observed?: any; expected?: any; fix?: string }[];
  errors: { module: string; message: string; observed?: any; expected?: any; fix?: string }[];
  auditLog: CRCEAuditEntry[];
}

export interface TrajectoryPathway {
  id: string;
  name: string;
  probability: number;
  estimatedTime: string;
  outcome: string;
  description: string;
  predictedStates: {
    sd: { score: number; severity: string };
    fr: { score: number; severity: string };
    cb: { score: number; severity: string };
    hv: { score: number; severity: string };
  };
  predictedComposite: {
    name?: string;
    score: number;
    status: string;
    severity: string;
  };
  predictedRisk: {
    score: number;
    tier: string;
  };
  predictedRecommendations: RecommendationDetail[];
  reasoning?: string[];
}

export interface RecommendationForecast {
  timeframe: string;
  title: string;
  confidence: number;
  benefit: string;
}

export interface TwinScenario {
  id: string;
  name: string;
  description: string;
  predictedStates: {
    sd: { score: number; prevScore: number };
    fr: { score: number; prevScore: number };
    cb: { score: number; prevScore: number };
    hv: { score: number; prevScore: number };
  };
  predictedComposite: {
    name?: string;
    prevName?: string;
    score: number;
    prevScore: number;
    status: string;
    prevStatus: string;
  };
  predictedRisk: {
    score: number;
    prevScore: number;
    tier: string;
    prevTier: string;
    confidence: number;
    prevConfidence: number;
  };
  predictedRecommendations: RecommendationDetail[];
  riskReduction: number;
  confidence: number;
  trajectoryImprovement: number;
  timeSaved: number;
  reservePreservation: number;
  overallScore: number;
  physiologicalExplanation?: string;
  interventionAssumptions?: string;
}

export interface ScenarioRanking {
  rank: number;
  scenarioId: string;
  scenarioName: string;
  score: number;
  badge: string;
  reason: string;
}

export interface PredictionEngineOutput {
  pathways: TrajectoryPathway[];
  recommendationForecast: RecommendationForecast[];
  scenarios: TwinScenario[];
  rankings: ScenarioRanking[];
}

