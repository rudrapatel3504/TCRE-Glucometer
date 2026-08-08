import { Measurement } from '../store/useTCREStore';

export interface ScenarioDefinition {
  id: string;
  name: string;
  patientName: string;
  dob: string;
  patientId: string;
  condition: string;
  narrative: string;
  expectedMetric: string;
  expectedLatentKey: string;
  expectedLatentName: string;
  expectedComposite: string;
  expectedRiskTier: string;
  expectedRecommendation: string;
}

export const SCENARIOS: ScenarioDefinition[] = [
  {
    id: "healthy",
    name: "Healthy Control",
    patientName: "Sarah Jenkins",
    dob: "1998-03-14",
    patientId: "P-10101",
    condition: "Healthy Control",
    narrative: "A 28-year-old healthy control with stable glycemic indices, normal target ranges, and no chronic or acute stress signatures.",
    expectedMetric: "VOL < 15%, BDI < 15%",
    expectedLatentKey: "sc",
    expectedLatentName: "State Confidence",
    expectedComposite: "Inactive",
    expectedRiskTier: "Minimal",
    expectedRecommendation: "Maintain Current Therapeutic Regimen"
  },
  {
    id: "sd",
    name: "Silent Deterioration",
    patientName: "Arthur Pendelton",
    dob: "1962-09-22",
    patientId: "P-40402",
    condition: "Type 2 Diabetes",
    narrative: "A slow, creeping baseline deviation (+15%) combined with very low apparent glycemic volatility, representing a classic Silent Deterioration state that masks standard alerts.",
    expectedMetric: "CBI > 35%, VOL < 25%",
    expectedLatentKey: "sd",
    expectedLatentName: "Silent Deterioration",
    expectedComposite: "Hidden Escalation",
    expectedRiskTier: "High",
    expectedRecommendation: "Review Basal Insulin Dose Titration"
  },
  {
    id: "fr",
    name: "False Recovery",
    patientName: "Beatrice Vance",
    dob: "1974-06-18",
    patientId: "P-98831",
    condition: "Type 1 Diabetes",
    narrative: "Glucose levels fall significantly over the last 5 days, suggesting recovery, but volatility remains high, confirming the drop is transient and unstable.",
    expectedMetric: "VOL > 30%, BDI > 20%, VI trend is down",
    expectedLatentKey: "fr",
    expectedLatentName: "False Recovery",
    expectedComposite: "Inactive",
    expectedRiskTier: "Moderate",
    expectedRecommendation: "Escalate Continuous Glucose Monitoring (CGM)"
  },
  {
    id: "hv",
    name: "High Variability",
    patientName: "Dennis Miller",
    dob: "1981-01-30",
    patientId: "P-72210",
    condition: "Type 1 Diabetes",
    narrative: "Patient experiences rapid glycemic oscillations (spikes and crashes) with severe standard deviations due to unstable therapeutic pacing.",
    expectedMetric: "VOL > 45%, AI > 45%",
    expectedLatentKey: "hv",
    expectedLatentName: "High Variability",
    expectedComposite: "Inactive",
    expectedRiskTier: "Moderate",
    expectedRecommendation: "Escalate Continuous Glucose Monitoring (CGM)"
  },
  {
    id: "cb",
    name: "Chronic Burden",
    patientName: "Fiona Gallagher",
    dob: "1955-11-04",
    patientId: "P-31102",
    condition: "Type 2 Diabetes",
    narrative: "Mean glucose is persistently elevated above fasting targets (average ~180 mg/dL) over the entire 30-day window, indicating sustained cumulative physiological burden.",
    expectedMetric: "BDI > 30%, CBI > 35%",
    expectedLatentKey: "cb",
    expectedLatentName: "Chronic Burden",
    expectedComposite: "Emerging",
    expectedRiskTier: "High",
    expectedRecommendation: "Establish Structured Nutritional Counseling"
  },
  {
    id: "ec",
    name: "Emerging Crisis",
    patientName: "Evelyn Harper",
    dob: "1972-04-12",
    patientId: "P-88291",
    condition: "Type 1 Diabetes",
    narrative: "Concurrent Silent Deterioration and High Variability. They satisfy the 3-day persistence gate and 0.50 interaction coupling strength, triggering an active Emerging Crisis state.",
    expectedMetric: "SD > 35, HV > 35, Persistence >= 3 days",
    expectedLatentKey: "sd",
    expectedLatentName: "Silent Deterioration",
    expectedComposite: "Emerging Crisis",
    expectedRiskTier: "Critical",
    expectedRecommendation: "Urgent Outpatient Clinical Intervention"
  },
  {
    id: "hidden",
    name: "Hidden Escalation",
    patientName: "Gregory Peck",
    dob: "1966-07-15",
    patientId: "P-50219",
    condition: "Type 2 Diabetes",
    narrative: "Silent Deterioration is active under high data density (State Confidence) with minimal volatility, activating the Hidden Escalation composite state.",
    expectedMetric: "SD > 45, SC > 65, HV < 35",
    expectedLatentKey: "sd",
    expectedLatentName: "Silent Deterioration",
    expectedComposite: "Hidden Escalation",
    expectedRiskTier: "Critical",
    expectedRecommendation: "Review Basal Insulin Dose Titration"
  },
  {
    id: "refractory",
    name: "Refractory Deterioration",
    patientName: "Harvey Dent",
    dob: "1984-10-10",
    patientId: "P-22310",
    condition: "LADA",
    narrative: "Patient exhibits creeping glucose deterioration combined with high Treatment Non-Responsiveness, activating the Refractory Deterioration composite state.",
    expectedMetric: "SD > 40, TNR > 40",
    expectedLatentKey: "tnr",
    expectedLatentName: "Treatment Non-Responsiveness",
    expectedComposite: "Refractory Deterioration",
    expectedRiskTier: "Critical",
    expectedRecommendation: "Schedule Urgent Regimen Sensitivity Audit"
  },
  {
    id: "unstable",
    name: "Unstable Plateau",
    patientName: "Irene Adler",
    dob: "1987-05-05",
    patientId: "P-80899",
    condition: "Type 1 Diabetes",
    narrative: "Consistently elevated glucose averages (Chronic Burden) combined with high volatility and flat trend, triggering the Unstable Plateau composite state.",
    expectedMetric: "CB > 50, HV > 50, Trend is flat",
    expectedLatentKey: "cb",
    expectedLatentName: "Chronic Burden",
    expectedComposite: "Unstable Plateau",
    expectedRiskTier: "Critical",
    expectedRecommendation: "Schedule Urgent Regimen Sensitivity Audit"
  },
  {
    id: "chronic_crisis",
    name: "Chronic Crisis",
    patientName: "Julian Vance",
    dob: "1959-12-25",
    patientId: "P-76612",
    condition: "Type 2 Diabetes",
    narrative: "Chronic Burden, High Variability, and Silent Deterioration are concurrently active and have persisted past the 14-day chronicity gate, triggering a Chronic Crisis.",
    expectedMetric: "CB > 50, SD > 40, HV > 40, Days >= 14",
    expectedLatentKey: "cb",
    expectedLatentName: "Chronic Burden",
    expectedComposite: "Chronic Crisis",
    expectedRiskTier: "Critical",
    expectedRecommendation: "Schedule Urgent Regimen Sensitivity Audit"
  }
];

/**
 * Deterministic pseudo-random number generator to ensure identical inputs
 */
function deterministicRandom(index: number, offset: number): number {
  const val = Math.sin(index * 12.9898 + offset * 78.233) * 43758.5453123;
  return val - Math.floor(val);
}

export function generateScenarioData(scenarioId: string): Measurement[] {
  const data: Measurement[] = [];
  const start = new Date("2026-06-01T12:00:00.000Z"); // Set fixed date anchor
  const days = scenarioId === "ec" ? 6 : 30;
  start.setDate(start.getDate() - days);
  
  for (let i = 0; i <= days; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dateStr = currentDate.toISOString().split("T")[0];
    
    let base = 100;
    let vol = 10;
    
    switch (scenarioId) {
      case "healthy":
        base = 100 + Math.sin(i * 0.5) * 4;
        vol = 4;
        break;
      case "sd":
        base = 100 + i * 2.3; // rises steadily to 169
        vol = 8;
        break;
      case "fr":
        if (i < 25) {
          base = 180 + Math.sin(i) * 12;
          vol = 15;
        } else {
          base = 110 + Math.sin(i) * 5; // drop
          vol = 35; // high variability persists
        }
        break;
      case "hv":
        base = 140;
        vol = 50 + Math.sin(i * 0.8) * 15; // swings
        break;
      case "cb":
        base = 180 + Math.sin(i * 0.5) * 6; // high flat
        vol = 10;
        break;
      case "ec":
        base = 110 + i * 8.0; // rises steeply to 158 in 6 days
        vol = 32 + Math.sin(i) * 10; // high volatility
        break;
      case "hidden":
        base = 135 + i * 1.8; // high baseline (high CBI) rising to 189
        vol = 6; // low volatility
        break;
      case "refractory":
        base = 145 + i * 1.5; // high baseline rising to 190
        vol = 12;
        break;
      case "unstable":
        base = 175; // flat high plateau
        vol = 45 + Math.sin(i) * 5;
        break;
      case "chronic_crisis":
        base = 145 + i * 1.5; // high baseline rising to 190
        vol = 40; // high volatility
        break;
    }

    // Three daily measurements (Morning, Afternoon, Evening) - with deterministic values
    data.push({
      date: `${dateStr}T08:00:00.000Z`,
      glucose: Math.max(40, Math.floor(base + (vol * 0.4) + deterministicRandom(i, 1) * 8)),
      source: "system"
    });
    
    data.push({
      date: `${dateStr}T13:00:00.000Z`,
      glucose: Math.max(40, Math.floor(base + (vol * 1.3) + deterministicRandom(i, 2) * 12)),
      source: "system"
    });
    
    data.push({
      date: `${dateStr}T20:00:00.000Z`,
      glucose: Math.max(40, Math.floor(base - (vol * 0.9) + deterministicRandom(i, 3) * 10)),
      source: "system"
    });
  }
  return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
