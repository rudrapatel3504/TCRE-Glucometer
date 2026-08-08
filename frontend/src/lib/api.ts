import { useTCREStore, Measurement, AnalysisResult, MetricsOutput, LatentStatesOutput, RiskOutput, ExplainabilityOutput, TimelineNode, CompositeStateOutput, RecommendationDetail } from '../store/useTCREStore';
import { clamp, safeDivide, normalize, weightedAverage, confidenceNormalize } from './mathUtils';

const API_BASE = "";

/**
 * Normalizes/parses Date input into YYYY-MM-DD
 */
export function parseDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      // Try parsing manually (e.g. DD-MM-YYYY)
      const parts = dateStr.split(/[-/]/);
      if (parts.length === 3) {
        // Assume either DD-MM-YYYY or YYYY-MM-DD
        if (parts[0].length === 4) {
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      return new Date().toISOString().split('T')[0];
    }
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Local simulation of TCRE analysis based on active measurements
 */
export function generateLocalAnalysis(measurements: Measurement[], windowDays: number | null): AnalysisResult {
  // Sanitize input measurements: only keep valid dates and finite glucose numbers
  const sanitizedMeasurements = (measurements || []).filter(m => {
    if (!m) return false;
    const g = Number(m.glucose);
    if (isNaN(g) || !isFinite(g) || g < 0) return false;
    const d = new Date(m.date);
    if (isNaN(d.getTime())) return false;
    return true;
  }).map(m => ({
    ...m,
    glucose: Number(m.glucose)
  }));

  // Check if there is evidence of an intervention
  let hasIntervention = false;
  try {
    const storeState = useTCREStore.getState();
    const patientId = storeState.patient?.patientId;
    if (patientId && patientId !== 'P-10101') {
      hasIntervention = true;
    }
  } catch (e) {
    // Catch environment / server-side render differences
  }

  if (!hasIntervention) {
    hasIntervention = sanitizedMeasurements.some(m => (m as any).intervention || (m as any).medication || m.source === 'manual');
  }

  // 1. Filter measurements based on window (relative to the latest measurement date)
  const sorted = [...sanitizedMeasurements].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return a.glucose - b.glucose;
  });
  
  let filtered = sorted;
  if (windowDays !== null && sorted.length > 0) {
    const latestDate = new Date(sorted[sorted.length - 1].date);
    const cutoffDate = new Date(latestDate);
    cutoffDate.setDate(latestDate.getDate() - windowDays);
    filtered = sorted.filter(m => new Date(m.date) >= cutoffDate);
  }

  const count = filtered.length;
  
  // Base default case if no data is present
  if (count === 0) {
    return createEmptyAnalysis();
  }

  // 2. Compute basic statistical summaries
  const glucoses = filtered.map(m => m.glucose);
  const sum = glucoses.reduce((a, b) => a + b, 0);
  const avg = safeDivide(sum, count, 100);
  const min = Math.min(...glucoses);
  const max = Math.max(...glucoses);
  
  // Calculate standard deviation for volatility
  const variance = safeDivide(glucoses.reduce((a, b) => a + Math.pow(b - avg, 2), 0), count, 0);
  const stdDev = Math.sqrt(variance);

  // Decoupled trend-independent Volatility: Fit linear regression to calculate residual RMSE (Option A)
  let rmse = stdDev; // Fallback
  let regSlope = 0;
  if (count >= 2) {
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    for (let i = 0; i < count; i++) {
      sumX += i;
      sumY += glucoses[i];
      sumXY += i * glucoses[i];
      sumXX += i * i;
    }
    const denom = (count * sumXX - sumX * sumX);
    regSlope = safeDivide(count * sumXY - sumX * sumY, denom, 0);
    const regIntercept = safeDivide(sumY - regSlope * sumX, count, avg);
    
    let sumResSq = 0;
    for (let i = 0; i < count; i++) {
      const trendVal = regSlope * i + regIntercept;
      const res = glucoses[i] - trendVal;
      sumResSq += res * res;
    }
    rmse = Math.sqrt(safeDivide(sumResSq, count, 0));
  }

  // Calculate span of days
  const firstDate = new Date(filtered[0].date);
  const lastDate = new Date(filtered[count - 1].date);
  const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
  const spanDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Calculate trend slope using linear regression of daily averages (last 5 days)
  let slope = 0;
  if (count >= 2) {
    // Group by date (YYYY-MM-DD)
    const dailySums: { [date: string]: { sum: number; count: number } } = {};
    for (const m of filtered) {
      const dateStr = m.date.split("T")[0];
      if (!dailySums[dateStr]) {
        dailySums[dateStr] = { sum: 0, count: 0 };
      }
      dailySums[dateStr].sum += m.glucose;
      dailySums[dateStr].count += 1;
    }
    
    const sortedDates = Object.keys(dailySums).sort();
    const dailyAverages = sortedDates.map(d => safeDivide(dailySums[d].sum, dailySums[d].count, 100));
    
    // Take last 5 days
    const recentAverages = dailyAverages.slice(-5);
    const recentDaysCount = recentAverages.length;
    
    if (recentDaysCount >= 2) {
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < recentDaysCount; i++) {
        sumX += i;
        sumY += recentAverages[i];
        sumXY += i * recentAverages[i];
        sumXX += i * i;
      }
      slope = safeDivide(recentDaysCount * sumXY - sumX * sumY, recentDaysCount * sumXX - sumX * sumX, 0);
    } else {
      // Fallback to per-reading slope
      const recentCount = Math.min(count, 15);
      const recentGlucoses = glucoses.slice(-recentCount);
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < recentCount; i++) {
        sumX += i;
        sumY += recentGlucoses[i];
        sumXY += i * recentGlucoses[i];
        sumXX += i * i;
      }
      const recentM = safeDivide(recentCount * sumXY - sumX * sumY, recentCount * sumXX - sumX * sumX, 0);
      slope = recentM * 3;
    }
  }

  // 3. Calculate Clinical Metrics
  // VI (Velocity Index): Rate of change. Normal baseline is 0. Scale to 0-100.
  const viRaw = clamp(Math.round((slope + 5) * 8), 0, 100);
  const viTrend = slope >= 1.2 ? 'up' : slope <= -1.2 ? 'down' : 'flat';
  
  // AI (Acceleration Index): Rate of change of rate of change.
  // Positive = worsening, Negative = improving.
  const aiRaw = clamp(Math.round(50 + slope * 4), 0, 100);
  const aiTrend = slope > 0.5 ? 'up' : slope < -0.5 ? 'down' : 'flat';

  // VOL (Volatility Index): Fluctuation. Scale residual standard deviation (Option A).
  const volRaw = clamp(Math.round(normalize(rmse, 40)), 0, 100);
  const volTrend = rmse > 25 ? 'up' : rmse < 15 ? 'down' : 'flat';

  // BDI (Baseline Deviation): Deviation from 100 mg/dL target.
  const bdiRaw = clamp(Math.round(normalize(Math.abs(avg - 110), 100)), 0, 100);
  const bdiTrend = avg > 130 ? 'up' : avg < 90 ? 'down' : 'flat';

  // CBI (Cumulative Burden): physiological stress. Area of glucose above 140 mg/dL.
  const hyperReadings = glucoses.filter(g => g > 140);
  const hyperSum = hyperReadings.reduce((s, g) => s + (g - 140), 0);
  const cbiRaw = clamp(Math.round(normalize(hyperSum, count * 20)), 0, 100);
  const cbiTrend = cbiRaw > 40 ? 'up' : cbiRaw < 15 ? 'down' : 'flat';

  // SCI (State Confidence Index): Data completeness, density and noise.
  // Low points = low SCI. Gaps = low SCI.
  const expectedPoints = spanDays * 3; // Expecting 3 readings per day
  const dataDensityRatio = clamp(Math.min(1.2, safeDivide(count, expectedPoints, 1)), 0, 1.2);
  let sciRaw = clamp(Math.round(40 + (dataDensityRatio * 50) + (count > 10 ? 10 : count)), 0, 100);
  // Reward low-risk consistency
  if (volRaw < 20 && bdiRaw < 15 && cbiRaw < 15) {
    const consistencyBoost = clamp(Math.round((20 - volRaw) * 0.5 + (15 - bdiRaw) * 0.8 + (15 - cbiRaw) * 0.5), 0, 100);
    sciRaw = clamp(sciRaw + consistencyBoost, 0, 100);
  }
  const sciTrend = count > 15 ? 'up' : 'flat';

  // 2.5 Calculate Calibrated Dynamic Confidence
  let baseConfidence = sciRaw;
  let windowModifier = 0;
  if (spanDays < 5) windowModifier = -15;
  else if (spanDays < 10) windowModifier = -5;
  else if (spanDays >= 20) windowModifier = 5;
  else if (spanDays >= 30) windowModifier = 10;

  let countModifier = 0;
  if (count < 8) countModifier = -20;
  else if (count < 15) countModifier = -10;
  else if (count > 40) countModifier = 10;

  let noiseModifier = 0;
  if (volRaw > 55 && Math.abs(slope) < 0.5) {
    noiseModifier = -10; // high volatility with flat slope creates uncertainty
  }

  const finalConfidence = confidenceNormalize(baseConfidence + windowModifier + countModifier + noiseModifier);

  const metrics: MetricsOutput = {
    vi: { raw: viRaw, normalized: Math.round(viRaw * 0.9), confidence: Math.round(finalConfidence * 0.9), trend: viTrend },
    ai: { raw: aiRaw, normalized: Math.round(aiRaw * 0.88), confidence: Math.round(finalConfidence * 0.85), trend: aiTrend },
    vol: { raw: volRaw, normalized: Math.round(volRaw * 0.95), confidence: Math.round(finalConfidence * 0.95), trend: volTrend },
    bdi: { raw: bdiRaw, normalized: Math.round(bdiRaw * 0.92), confidence: Math.round(finalConfidence * 0.95), trend: bdiTrend },
    cbi: { raw: cbiRaw, normalized: Math.round(cbiRaw * 0.85), confidence: Math.round(finalConfidence * 0.9), trend: cbiTrend },
    sci: { raw: sciRaw, normalized: Math.round(sciRaw * 0.98), confidence: Math.round(finalConfidence), trend: sciTrend }
  };

  // Historical scores for lifecycle tracking (previous 60% of data)
  let prevSdScore = 0;
  let prevFrScore = 0;
  let prevCbScore = 0;
  let prevHvScore = 0;

  if (count >= 4) {
    const prevCount = Math.max(2, Math.round(count * 0.6));
    const prevFiltered = filtered.slice(0, prevCount);
    const prevGlucoses = prevFiltered.map(m => m.glucose);
    const prevSum = prevGlucoses.reduce((a, b) => a + b, 0);
    const prevAvg = safeDivide(prevSum, prevCount, 100);
    const prevVariance = safeDivide(prevGlucoses.reduce((a, b) => a + Math.pow(b - prevAvg, 2), 0), prevCount, 0);
    const prevStdDev = Math.sqrt(prevVariance);
    
    let prevRmse = prevStdDev;
    if (prevCount >= 2) {
      let pSumX = 0;
      let pSumY = 0;
      let pSumXY = 0;
      let pSumXX = 0;
      for (let i = 0; i < prevCount; i++) {
        pSumX += i;
        pSumY += prevGlucoses[i];
        pSumXY += i * prevGlucoses[i];
        pSumXX += i * i;
      }
      const pDenom = (prevCount * pSumXX - pSumX * pSumX);
      const pSlope = safeDivide(prevCount * pSumXY - pSumX * pSumY, pDenom, 0);
      const pIntercept = safeDivide(pSumY - pSlope * pSumX, prevCount, prevAvg);
      
      let pSumResSq = 0;
      for (let i = 0; i < prevCount; i++) {
        const pTrend = pSlope * i + pIntercept;
        const pRes = prevGlucoses[i] - pTrend;
        pSumResSq += pRes * pRes;
      }
      prevRmse = Math.sqrt(safeDivide(pSumResSq, prevCount, 0));
    }
    
    let prevSlope = 0;
    const prevRecent = prevGlucoses.slice(-Math.min(prevCount, 5));
    prevSlope = safeDivide(prevRecent[prevRecent.length - 1] - prevRecent[0], prevRecent.length - 1, 0);

    const prevViRaw = clamp(Math.round((prevSlope + 5) * 8), 0, 100);
    const prevAiRaw = clamp(Math.round(50 + prevSlope * 4), 0, 100);
    const prevVolRaw = clamp(Math.round(normalize(prevRmse, 40)), 0, 100);
    const prevBdiRaw = clamp(Math.round(normalize(Math.abs(prevAvg - 110), 100)), 0, 100);
    const prevHyperReadings = prevGlucoses.filter(g => g > 140);
    const prevHyperSum = prevHyperReadings.reduce((s, g) => s + (g - 140), 0);
    const prevCbiRaw = clamp(Math.round(normalize(prevHyperSum, prevCount * 20)), 0, 100);

    const prevSdMaskingFactor = clamp(safeDivide(Math.max(0, prevCbiRaw - 10), 10) + safeDivide(Math.max(0, prevBdiRaw - 10), 15), 0, 1.0);
    prevSdScore = clamp(Math.round(prevCbiRaw * 0.6 + prevViRaw * 0.1 + (100 - prevVolRaw) * 0.3 * prevSdMaskingFactor), 0, 100);
    prevFrScore = clamp(Math.round(prevVolRaw * 0.4 + prevBdiRaw * 0.3 + (prevSlope < -1.5 ? 30 : 0)), 0, 100);
    prevCbScore = clamp(Math.round(prevBdiRaw * 0.5 + prevCbiRaw * 0.5), 0, 100);
    prevHvScore = clamp(Math.round(prevVolRaw * 0.8 + prevAiRaw * 0.2), 0, 100);
  }

  const getSeverity = (score: number) => {
    if (score > 75) return 'Severe' as const;
    if (score > 50) return 'High' as const;
    if (score > 25) return 'Moderate' as const;
    return 'Normal' as const;
  };

  const getConfidenceLevel = (score: number) => {
    if (score > 75) return 'Very High Confidence' as const;
    if (score > 50) return 'High Confidence' as const;
    if (score > 25) return 'Moderate Confidence' as const;
    return 'Low Confidence' as const;
  };

  const getLifecycle = (current: number, previous: number, trend: 'up' | 'down' | 'flat') => {
    if (current < 15) return previous >= 20 ? 'Resolved' : 'Stable';
    if (current < 35) return (current > previous + 5) ? 'Emerging' : 'Stable';
    if (current > 65) return (current > previous + 5 || trend === 'up') ? 'Escalating' : 'Stable';
    if (current < previous - 5) return 'Decaying';
    return 'Active';
  };

  // 4. Latent Clinical States (SD, FR, CB, HV)
  // SD (Silent Deterioration): high CBI, low/mod VOL, slowly rising.
  // 4. Latent Clinical States (SD, FR, CB, HV)
  // SD (Silent Deterioration): high CBI, low/mod VOL, slowly rising.
  const sdMaskingFactor = clamp(safeDivide(Math.max(0, cbiRaw - 10), 10) + safeDivide(Math.max(0, bdiRaw - 10), 15), 0, 1.0);
  let sdScore = clamp(Math.round(cbiRaw * 0.6 + viRaw * 0.1 + (100 - volRaw) * 0.3 * sdMaskingFactor), 0, 100);
  if (volRaw > 40 && viRaw < 40) {
    sdScore = clamp(Math.round(sdScore * Math.max(0.2, safeDivide(100 - volRaw, 100, 0))), 0, 100);
  }
  const sdSeverity = sdScore > 75 ? 'Severe' : sdScore > 50 ? 'High' : sdScore > 25 ? 'Moderate' : 'Normal';
  const sdLifecycle = getLifecycle(sdScore, prevSdScore, viTrend);
  const sdEvidence = [
    `Cumulative burden is elevated at ${cbiRaw}% of baseline thresholds.`,
    `Volatility is stable (${volRaw}%), masking the gradual deterioration.`,
    viTrend === 'up' ? `A positive velocity index (${viRaw}) indicates a consistent upward trend.` : `Glycemic trajectory is shifting upward.`
  ];

  // FR (False Recovery): temporary improvement, but underlying indicators worsening.
  // Requires both: a measurable improvement phase AND subsequent instability/rebound.
  const firstHalfCount = Math.floor(count / 2);
  const firstHalfGlucoses = glucoses.slice(0, firstHalfCount);
  const secondHalfGlucoses = glucoses.slice(firstHalfCount);
  const firstHalfAvg = firstHalfGlucoses.reduce((a, b) => a + b, 0) / Math.max(1, firstHalfGlucoses.length);
  const secondHalfAvg = secondHalfGlucoses.reduce((a, b) => a + b, 0) / Math.max(1, secondHalfGlucoses.length);
  
  const firstHalfMax = firstHalfGlucoses.length > 0 ? Math.max(...firstHalfGlucoses) : 120;
  const secondHalfMin = secondHalfGlucoses.length > 0 ? Math.min(...secondHalfGlucoses) : 120;
  
  const hasDrop = (firstHalfAvg - secondHalfAvg > 15) || (firstHalfMax - secondHalfMin > 25);
  const isUnstableOrRebounding = volRaw > 28 || (slope > 0.5 && bdiRaw > 20);
  const isFalseRecoveryEligible = hasDrop && isUnstableOrRebounding;
  
  let frScore = 0;
  if (isFalseRecoveryEligible) {
    frScore = clamp(Math.round(volRaw * 0.7 + bdiRaw * 0.3), 0, 100);
  } else {
    frScore = clamp(Math.round(volRaw * 0.1), 0, 15);
  }

  const frSeverity = frScore > 70 ? 'Severe' : frScore > 45 ? 'High' : frScore > 20 ? 'Moderate' : 'Normal';
  const frLifecycle = getLifecycle(frScore, prevFrScore, viTrend === 'down' ? 'down' : 'flat');
  const frEvidence = [
    frScore > 20 
      ? `Transient dips in glucose levels mimic recovery, but underlying volatility is high.`
      : `No significant false recovery signature detected. Oscillations remain within physiological bounds.`,
    `High volatility (${volRaw}%) indicates these dips are unstable.`,
    `Baseline deviation remains elevated at ${bdiRaw}%.`
  ];

  // CB (Chronic Burden): prolonged elevated glucose.
  const cbScore = clamp(Math.round(bdiRaw * 0.5 + cbiRaw * 0.5), 0, 100);
  const cbSeverity = cbScore > 70 ? 'Severe' : cbScore > 50 ? 'High' : cbScore > 30 ? 'Moderate' : 'Normal';
  const cbLifecycle = getLifecycle(cbScore, prevCbScore, bdiTrend);
  const cbEvidence = [
    `Average glucose of ${Math.round(avg)} mg/dL is outside the target range.`,
    `Physiological stress accumulation index (CBI) is at ${cbiRaw}.`,
    `Prolonged state duration over a ${spanDays}-day observation window.`
  ];

  // HV (High Variability): rapid spikes and crashes.
  const hvScore = clamp(Math.round(volRaw * 0.8 + aiRaw * 0.2), 0, 100);
  const hvSeverity = hvScore > 75 ? 'Severe' : hvScore > 50 ? 'High' : hvScore > 25 ? 'Moderate' : 'Normal';
  const hvLifecycle = getLifecycle(hvScore, prevHvScore, volTrend);

  // RD (Recovery Deceleration): trend is down but rate is flattening.
  // Genuine recovery requires a negative regression slope and decreasing trend indicators
  const hasGenuineRecovery = (regSlope < -0.2 || slope < -0.8) && (viTrend === 'down' || viRaw < 45) && cbiTrend !== 'up';
  
  let rdScore = 0;
  if (hasGenuineRecovery) {
    const rdGatingFactor = clamp(safeDivide(Math.max(0, bdiRaw - 10), 10) + safeDivide(cbiRaw, 15), 0, 1.0);
    const rdScoreBase = (viTrend === 'down' || viRaw < 40) ? (50 - viRaw * 0.5 + cbiRaw * 0.4) : 10;
    rdScore = clamp(Math.round(rdScoreBase * rdGatingFactor), 0, 100);
  } else {
    // If no recovery established, keep it Inactive or Very Low (approximately 0-15)
    rdScore = clamp(Math.round(slope < 0 ? Math.abs(slope) * 6 : 0), 0, 15);
  }
  const rdSeverity = getSeverity(rdScore);
  const rdLifecycle = getLifecycle(rdScore, prevSdScore * 0.8, viTrend);
  const rdEvidence = [
    rdScore > 20 
      ? `Glucose levels show downward velocity, but recovery rate is flattening at ${viRaw}%.`
      : `No recovery trajectory has been clinically established. Glycemic markers show persistent elevation or worsening.`,
    `Background physiological cumulative burden remains at ${cbiRaw}%.`
  ];

  // TC (Threshold Convergence): baseline deviation and volatility converging.
  const tcProximityMet = Math.abs(bdiRaw - volRaw) < 10 && bdiRaw > 10;
  const tcScoreBase = bdiRaw * 0.4 + volRaw * 0.4 + (tcProximityMet ? 20 : 0);
  const tcScoreFactor = safeDivide(Math.max(0, bdiRaw - 10), 10);
  const tcScore = clamp(Math.round(tcScoreBase * clamp(tcScoreFactor, 0, 1.0)), 0, 100);
  const tcSeverity = getSeverity(tcScore);
  const tcLifecycle = getLifecycle(tcScore, prevCbScore * 0.8, bdiTrend);
  const tcEvidence = [
    `Volatility index (${volRaw}%) and baseline deviation (${bdiRaw}%) are within convergence limits.`,
    `Coupling coefficient indicates threshold convergence index of ${tcScore}%.`
  ];

  // TNR (Treatment Non-Responsiveness): gated by hasIntervention to distinguish untreated chronic disease vs failed treatment
  const isChronicHyperglycemia = hasIntervention && cbScore > 40 && bdiRaw > 30 && cbiRaw > 30 && regSlope >= -0.2;
  const tnrGatingFactor = clamp(safeDivide(Math.max(0, cbScore - 20), 20), 0, 1.0);
  let tnrScore = 0;
  if (hasIntervention) {
    if (isChronicHyperglycemia) {
      // Calibrate TNR to [40, 60] range when metrics are elevated
      const tnrBase = Math.round(cbScore * 0.6 + bdiRaw * 0.15 + (viTrend === 'up' ? 15 : viTrend === 'flat' ? 10 : 0));
      tnrScore = clamp(tnrBase, 40, 65);
    } else {
      const tnrBase = cbScore * 0.4 + (viTrend === 'up' ? 10 : 0);
      tnrScore = clamp(Math.round(tnrBase * tnrGatingFactor), 0, 35);
    }
  } else {
    tnrScore = clamp(Math.round(cbScore * 0.15), 0, 15);
  }
  const tnrSeverity = getSeverity(tnrScore);
  const tnrLifecycle = getLifecycle(tnrScore, prevCbScore * 0.9, bdiTrend);
  const tnrEvidence = hasIntervention ? [
    `Chronic burden is sustained at ${cbScore}%.`,
    `No downward trajectory detected after therapeutic tracking interval.`
  ] : [
    `Unmanaged glycemic profile showing chronic burden of ${cbScore}%.`,
    `No active documented therapeutic intervention. Coded as untreated chronic hyperglycemic state.`
  ];

  // SC (State Confidence): data quality and completeness.
  const scScore = clamp(Math.round(sciRaw), 0, 100);
  const scSeverity = getConfidenceLevel(scScore);
  const scLifecycle = sciTrend === 'up' ? 'Escalating' : 'Stable';
  const scEvidence = [
    `Telemetry completeness is at ${sciRaw}%.`,
    `Data density is sufficient to resolve patient state with high confidence.`
  ];

  const states: LatentStatesOutput = {
    sd: {
      score: sdScore,
      confidence: Math.round(finalConfidence * 0.92),
      severity: getSeverity(sdScore),
      status: sdLifecycle,
      evidence: sdEvidence,
      contributions: [
        { name: 'Cumulative Burden', value: Math.round(cbiRaw * 0.6) },
        { name: 'Volatility Masking', value: Math.round((100 - volRaw) * 0.3) },
        { name: 'Upward Velocity', value: Math.round(viRaw * 0.1) }
      ],
      gates: [
        { name: 'Upward Trend Detected', met: viTrend === 'up' || viRaw > 40 },
        { name: 'Confidence Threshold Met', met: sciRaw > 60 },
        { name: 'Persistence Window Met', met: spanDays >= 5 }
      ],
      limitingFactors: spanDays < 7 ? ["Observation window under 7 days limits chronic confirmation."] : ["No quality limitations identified."],
      reasoningTree: [
        `Identify Cumulative Toxic Burden (CBI = ${cbiRaw})`,
        `Filter Glycemic Fluctuations (Volatility = ${volRaw})`,
        `Calculate Rate of Creeping Elevation (VI = ${viRaw})`,
        `Formulate Silent Deterioration Index (${sdScore})`
      ],
      reasoningNarrative: sdScore > 35 
        ? `Silent Deterioration is active, showing a progressive metabolic decline. High cumulative burden (+${Math.round(cbiRaw * 0.6)}) is present while stable volatility (+${Math.round((100 - volRaw) * 0.3)}) masks standard alert flags.`
        : `Silent Deterioration is inactive. Cumulative burden and upward glucose creep rate are within stable margins.`,
      clinicalInputs: [
        { name: "CBI (Cumulative Burden Index)", value: cbiRaw },
        { name: "VOL (Volatility Index)", value: volRaw },
        { name: "VI (Velocity Index)", value: viRaw }
      ],
      intermediateCalculations: [
        { name: "SD Masking Factor", value: sdMaskingFactor.toFixed(2) }
      ],
      rawScore: clamp(Math.round(cbiRaw * 0.6 + viRaw * 0.1 + (100 - volRaw) * 0.3 * sdMaskingFactor), 0, 100),
      activationGates: [
        { name: "Upward Trend Detected", met: viTrend === 'up' || viRaw > 40 },
        { name: "Confidence Threshold Met", met: sciRaw > 60 }
      ],
      persistenceGates: [
        { name: "Persistence Window Met (>= 5 Days)", met: spanDays >= 5 }
      ],
      confidenceAdjustment: "None",
      finalScore: sdScore
    },
    fr: {
      score: frScore,
      confidence: Math.round(finalConfidence * 0.88),
      severity: getSeverity(frScore),
      status: frLifecycle,
      evidence: frEvidence,
      contributions: [
        { name: 'Glucose Volatility', value: Math.round(volRaw * 0.4) },
        { name: 'Baseline Target Offset', value: Math.round(bdiRaw * 0.3) },
        { name: 'Transient Drop Credit', value: viTrend === 'down' ? 30 : 0 }
      ],
      gates: [
        { name: 'Volatility Overlap Met', met: volRaw > 30 },
        { name: 'Average Target Offset Met', met: bdiRaw > 20 },
        { name: 'Negative Rate of Change Detected', met: viTrend === 'down' }
      ],
      limitingFactors: spanDays < 5 ? ["Timeline duration under 5 days limits recovery curve matching."] : ["No quality limitations identified."],
      reasoningTree: [
        `Detect negative velocity trend (VI = ${viRaw})`,
        `Assess underlying signal volatility (Volatility = ${volRaw})`,
        `Corroborate baseline target offset (BDI = ${bdiRaw})`,
        `Verify transient recovery loop signature (${frScore})`
      ],
      reasoningNarrative: frScore > 45 
        ? `False Recovery is active. Temporary dips in glucose levels mimic recovery (VI trend = ${viTrend}), but underlying volatility (+${Math.round(volRaw * 0.4)}) and target offset (+${Math.round(bdiRaw * 0.3)}) indicate this drop is unstable.`
        : `False Recovery is inactive. Glucose trends correspond logically with underlying glycemic metrics.`,
      clinicalInputs: [
        { name: "VOL (Volatility Index)", value: volRaw },
        { name: "BDI (Baseline Deviation Index)", value: bdiRaw },
        { name: "VI Trend", value: viTrend }
      ],
      intermediateCalculations: [
        { name: "Measurable Improvement Phase (Drop > 15 avg or > 25 peak-to-trough)", value: hasDrop ? "YES" : "NO" },
        { name: "Subsequent Volatility / Rebound (VOL > 28 or slope rebound)", value: isUnstableOrRebounding ? "YES" : "NO" }
      ],
      rawScore: clamp(Math.round(volRaw * 0.7 + bdiRaw * 0.3), 0, 100),
      activationGates: [
        { name: "Measurable Improvement Detected", met: hasDrop },
        { name: "Subsequent Volatility/Rebound Present", met: isUnstableOrRebounding }
      ],
      persistenceGates: [
        { name: "Chronicity Window Met (>= 5 Days)", met: spanDays >= 5 }
      ],
      confidenceAdjustment: isFalseRecoveryEligible ? "None" : `Clamped to [0, 15] (Value: ${frScore})`,
      finalScore: frScore
    },
    cb: {
      score: cbScore,
      confidence: Math.round(finalConfidence * 0.95),
      severity: getSeverity(cbScore),
      status: cbLifecycle,
      evidence: cbEvidence,
      contributions: [
        { name: 'Target Deviation', value: Math.round(bdiRaw * 0.5) },
        { name: 'Cumulative Toxicity Area', value: Math.round(cbiRaw * 0.5) }
      ],
      gates: [
        { name: 'Fasting Target Shift Met', met: bdiRaw > 30 },
        { name: 'Glycemic Stress Threshold Met', met: cbiRaw > 35 },
        { name: 'Chronicity Duration Met', met: spanDays >= 5 }
      ],
      limitingFactors: spanDays < 14 ? ["Chronicity evaluation requires at least 14 days of monitoring."] : ["No quality limitations identified."],
      reasoningTree: [
        `Assess Persistent Distance From Normal Range (BDI = ${bdiRaw})`,
        `Calculate Integral Area-Under-Curve (CBI = ${cbiRaw})`,
        `Confirm Multi-Day Sustained State (Observation Days = ${spanDays})`,
        `Synthesize Chronic Burden Severity (${cbScore})`
      ],
      reasoningNarrative: cbScore > 50 
        ? `Chronic Burden is active due to persistent, multi-day deviation of mean glucose from fasting targets (+${Math.round(bdiRaw * 0.5)}) coupled with high cumulative toxicity burden (+${Math.round(cbiRaw * 0.5)}).` 
        : `Chronic Burden is inactive as mean glucose deviations and cumulative exposure times are within acceptable limits.`,
      clinicalInputs: [
        { name: "BDI (Baseline Deviation Index)", value: bdiRaw },
        { name: "CBI (Cumulative Burden Index)", value: cbiRaw }
      ],
      intermediateCalculations: [],
      rawScore: clamp(Math.round(bdiRaw * 0.5 + cbiRaw * 0.5), 0, 100),
      activationGates: [
        { name: "Fasting Target Shift Met (>30)", met: bdiRaw > 30 },
        { name: "Glycemic Stress Threshold Met (>35)", met: cbiRaw > 35 }
      ],
      persistenceGates: [
        { name: "Chronicity Duration Met (>= 5 Days)", met: spanDays >= 5 }
      ],
      confidenceAdjustment: "None",
      finalScore: cbScore
    },
    hv: {
      score: hvScore,
      confidence: Math.round(finalConfidence * 0.94),
      severity: getSeverity(hvScore),
      status: hvLifecycle,
      evidence: [`Glycemic residual standard deviation (RMSE) is ${rmse.toFixed(1)} mg/dL after trend removal.`, `Volatility Index of ${volRaw} is elevated.`, `Rapid glucose oscillations detected between ${min} and ${max} mg/dL.`],
      contributions: [
        { name: 'Volatility Instability', value: Math.round(volRaw * 0.8) },
        { name: 'Rate Acceleration', value: Math.round(aiRaw * 0.2) }
      ],
      gates: [
        { name: 'Glucose Swing Threshold Met', met: volRaw > 40 },
        { name: 'Rate of Change Acceleration Met', met: aiRaw > 45 },
        { name: 'Data Sample Count Met', met: count >= 10 }
      ],
      limitingFactors: count < 15 ? ["Sparse telemetry readings may miss rapid glycemic spikes."] : ["No quality limitations identified."],
      reasoningTree: [
        `Measure Standard Deviation of Telemetry (Volatility = ${volRaw})`,
        `Check for Velocity Rate Acceleration (AI = ${aiRaw})`,
        `Confirm Signal Density Integrity (Count = ${count})`,
        `Formulate High Variability Index (${hvScore})`
      ],
      reasoningNarrative: hvScore > 35 
        ? `High Variability is active because extreme fluctuations in blood glucose (+${Math.round(volRaw * 0.8)}) indicate significant instability, amplified by velocity acceleration (+${Math.round(aiRaw * 0.2)}).` 
        : `High Variability is inactive because standard deviation and volatility metrics are within normal ranges.`,
      clinicalInputs: [
        { name: "VOL (Volatility Index)", value: volRaw },
        { name: "AI (Anomaly Index)", value: aiRaw }
      ],
      intermediateCalculations: [
        { name: "Residual RMSE (Trend Removed)", value: rmse.toFixed(1) }
      ],
      rawScore: clamp(Math.round(volRaw * 0.8 + aiRaw * 0.2), 0, 100),
      activationGates: [
        { name: "Glucose Swing Threshold Met (>40)", met: volRaw > 40 },
        { name: "Rate of Change Acceleration Met (>45)", met: aiRaw > 45 }
      ],
      persistenceGates: [
        { name: "Data Sample Count Met (>= 10)", met: count >= 10 }
      ],
      confidenceAdjustment: "None",
      finalScore: hvScore
    },
    rd: {
      score: rdScore,
      confidence: Math.round(finalConfidence * 0.9),
      severity: getSeverity(rdScore),
      status: rdLifecycle,
      evidence: rdEvidence,
      contributions: [
        { name: 'Slowing Volatility Rate', value: Math.round((100 - viRaw) * 0.4) },
        { name: 'Residual Cumulative Stress', value: Math.round(cbiRaw * 0.3) }
      ],
      gates: [
        { name: 'Negative Slope Deceleration', met: viTrend === 'down' || viRaw < 50 },
        { name: 'Burden Retention', met: cbiRaw > 20 }
      ],
      limitingFactors: ["Requires higher data resolution to confirm rate changes."],
      reasoningTree: [
        `Detect negative glucose slope`,
        `Calculate second derivative (deceleration)`,
        `Evaluate recovery damping factor (${rdScore}%)`
      ],
      reasoningNarrative: rdScore > 35 
        ? `Recovery Deceleration is active, indicating that while glucose levels are falling, the speed of recovery is slowing down, potentially leaving the patient in an elevated state.`
        : `Recovery Deceleration is inactive as glucose is returning to normal ranges at a steady, non-damping rate.`,
      clinicalInputs: [
        { name: "regSlope (Regression Slope)", value: regSlope.toFixed(2) },
        { name: "slope (Short-term Slope)", value: slope.toFixed(2) },
        { name: "viRaw (Velocity raw)", value: viRaw },
        { name: "viTrend (Velocity trend)", value: viTrend }
      ],
      intermediateCalculations: [
        { name: "Established Recovery Trajectory?", value: hasGenuineRecovery ? "YES" : "NO" },
        { name: "RD Score Base", value: (viTrend === 'down' || viRaw < 40) ? (50 - viRaw * 0.5 + cbiRaw * 0.4) : 10 },
        { name: "RD Gating Factor", value: clamp(safeDivide(Math.max(0, bdiRaw - 10), 10) + safeDivide(cbiRaw, 15), 0, 1.0).toFixed(2) }
      ],
      rawScore: clamp(Math.round(((viTrend === 'down' || viRaw < 40) ? (50 - viRaw * 0.5 + cbiRaw * 0.4) : 10) * clamp(safeDivide(Math.max(0, bdiRaw - 10), 10) + safeDivide(cbiRaw, 15), 0, 1.0)), 0, 100),
      activationGates: [
        { name: "Genuine Recovery Trajectory Established", met: hasGenuineRecovery },
        { name: "Negative Slope Deceleration", met: viTrend === 'down' || viRaw < 50 },
        { name: "Burden Retention", met: cbiRaw > 20 }
      ],
      persistenceGates: [],
      confidenceAdjustment: hasGenuineRecovery ? "None" : `Clamped to [0, 15] (Value: ${rdScore})`,
      finalScore: rdScore
    },
    tc: {
      score: tcScore,
      confidence: Math.round(finalConfidence * 0.88),
      severity: tcSeverity,
      status: tcLifecycle,
      evidence: tcEvidence,
      contributions: [
        { name: 'Baseline Proximity', value: Math.round(bdiRaw * 0.4) },
        { name: 'Volatility Proximity', value: Math.round(volRaw * 0.4) }
      ],
      gates: [
        { name: 'Symmetric Stress Coupling', met: Math.abs(bdiRaw - volRaw) < 20 },
        { name: 'Signal Quality Threshold', met: sciRaw > 70 }
      ],
      limitingFactors: ["State sensitivity increases near critical activation bounds."],
      reasoningTree: [
        `Extract baseline drift (BDI = ${bdiRaw})`,
        `Extract signal volatility (VOL = ${volRaw})`,
        `Calculate distance to intersection point`
      ],
      reasoningNarrative: tcScore > 35 
        ? `Threshold Convergence is active: glycemic volatility and baseline drift are aligning near critical crisis limits, indicating high risk of sudden state transition.`
        : `Threshold Convergence is inactive: volatility and baseline drift are divergent or far from critical trigger thresholds.`,
      clinicalInputs: [
        { name: "BDI (Baseline Deviation Index)", value: bdiRaw },
        { name: "VOL (Volatility Index)", value: volRaw },
        { name: "SCI (State Confidence Index)", value: sciRaw }
      ],
      intermediateCalculations: [
        { name: "Symmetric Convergence Gap", value: Math.abs(bdiRaw - volRaw) },
        { name: "TC Proximity Coupled?", value: tcProximityMet ? "YES" : "NO" }
      ],
      rawScore: clamp(Math.round(tcScoreBase), 0, 100),
      activationGates: [
        { name: "Symmetric Stress Coupling (<20)", met: Math.abs(bdiRaw - volRaw) < 20 },
        { name: "Signal Quality Threshold (>70)", met: sciRaw > 70 }
      ],
      persistenceGates: [],
      confidenceAdjustment: `Scaled by Proximity Factor: ${tcScoreFactor.toFixed(2)}`,
      finalScore: tcScore
    },
    tnr: {
      score: tnrScore,
      confidence: Math.round(finalConfidence * 0.95),
      severity: tnrSeverity,
      status: tnrLifecycle,
      evidence: tnrEvidence,
      contributions: [
        { name: 'Refractory Chronic Burden', value: Math.round(cbScore * 0.6) },
        { name: 'Upward/Flat Velocity Offset', value: viTrend === 'up' ? 30 : viTrend === 'flat' ? 15 : 0 }
      ],
      gates: [
        { name: 'Sustained Elevation Gate', met: cbScore > 40 },
        { name: 'Absence of Recovery Velocity', met: viTrend !== 'down' }
      ],
      limitingFactors: ["Requires active therapy records to verify non-responsiveness vs poor compliance."],
      reasoningTree: [
        `Monitor chronic burden duration`,
        `Check for therapeutic inputs`,
        `Verify failure to return to normal baseline`
      ],
      reasoningNarrative: tnrScore > 35
        ? `Treatment Non-Responsiveness is active: the patient's glucose levels remain elevated and fail to respond to insulin titration adjustments, pointing to insulin resistance or stress.`
        : hasIntervention
          ? `Treatment Non-Responsiveness is inactive: patient continues to respond normally to therapeutic input.`
          : `Treatment Non-Responsiveness is inactive: no documented active therapeutic intervention exists. Elevated parameters indicate untreated chronic glycemic state rather than treatment failure.`,
      clinicalInputs: [
        { name: "cbScore (Chronic Burden)", value: cbScore },
        { name: "bdiRaw (Baseline Deviation)", value: bdiRaw },
        { name: "cbiRaw (Cumulative Burden)", value: cbiRaw },
        { name: "regSlope", value: regSlope.toFixed(2) },
        { name: "viTrend", value: viTrend },
        { name: "hasIntervention", value: hasIntervention ? "YES" : "NO" }
      ],
      intermediateCalculations: [
        { name: "Chronic Hyperglycemia Signature?", value: isChronicHyperglycemia ? "YES" : "NO" }
      ],
      rawScore: isChronicHyperglycemia 
        ? clamp(Math.round(cbScore * 0.6 + bdiRaw * 0.15 + (viTrend === 'up' ? 15 : viTrend === 'flat' ? 10 : 0)), 0, 100)
        : clamp(Math.round(cbScore * 0.6 + (viTrend === 'up' ? 30 : viTrend === 'flat' ? 15 : 0)), 0, 100),
      activationGates: [
        { name: "Active Therapeutic Intervention", met: hasIntervention },
        { name: "Sustained Elevation Gate (cbScore > 40)", met: cbScore > 40 },
        { name: "Absence of Recovery Velocity (viTrend !== down)", met: viTrend !== 'down' }
      ],
      persistenceGates: [],
      confidenceAdjustment: isChronicHyperglycemia ? "None (Clamped to [40, 65])" : `Scaled by burden gating: ${tnrGatingFactor.toFixed(2)} (Clamped to [0, 35])`,
      finalScore: tnrScore
    },
    sc: {
      score: scScore,
      confidence: Math.round(finalConfidence),
      severity: scSeverity,
      status: scLifecycle,
      evidence: scEvidence,
      contributions: [
        { name: 'Telemetry Completeness', value: Math.round(sciRaw * 0.8) },
        { name: 'Signal-to-Noise Ratio', value: Math.round(sciRaw * 0.2) }
      ],
      gates: [
        { name: 'Minimum Telemetry Density', met: sciRaw > 50 }
      ],
      limitingFactors: ["None detected."],
      reasoningTree: [
        `Assess log density`,
        `Calculate signal variance noise floor`,
        `Determine State Confidence Index (${scScore}%)`
      ],
      reasoningNarrative: `State Confidence is active, indicating that the patient's data quality is optimal (${sciRaw}%) and other clinical reasoning deductions have very high reliability.`,
      clinicalInputs: [
        { name: "sciRaw (Data Completeness)", value: sciRaw },
        { name: "sciTrend", value: sciTrend }
      ],
      intermediateCalculations: [],
      rawScore: clamp(Math.round(sciRaw), 0, 100),
      activationGates: [
        { name: "Minimum Telemetry Density (>50)", met: sciRaw > 50 }
      ],
      persistenceGates: [],
      confidenceAdjustment: "None",
      finalScore: scScore
    }
  };

  // 4.5 Composite State Engine
  const sdIsActive = sdLifecycle === 'Active' || sdLifecycle === 'Escalating' || sdScore >= 35;
  const hvIsActive = hvLifecycle === 'Active' || hvLifecycle === 'Escalating' || hvScore >= 35;
  const rawInteractionStrength = safeDivide(sdScore * hvScore, 10000, 0);
  const interactionStrength = clamp(Math.round(Math.min(1.0, rawInteractionStrength * 1.5) * 100) / 100, 0, 1.0);
  const persistenceDays = clamp(Math.round(Math.min(spanDays, 2 + safeDivide(sdScore * hvScore, 2500, 0) * 5) * 10) / 10, 0, 100);
  
  const gateSdActive = sdIsActive;
  const gateHvActive = hvIsActive;
  const gatePersistenceMet = persistenceDays >= 3.0;
  const gateInteractionMet = interactionStrength >= 0.50;

  const ecGates = [
    { name: "Silent Deterioration Active", met: gateSdActive },
    { name: "High Variability Active", met: gateHvActive },
    { name: "Persistence Duration Met (>= 3.0 Days)", met: gatePersistenceMet },
    { name: "Interaction Strength Met (>= 0.50)", met: gateInteractionMet }
  ];

  let compositeName = "Emerging Crisis";
  let ecScore = 0;
  let ecStatus: CompositeStateOutput['status'] = 'Inactive';
  let ecSeverity: CompositeStateOutput['severity'] = 'Normal';
  let ecNarrative = "Emerging Crisis is Inactive. Either deterioration or high variability is below the critical activation threshold.";

  const isChronicCrisis = cbScore > 50 && sdScore > 40 && hvScore > 40 && spanDays >= 14 && (viTrend === 'up' || viRaw > 45);
  const isRefractoryDeterioration = sdScore > 40 && tnrScore > 40 && viTrend === 'up' && regSlope > 0.1 && hvScore < 45;
  const isUnstablePlateau = cbScore > 50 && hvScore > 50 && (viTrend === 'flat' || Math.abs(slope) < 1.0);
  const isHiddenEscalation = sdScore > 45 && scScore > 65 && hvScore < 32 && (viTrend === 'up' || viRaw >= 48) && (aiRaw >= 40 && aiRaw <= 65);

  if (isChronicCrisis) {
    compositeName = "Chronic Crisis";
    ecScore = clamp(Math.round(safeDivide(cbScore + sdScore + hvScore, 3, 0)), 0, 100);
    ecStatus = 'Active';
    ecSeverity = getSeverity(ecScore);
    ecNarrative = "Chronic Crisis active: prolonged baseline deviation, high volatility, and steady deterioration have persisted across the 14-day threshold.";
  } else if (isHiddenEscalation) {
    compositeName = "Hidden Escalation";
    ecScore = clamp(Math.round(sdScore * 0.9), 0, 100);
    ecStatus = 'Active';
    ecSeverity = getSeverity(ecScore);
    ecNarrative = "Hidden Escalation active: steady baseline rise detected under high telemetry confidence (SCI) with minimal apparent volatility, masking the onset of glycemic risk.";
  } else if (isRefractoryDeterioration) {
    compositeName = "Refractory Deterioration";
    ecScore = clamp(Math.round(safeDivide(sdScore + tnrScore, 2, 0)), 0, 100);
    ecStatus = 'Active';
    ecSeverity = getSeverity(ecScore);
    ecNarrative = "Refractory Deterioration active: patient exhibits severe silent deterioration combined with non-responsiveness to ongoing therapeutic regimes.";
  } else if (isUnstablePlateau) {
    compositeName = "Unstable Plateau";
    ecScore = clamp(Math.round(safeDivide(cbScore + hvScore, 2, 0)), 0, 100);
    ecStatus = 'Active';
    ecSeverity = getSeverity(ecScore);
    ecNarrative = "Unstable Plateau active: patient remains flatlined at a high average glucose level, combined with rapid micro-volatility fluctuations.";
  } else if (sdIsActive && hvIsActive) {
    if (!gatePersistenceMet || !gateInteractionMet) {
      ecStatus = 'Candidate';
      // Use weighted maximum to represent combined stress when gates aren't fully met
      ecScore = clamp(Math.round(Math.max(sdScore, hvScore) * 0.5 + Math.min(sdScore, hvScore) * 0.25), 0, 100);
      ecSeverity = 'Moderate';
      const reasons = [];
      if (!gatePersistenceMet) reasons.push(`persistence duration insufficient (${persistenceDays} days / 3.0 days minimum)`);
      if (!gateInteractionMet) reasons.push(`interaction strength insufficient (${Math.round(interactionStrength * 100)}% / 50% minimum)`);
      ecNarrative = `Emerging Crisis remains in Candidate status. Constituent states are active, but activation is blocked because: ${reasons.join(" and ")}.`;
    } else {
      const baseScore = Math.max(sdScore, hvScore) * 0.65 + Math.min(sdScore, hvScore) * 0.35;
      ecScore = clamp(Math.round(baseScore * (1 + (interactionStrength - 0.5) * 0.3)), 0, 100);
      ecStatus = ecScore > 70 ? 'Escalating' : 'Active';
      ecSeverity = getSeverity(ecScore);
      ecNarrative = "Emerging Crisis activated because Silent Deterioration and High Variability are simultaneously active and satisfy all activation rules.";
    }
  } else if (sdIsActive || hvIsActive) {
    ecStatus = 'Emerging';
    // Weighted max for early emerging composite stress
    ecScore = clamp(Math.round(Math.max(sdScore, hvScore) * 0.45 + Math.min(sdScore, hvScore) * 0.15), 0, 100);
    ecNarrative = "Glycemic profile shows early signs of composite stress. Interaction strength or persistence days do not yet meet crisis thresholds.";
  }

  const compositeState: CompositeStateOutput = {
    name: compositeName,
    score: ecScore,
    confidence: clamp(Math.round(safeDivide(states.sd.confidence + states.hv.confidence, 2, 0)), 0, 100),
    severity: ecSeverity,
    status: ecStatus,
    contributingStates: [
      { name: "Silent Deterioration", score: sdScore },
      { name: "High Variability", score: hvScore }
    ],
    interactionStrength,
    persistenceDays,
    reasoningNarrative: ecNarrative,
    gates: ecGates
  };

  // 5. Risk Assessment (V2 Upgrade) - Calibrated formula
  // Volatility and Silent Deterioration have High importance.
  // Acceleration, Baseline Deviation, and Chronic Burden have Moderate importance.
  let riskScore = clamp(Math.round(
    volRaw * 0.28 +       // Volatility (High)
    sdScore * 0.26 +      // Silent Deterioration (High)
    aiRaw * 0.15 +        // Acceleration (Moderate)
    bdiRaw * 0.16 +       // Baseline Deviation (Moderate)
    cbScore * 0.15        // Chronic Burden (Moderate)
  ), 0, 100);

  const confidenceModifier = 0.9 + safeDivide(sciRaw, 1000, 0); // Confidence modifier only
  riskScore = clamp(Math.round(riskScore * confidenceModifier), 0, 100);
  
  let riskTier: RiskOutput['tier'] = 'Minimal';
  if (riskScore > 75) riskTier = 'Critical';
  else if (riskScore > 55) riskTier = 'High';
  else if (riskScore > 35) riskTier = 'Moderate';
  else if (riskScore > 15) riskTier = 'Low';

  // Refined Trend Engine: consider overall regSlope, baseline drift, and rolling averages
  let riskTrend = 'Stable';
  const longTermSlope = regSlope;
  const shortTermSlope = slope;
  
  if (longTermSlope > 0.8) {
    if (longTermSlope > 2.0 || shortTermSlope > 1.8) {
      riskTrend = 'Rapid Deterioration';
    } else if (longTermSlope > 1.2 || shortTermSlope > 1.0) {
      riskTrend = 'Worsening';
    } else {
      riskTrend = 'Slow Deterioration';
    }
  } else if (longTermSlope < -0.8) {
    if (shortTermSlope < -1.5) {
      riskTrend = 'Improving';
    } else if (shortTermSlope > 1.5) {
      riskTrend = 'Worsening'; // Rebound deterioration
    } else {
      riskTrend = 'Stable';
    }
  } else {
    // Flat long-term slope
    if (shortTermSlope > 1.8) {
      riskTrend = 'Worsening';
    } else if (shortTermSlope < -1.8) {
      riskTrend = 'Improving';
    } else {
      riskTrend = 'Stable';
    }
  }

  const riskDrivers: string[] = [];
  if (ecStatus === 'Active' || ecStatus === 'Escalating') {
    riskDrivers.push(compositeName);
  }
  if (sdScore > 35 && !riskDrivers.includes("Silent Deterioration")) {
    riskDrivers.push("Silent Deterioration");
  }
  if (cbScore > 50 && !riskDrivers.includes("Chronic Burden")) {
    riskDrivers.push("Chronic Burden");
  }
  if (bdiRaw > 45 && !riskDrivers.includes("Baseline Deviation")) {
    riskDrivers.push("Baseline Deviation");
  }
  if (volRaw > 40 && !riskDrivers.includes("Glycemic Volatility")) {
    riskDrivers.push("Glycemic Volatility");
  }
  if (riskDrivers.length === 0) {
    riskDrivers.push('Stable Baseline');
  }

  const riskAmplifiers: string[] = [];
  const riskReducers: string[] = [];

  if (volRaw > 50) riskAmplifiers.push("High Volatility (+20% variance)");
  if (viRaw > 55) riskAmplifiers.push("Increasing Upward Velocity");
  if (aiRaw > 60) riskAmplifiers.push("Worsening Acceleration");
  if (ecStatus === 'Active' || ecStatus === 'Escalating') riskAmplifiers.push("Active Emerging Crisis Linkage");

  if (viTrend === 'down') riskReducers.push("Positive Downward Recovery Trajectory");
  if (bdiRaw < 25) riskReducers.push("Target Range Fasting Stability");
  if (volRaw < 20) riskReducers.push("Low Volatility Mitigation");
  if (riskAmplifiers.length === 0) {
    riskReducers.push("Stable Trajectory Safeguards");
  }

  const risk: RiskOutput = {
    score: riskScore,
    confidence: Math.round(sciRaw),
    tier: riskTier,
    trend: riskTrend,
    drivers: riskDrivers,
    amplifiers: riskAmplifiers,
    reducers: riskReducers
  };

  // 6. Explainability Summary & Limitations
  let summary = `Reasoning Analysis: The patient shows an average glucose of ${Math.round(avg)} mg/dL over a ${spanDays}-day period. `;
  if (riskTier === 'Critical' || riskTier === 'High') {
    summary += `Critical risks are present due to high ${riskDrivers.join(' and ')}. Immediate clinical intervention is recommended to stabilize baseline elevations and reduce variability.`;
  } else if (riskTier === 'Moderate') {
    summary += `Moderate metabolic instability detected, primarily driven by ${riskDrivers[0]}. Continued observation and monitoring are advised.`;
  } else {
    summary += `Glycemic parameters are within acceptable clinical targets. Dynamic markers indicate minimal risk of deterioration.`;
  }

  const limitations: string[] = [];
  if (count < 10) {
    limitations.push(`Low data density (${count} measurements total). Recommend more frequent checking.`);
  }
  if (spanDays < 7) {
    limitations.push(`Short observation window (${spanDays} days). Temporal trends may not represent long-term states.`);
  }
  
  const hoursSpan = spanDays * 24;
  const avgIntervalHours = hoursSpan / count;
  if (avgIntervalHours > 12) {
    limitations.push(`Measurements are sparse (average interval of ${avgIntervalHours.toFixed(1)} hours). Gaps may mask peak readings.`);
  }

  if (limitations.length === 0) {
    limitations.push("High data density. No significant quality limitations identified.");
  }

  const explainability: ExplainabilityOutput = {
    summary,
    drivers: riskDrivers,
    limitations
  };

  const dataQuality = sciRaw > 80 ? 'high' : sciRaw > 50 ? 'moderate' : 'low';

  // 5.5 Recommendation Engine (TCARE Foundation)
  const recommendations: RecommendationDetail[] = [];
  if (ecStatus === 'Active' || ecStatus === 'Escalating' || ecStatus === 'Emerging') {
    recommendations.push({
      type: 'PRIMARY',
      title: "Increase Glucose Monitoring Frequency",
      confidence: "High",
      benefit: "Earlier instability detection and acute crisis prevention",
      source: "Emerging Crisis"
    });
    recommendations.push({
      type: 'SECONDARY',
      title: "Initiate Continuous Glucose Monitor (CGM) Assessment",
      confidence: "High",
      benefit: "Real-time visibility into rapid volatility swings",
      source: "High Variability"
    });
    recommendations.push({
      type: 'SUPPORTING',
      title: "Perform Insulin Regimen Sensitivity Audit",
      confidence: "Moderate",
      benefit: "Correction of nocturnal and early morning trajectory acceleration",
      source: "Silent Deterioration"
    });
  } else if (cbScore > 50) {
    recommendations.push({
      type: 'PRIMARY',
      title: "Establish Structured Nutritional Counseling",
      confidence: "Very High",
      benefit: "Reduction of prolonged hyperglycemic exposure (CBI)",
      source: "Chronic Burden"
    });
    recommendations.push({
      type: 'SECONDARY',
      title: "Review Basal Insulin Dose Titration",
      confidence: "High",
      benefit: "Lowering baseline fasting deviation (BDI)",
      source: "Baseline Deviation Index"
    });
    recommendations.push({
      type: 'SUPPORTING',
      title: "Schedule Hemoglobin A1c Assay Check",
      confidence: "High",
      benefit: "Corroborate long-term burden metrics with laboratory tests",
      source: "Chronic Burden"
    });
  } else if (frScore > 40) {
    recommendations.push({
      type: 'PRIMARY',
      title: "Exercise Caution with Therapy Reductions",
      confidence: "High",
      benefit: "Avoidance of premature dosage de-escalation",
      source: "False Recovery"
    });
    recommendations.push({
      type: 'SECONDARY',
      title: "Conduct Postprandial Challenge Test",
      confidence: "Moderate",
      benefit: "Verify post-meal stability before altering treatment plans",
      source: "False Recovery"
    });
    recommendations.push({
      type: 'SUPPORTING',
      title: "Validate Self-Monitoring Device Accuracy",
      confidence: "High",
      benefit: "Ensure readings represent true metabolic states",
      source: "State Confidence Index"
    });
  } else {
    recommendations.push({
      type: 'PRIMARY',
      title: "Maintain Current Therapeutic Regimen",
      confidence: "High",
      benefit: "Sustain metabolic stability and low trajectory deviation",
      source: "Stable Profile"
    });
    recommendations.push({
      type: 'SECONDARY',
      title: "Continue Weekly Logbook Reviews",
      confidence: "Moderate",
      benefit: "Early identification of potential baseline drifts",
      source: "State Confidence Index"
    });
    recommendations.push({
      type: 'SUPPORTING',
      title: "Routine Physical Activity Strategy Review",
      confidence: "High",
      benefit: "Optimize natural insulin sensitivity mechanisms",
      source: "Stable Profile"
    });
  }

  const rawAnalysis = {
    window: {
      measurementCount: count,
      totalDays: spanDays,
      dataQuality
    },
    metrics,
    states,
    compositeState,
    risk,
    explainability,
    recommendations
  };

  return postProcessAnalysis(rawAnalysis as any);
}

export function postProcessAnalysis(analysis: AnalysisResult): AnalysisResult {
  // 1. Composite influence on Risk (Consistency Rule 1 & Rule 5)
  // Ensure gates fallbacks exist for compositeState
  const rawComposite = analysis.compositeState;
  const states = analysis.states;
  
  const sdScore = states.sd.score;
  const hvScore = states.hv.score;
  const cbScore = states.cb.score;
  const frScore = states.fr.score;
  const tnrScore = states.tnr?.score ?? 0;
  const volRaw = analysis.metrics.vol.raw;
  const bdiRaw = analysis.metrics.bdi.raw;
  const cbiRaw = analysis.metrics.cbi.raw;
  const viRaw = analysis.metrics.vi.raw;

  const compositeGates = rawComposite.gates || [
    { name: "Silent Deterioration Active", met: sdScore >= 35 },
    { name: "High Variability Active", met: hvScore >= 35 },
    { name: "Persistence Duration Met (>= 3.0 Days)", met: rawComposite.persistenceDays >= 3.0 },
    { name: "Interaction Strength Met (>= 0.50)", met: rawComposite.interactionStrength >= 0.50 }
  ];

  const compositeState = {
    ...rawComposite,
    gates: compositeGates
  };

  let riskScore = analysis.risk.score;
  let riskTier = analysis.risk.tier;

  let compositeImpact = 0;
  if (compositeState.status === 'Active' || compositeState.status === 'Escalating') {
    compositeImpact = Math.round(compositeState.score * (compositeState.confidence / 100));
    // Composite contributes directly to Risk Score (Rule 5)
    riskScore = Math.min(100, riskScore + Math.round(compositeImpact * 0.5));
    
    // Prevent Low/Minimal risk for severe/high active composite states unless confidence is extremely low (< 30)
    if (compositeState.confidence >= 30) {
      if (compositeState.severity === 'Severe' || compositeState.severity === 'High') {
        const minScore = compositeState.severity === 'Severe' ? 76 : 56;
        if (riskScore < minScore) {
          riskScore = minScore;
        }
      } else if (compositeState.severity === 'Moderate') {
        if (riskScore < 36) {
          riskScore = 36;
        }
      }
    }
  }

  // Dynamic calibration capping ruleset
  let severeCount = 0;
  if (analysis.metrics.vol.raw > 60) severeCount++;
  if (states.sd.score > 80) severeCount++;
  if (analysis.metrics.ai.raw > 60) severeCount++;
  if ((compositeState.status === 'Active' || compositeState.status === 'Escalating') && compositeState.severity === 'Severe' && compositeState.name !== 'Hidden Escalation') severeCount++;
  if (compositeState.persistenceDays >= 7) severeCount++;
  if (analysis.risk.confidence > 70) severeCount++;

  if (severeCount >= 4) {
    // No additional cap, can go up to 100
  } else if (severeCount === 3) {
    riskScore = Math.min(90, riskScore);
  } else {
    riskScore = Math.min(85, riskScore);
  }

  // Recalculate Risk Tier based on updated riskScore
  if (riskScore > 75) riskTier = 'Critical';
  else if (riskScore > 55) riskTier = 'High';
  else if (riskScore > 35) riskTier = 'Moderate';
  else if (riskScore > 15) riskTier = 'Low';
  else riskTier = 'Minimal';

  const updatedRisk = {
    ...analysis.risk,
    score: riskScore,
    tier: riskTier
  };

  // 2. Calibrated, Personalized Recommendations
  const recConfidence = compositeState.confidence > 80 ? 'Very High' as const : compositeState.confidence > 60 ? 'High' as const : compositeState.confidence > 40 ? 'Moderate' as const : 'Low' as const;
  const recommendations: RecommendationDetail[] = [];

  // If Critical Risk, prepend Urgent Clinical Actions
  const isCriticalRisk = riskTier === 'Critical' || riskScore >= 76;
  if (isCriticalRisk) {
    const urgentActions: RecommendationDetail[] = [];
    
    // Always add Immediate Endocrinology Consultation
    urgentActions.push({
      type: 'URGENT',
      title: "Immediate Endocrinology Consultation",
      confidence: "Very High",
      benefit: "Prevent acute metabolic decomposition through specialist care",
      source: "Critical Glycemic Risk",
      activatedCompositeState: compositeState.name,
      physiologicalEffect: "Specialist optimization of treatment regimen"
    });
    
    // If high volatility or Emerging Crisis, add CGM Deployment
    if (hvScore > 45 || compositeState.name === 'Emerging Crisis' || compositeState.name === 'Chronic Crisis') {
      urgentActions.push({
        type: 'URGENT',
        title: "Continuous Glucose Monitoring Deployment",
        confidence: "Very High",
        benefit: "Continuous sensor telemetry to intercept glycemic spikes/crashes",
        source: "Critical Volatility Swings",
        activatedCompositeState: compositeState.name,
        physiologicalEffect: "Provides real-time alarms for imminent glycemic events"
      });
    }
    
    // If treatment non-responsiveness is active, add Medication Review
    if (tnrScore > 40 || compositeState.name === 'Refractory Deterioration') {
      urgentActions.push({
        type: 'URGENT',
        title: "Immediate Medication Review",
        confidence: "High",
        benefit: "Address therapeutic failure and agent resistance",
        source: "Treatment Non-Responsiveness",
        activatedCompositeState: compositeState.name,
        physiologicalEffect: "Titrate or rotate pharmaceutical agents to overcome resistance"
      });
    }
    
    // For Chronic Crisis or severe deterioration, add Emergency Metabolic Assessment
    if (compositeState.name === 'Chronic Crisis' || sdScore > 75) {
      urgentActions.push({
        type: 'URGENT',
        title: "Emergency Metabolic Assessment",
        confidence: "High",
        benefit: "Evaluate systemic complications and organ burden",
        source: "Severe Metabolic Strain",
        activatedCompositeState: compositeState.name,
        physiologicalEffect: "Assesses systemic markers (ketones, pH, electrolytes)"
      });
    }
    
    // For extreme cases, add Hospital Referral
    if (riskScore > 90) {
      urgentActions.push({
        type: 'URGENT',
        title: "Hospital Referral (when deterioration persists)",
        confidence: "High",
        benefit: "Inpatient stabilization under continuous clinical observation",
        source: "Extreme Glycemic Risk",
        activatedCompositeState: compositeState.name,
        physiologicalEffect: "Continuous intravenous insulin/glucose matching"
      });
    }

    // Fallback: Ensure at least one urgent action is present
    if (urgentActions.length === 0) {
      urgentActions.push({
        type: 'URGENT',
        title: "Immediate Endocrinology Consultation",
        confidence: "Very High",
        benefit: "Prevent acute metabolic decomposition through specialist care",
        source: "Critical Glycemic Risk",
        activatedCompositeState: compositeState.name,
        physiologicalEffect: "Specialist optimization of treatment regimen"
      });
    }

    recommendations.push(...urgentActions);
  }


  if (compositeState.status === 'Active' || compositeState.status === 'Escalating') {
    if (compositeState.name === 'Emerging Crisis') {
      recommendations.push({
        type: 'PRIMARY',
        title: "Urgent Outpatient Clinical Intervention",
        confidence: recConfidence,
        benefit: "Immediate stabilization of acute trajectory and prevention of metabolic crisis.",
        source: "Emerging Crisis",
        activatedCompositeState: "Emerging Crisis",
        activatedLatentState: "High Variability + Silent Deterioration",
        dominantMetric: "VOL + CBI",
        physiologicalEffect: "Reduces acute risk parameters and stabilizes glycemic swings."
      });
      recommendations.push({
        type: 'SECONDARY',
        title: "Initiate Continuous Glucose Monitor (CGM) Assessment",
        confidence: recConfidence,
        benefit: "High-frequency telemetry sampling to track rapid glycemic swings and close data capture blindspots.",
        source: "High Variability",
        activatedCompositeState: "Emerging Crisis",
        activatedLatentState: "High Variability",
        dominantMetric: "VOL",
        physiologicalEffect: "Closes data capture gaps and prevents sudden hypoglycemic events."
      });
      recommendations.push({
        type: 'SUPPORTING',
        title: "Perform Insulin Regimen Sensitivity Audit",
        confidence: 'Moderate',
        benefit: "Correction of nocturnal and early morning trajectory acceleration.",
        source: "Silent Deterioration",
        activatedCompositeState: "Emerging Crisis",
        activatedLatentState: "Silent Deterioration",
        dominantMetric: "VI",
        physiologicalEffect: "Arrests silent glycemic drift and lowers overall baseline deviation."
      });
    } else if (compositeState.name === 'Chronic Crisis') {
      recommendations.push({
        type: 'PRIMARY',
        title: "Schedule Urgent Regimen Sensitivity Audit",
        confidence: recConfidence,
        benefit: "Endocrinology intervention to address persistent hyperglycemia and severe variability simultaneously.",
        source: "Chronic Crisis",
        activatedCompositeState: "Chronic Crisis",
        activatedLatentState: "Chronic Burden + High Variability",
        dominantMetric: "BDI + VOL",
        physiologicalEffect: "Re-establishes metabolic baseline homeostasis while dampening glycemic swings."
      });
      recommendations.push({
        type: 'SECONDARY',
        title: "Establish Structured Nutritional Counseling",
        confidence: recConfidence,
        benefit: "Reduction of prolonged hyperglycemic exposure (CBI).",
        source: "Chronic Burden",
        activatedCompositeState: "Chronic Crisis",
        activatedLatentState: "Chronic Burden",
        dominantMetric: "CBI",
        physiologicalEffect: "Lowers cumulative glucose toxicity area."
      });
      recommendations.push({
        type: 'SUPPORTING',
        title: "Initiate Continuous Glucose Monitor (CGM) Assessment",
        confidence: 'High',
        benefit: "High-frequency tracking to identify daily glycemic instability.",
        source: "High Variability",
        activatedCompositeState: "Chronic Crisis",
        activatedLatentState: "High Variability",
        dominantMetric: "VOL",
        physiologicalEffect: "Enables real-time alerting for rapid spikes/crashes."
      });
    } else if (compositeState.name === 'Refractory Deterioration') {
      recommendations.push({
        type: 'PRIMARY',
        title: "Schedule Urgent Regimen Sensitivity Audit",
        confidence: recConfidence,
        benefit: "Investigation into medication resistance and alternative agent titration.",
        source: "Refractory Deterioration",
        activatedCompositeState: "Refractory Deterioration",
        activatedLatentState: "Treatment Non-Responsiveness",
        dominantMetric: "CBI + BDI",
        physiologicalEffect: "Overcomes cellular insulin resistance via agent modifications."
      });
      recommendations.push({
        type: 'SECONDARY',
        title: "Review Basal Insulin Dose Titration",
        confidence: recConfidence,
        benefit: "Optimizes therapeutic timing to counter slow creeping baseline rise.",
        source: "Silent Deterioration",
        activatedCompositeState: "Refractory Deterioration",
        activatedLatentState: "Silent Deterioration",
        dominantMetric: "VI",
        physiologicalEffect: "Arrests silent glycemic drift and lowers overall baseline deviation."
      });
      recommendations.push({
        type: 'SUPPORTING',
        title: "Perform Insulin Regimen Sensitivity Audit",
        confidence: 'Moderate',
        benefit: "Validates glycemic recovery curves under controlled loads.",
        source: "Treatment Non-Responsiveness",
        activatedCompositeState: "Refractory Deterioration",
        activatedLatentState: "Treatment Non-Responsiveness",
        dominantMetric: "BDI",
        physiologicalEffect: "Assesses physiological response to clinical titration."
      });
    } else if (compositeState.name === 'Unstable Plateau') {
      recommendations.push({
        type: 'PRIMARY',
        title: "Schedule Urgent Regimen Sensitivity Audit",
        confidence: recConfidence,
        benefit: "Basal insulin regimen titration to safely pull down the high flat glucose plateau.",
        source: "Unstable Plateau",
        activatedCompositeState: "Unstable Plateau",
        activatedLatentState: "Chronic Burden",
        dominantMetric: "BDI",
        physiologicalEffect: "Lowers fasting baseline glucose to reduce long-term physiological stress."
      });
      recommendations.push({
        type: 'SECONDARY',
        title: "Initiate Continuous Glucose Monitor (CGM) Assessment",
        confidence: recConfidence,
        benefit: "Real-time alerts for micro-swings before they cross critical boundaries.",
        source: "High Variability",
        activatedCompositeState: "Unstable Plateau",
        activatedLatentState: "High Variability",
        dominantMetric: "VOL",
        physiologicalEffect: "Implements real-time alerting to prevent acute glycemic excursions."
      });
      recommendations.push({
        type: 'SUPPORTING',
        title: "Establish Structured Nutritional Counseling",
        confidence: 'High',
        benefit: "Carbohydrate management to prevent postprandial swings.",
        source: "Chronic Burden",
        activatedCompositeState: "Unstable Plateau",
        activatedLatentState: "Chronic Burden",
        dominantMetric: "CBI",
        physiologicalEffect: "Reduces post-meal glucose spikes and toxicity area."
      });
    } else if (compositeState.name === 'Hidden Escalation') {
      recommendations.push({
        type: 'PRIMARY',
        title: "Review Basal Insulin Dose Titration",
        confidence: recConfidence,
        benefit: "Reduction of baseline glycemic creep and postprandial burden.",
        source: "Silent Deterioration",
        activatedCompositeState: "Hidden Escalation",
        activatedLatentState: "Silent Deterioration",
        dominantMetric: "VI",
        physiologicalEffect: "Restricts baseline creep and aligns insulin coverage."
      });
      recommendations.push({
        type: 'SECONDARY',
        title: "Structured Nutritional Counseling Intake",
        confidence: recConfidence,
        benefit: "Diagnostic review to address creeping baseline glucose masked by low volatility.",
        source: "Hidden Escalation",
        activatedCompositeState: "Hidden Escalation",
        activatedLatentState: "Silent Deterioration",
        dominantMetric: "CBI",
        physiologicalEffect: "Identifies progressive beta-cell fatigue or secondary metabolic triggers."
      });
      recommendations.push({
        type: 'SUPPORTING',
        title: "Escalate Continuous Glucose Monitoring (CGM)",
        confidence: 'High',
        benefit: "Continuous tracking of glycemic velocity trends and volatility indexes.",
        source: "High Variability",
        activatedCompositeState: "Hidden Escalation",
        activatedLatentState: "High Variability",
        dominantMetric: "VOL",
        physiologicalEffect: "Provides real-time telemetry to detect rapid slope transitions."
      });
      recommendations.push({
        type: 'SUPPORTING',
        title: "Schedule Hemoglobin A1c Assay Check",
        confidence: 'High',
        benefit: "Corroborate long-term burden metrics with laboratory tests.",
        source: "Chronic Burden",
        activatedCompositeState: "Hidden Escalation",
        activatedLatentState: "Chronic Burden",
        dominantMetric: "BDI",
        physiologicalEffect: "Measures glycosylated hemoglobin fraction."
      });
    }
  } else if (cbScore > 50 || bdiRaw > 40) {
    recommendations.push({
      type: 'PRIMARY',
      title: "Establish Structured Nutritional Counseling",
      confidence: 'Very High',
      benefit: "Corrects baseline fasting deviations and shifts averages toward targets.",
      source: "Baseline Deviation Index",
      activatedLatentState: "Chronic Burden",
      dominantMetric: "BDI",
      physiologicalEffect: "Reduces fasting hyperglycemia and stabilizes baseline."
    });
    recommendations.push({
      type: 'SECONDARY',
      title: "Review Basal Insulin Dose Titration",
      confidence: 'High',
      benefit: "Lowering baseline fasting deviation (BDI).",
      source: "Baseline Deviation Index",
      activatedLatentState: "Chronic Burden",
      dominantMetric: "BDI",
      physiologicalEffect: "Pulls down fasting averages safely."
    });
    recommendations.push({
      type: 'SUPPORTING',
      title: "Schedule Hemoglobin A1c Assay Check",
      confidence: 'High',
      benefit: "Corroborates long-term cumulative burden with laboratory assays.",
      source: "Chronic Burden",
      activatedLatentState: "Chronic Burden",
      dominantMetric: "CBI",
      physiologicalEffect: "Measures 3-month mean glucose saturation."
    });
  } else if (hvScore > 50 || volRaw > 45) {
    recommendations.push({
      type: 'PRIMARY',
      title: "Escalate Continuous Glucose Monitoring (CGM)",
      confidence: 'High',
      benefit: "Provides real-time visibility into rapid volatility swings.",
      source: "High Variability",
      activatedLatentState: "High Variability",
      dominantMetric: "VOL",
      physiologicalEffect: "Uncovers daily glycemic fluctuations and captures spikes/crashes."
    });
    recommendations.push({
      type: 'SECONDARY',
      title: "Meal Timing & Insulin Pacing Optimization",
      confidence: 'Moderate',
      benefit: "Reduces postprandial volatility swings.",
      source: "High Variability",
      activatedLatentState: "High Variability",
      dominantMetric: "VOL",
      physiologicalEffect: "Aligns therapeutic dose curves with carbohydrate absorption rates."
    });
    recommendations.push({
      type: 'SUPPORTING',
      title: "Validate Self-Monitoring Device Accuracy",
      confidence: 'High',
      benefit: "Ensure readings represent true metabolic states.",
      source: "State Confidence Index",
      activatedLatentState: "State Confidence",
      dominantMetric: "SCI",
      physiologicalEffect: "Ensures sensor calibration limits are maintained."
    });
  } else if (sdScore > 35 || viRaw > 50) {
    recommendations.push({
      type: 'PRIMARY',
      title: "Structured Nutritional Counseling Intake",
      confidence: 'High',
      benefit: "Arrests the creeping upward velocity in glucose levels.",
      source: "Silent Deterioration",
      activatedLatentState: "Silent Deterioration",
      dominantMetric: "VI",
      physiologicalEffect: "Restores nocturnal and fasting metabolic equilibrium."
    });
    recommendations.push({
      type: 'SECONDARY',
      title: "Review Basal Insulin Dose Titration",
      confidence: 'Moderate',
      benefit: "Early adjustment of therapy before significant chronic burden accumulates.",
      source: "Silent Deterioration",
      activatedLatentState: "Silent Deterioration",
      dominantMetric: "CBI",
      physiologicalEffect: "Restores cellular glucose uptake rates."
    });
    recommendations.push({
      type: 'SUPPORTING',
      title: "Establish Structured Nutritional Counseling",
      confidence: 'High',
      benefit: "Picks up diet-induced creep trends early.",
      source: "Chronic Burden",
      activatedLatentState: "Chronic Burden",
      dominantMetric: "CBI",
      physiologicalEffect: "Mitigates early postprandial load spikes."
    });
  } else if (frScore > 40) {
    recommendations.push({
      type: 'PRIMARY',
      title: "Escalate Continuous Glucose Monitoring (CGM)",
      confidence: 'High',
      benefit: "Avoids premature dosage de-escalation based on transient improvements.",
      source: "False Recovery",
      activatedLatentState: "False Recovery",
      dominantMetric: "VOL",
      physiologicalEffect: "Maintains therapeutic levels to allow true metabolic stabilization."
    });
    recommendations.push({
      type: 'SECONDARY',
      title: "Conduct Postprandial Challenge Test",
      confidence: 'Moderate',
      benefit: "Verifies mealtime stability before altering treatment plans.",
      source: "False Recovery",
      activatedLatentState: "False Recovery",
      dominantMetric: "BDI",
      physiologicalEffect: "Validates glycemic recovery curves under controlled loads."
    });
    recommendations.push({
      type: 'SUPPORTING',
      title: "Validate Self-Monitoring Device Accuracy",
      confidence: 'High',
      benefit: "Ensure readings represent true metabolic states.",
      source: "State Confidence Index",
      activatedLatentState: "State Confidence",
      dominantMetric: "SCI",
      physiologicalEffect: "Ensures sensor calibration limits are maintained."
    });
  } else {
    recommendations.push({
      type: 'PRIMARY',
      title: "Maintain Current Therapeutic Regimen",
      confidence: 'High',
      benefit: "Sustains homeostatic glycemic stability and low trajectory deviation.",
      source: "Stable Profile",
      activatedLatentState: "None",
      dominantMetric: "BDI",
      physiologicalEffect: "Supports natural metabolic equilibrium and avoids therapy perturbation."
    });
    recommendations.push({
      type: 'SECONDARY',
      title: "Continue Weekly Logbook Reviews",
      confidence: 'Moderate',
      benefit: "Early identification of potential baseline drift or signal variations.",
      source: "State Confidence Index",
      activatedLatentState: "State Confidence",
      dominantMetric: "SCI",
      physiologicalEffect: "Ensures data density remains optimal to prevent blindspots."
    });
    recommendations.push({
      type: 'SUPPORTING',
      title: "Routine Physical Activity Strategy Review",
      confidence: 'High',
      benefit: "Sustains natural insulin sensitivity pathways.",
      source: "Stable Profile",
      activatedLatentState: "None",
      dominantMetric: "VOL",
      physiologicalEffect: "Maintains skeletal muscle glucose clearance."
    });
  }

  // 3. Reasoning Confidence (Consistency Rule 4)
  const stateConf = Math.round((states.sd.confidence + states.fr.confidence + states.cb.confidence + states.hv.confidence) / 4);
  const recConfMap = { 'Low': 40, 'Moderate': 70, 'High': 85, 'Very High': 95 };
  const avgRecConf = recommendations.length > 0 
    ? Math.round(recommendations.reduce((sum, r) => sum + recConfMap[r.confidence], 0) / recommendations.length)
    : 100;

  const reasoningConfidence = {
    stateConfidence: stateConf,
    compositeConfidence: compositeState.confidence,
    riskConfidence: updatedRisk.confidence,
    recommendationConfidence: avgRecConf
  };

  // 3.5 Dynamic Clinical Narrative Summary
  const dominantStateEntry = Object.entries(states)
    .filter(([key]) => key !== 'sc')
    .sort((a, b) => b[1].score - a[1].score)[0];
  
  const stateNameMap: Record<string, string> = {
    sd: 'Silent Deterioration',
    fr: 'False Recovery',
    cb: 'Chronic Burden',
    hv: 'High Variability',
    rd: 'Recovery Deceleration',
    tc: 'Threshold Convergence',
    tnr: 'Treatment Non-Responsiveness'
  };

  const dominantStateName = stateNameMap[dominantStateEntry[0]] || 'State Confidence';
  const dominantStateScore = dominantStateEntry[1].score;

  let summary = `Reasoning Analysis: Patient clinical profile evaluated over a ${analysis.window.totalDays}-day observation window with ${analysis.window.measurementCount} telemetry readings. `;

  if (compositeState.status === 'Active' || compositeState.status === 'Escalating') {
    summary += `A composite state of ${compositeState.name} is active (score: ${compositeState.score}), indicating a dangerous interaction between latent profiles. `;
    if (compositeState.name === 'Emerging Crisis') {
      summary += `Silent deterioration creep and rapid glycemic volatility are destabilizing the metabolic profile. `;
    } else if (compositeState.name === 'Chronic Crisis') {
      summary += `Sustained baseline elevation and high volatility have coupled to create long-term physiological stress. `;
    } else if (compositeState.name === 'Refractory Deterioration') {
      summary += `The patient exhibits progressive glycemic worsening despite documented clinical treatment, indicating failed therapeutic responsiveness. `;
    } else if (compositeState.name === 'Hidden Escalation') {
      summary += `Creeping glucose accumulation is occurring under high data confidence with minimal volatility, masking critical alerts. `;
    } else if (compositeState.name === 'Unstable Plateau') {
      summary += `Glucose level remains locked at an elevated flat plateau with high micro-fluctuations. `;
    }
  } else {
    summary += `No active composite crisis is detected. The profile is dominantly characterized by ${dominantStateName} (score: ${dominantStateScore}). `;
  }

  summary += `Synthesized TCRE Risk is graded as ${riskTier} (score: ${riskScore}) because `;
  if (volRaw > 45) {
    summary += `extreme glycemic standard deviations (+${volRaw}%) and rapid swings present an acute risk of spikes and crashes. `;
  } else if (cbiRaw > 40) {
    summary += `prolonged exposure to toxic glucose concentrations (CBI: ${cbiRaw}%) accumulates substantial physiological burden over time. `;
  } else {
    summary += `metabolic parameters remain within target bounds with low volatility. `;
  }

  const primaryRec = recommendations.find(r => r.type === 'PRIMARY');
  if (primaryRec) {
    summary += `To address the primary driver of ${primaryRec.source}, the clinical priority is to initiate ${primaryRec.title} to restore homeostatic balance.`;
  }

  const updatedExplainability = {
    ...analysis.explainability,
    summary,
    drivers: [compositeState.status !== 'Inactive' && compositeState.status !== 'Candidate' ? compositeState.name : dominantStateName]
  };

  // 4. Reasoning Chain Validation Checks (Consistency Rule 3)
  const warnings: string[] = [];
  
  // State Consistency Check
  let stateStatus: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
  let stateMsg = "All latent state scores are consistent with eligibility gates and telemetry metrics.";
  if (states.sd.score > 35 && states.sd.gates && states.sd.gates.length > 0 && states.sd.gates.filter(g => g.met).length === 0) {
    stateStatus = 'FAIL';
    stateMsg = "Silent Deterioration is active but all of its activation gates are bypassed.";
    warnings.push("State Consistency Check: Silent Deterioration score is elevated while activation gates are unmet.");
  }
  
  // Composite Consistency Check
  let compositeStatus: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
  let compositeMsg = "Composite state synthesis matches constituent latent state intensities and activation criteria.";
  
  if (compositeState.status === 'Candidate') {
    compositeStatus = 'WARNING';
    compositeMsg = "Composite Candidate Detected: Emerging Crisis is in candidate stage due to unmet activation rules.";
    warnings.push("Composite Consistency Check: Composite Candidate Detected (unmet activation rules).");
  } else if ((compositeState.status === 'Active' || compositeState.status === 'Escalating') && 
             (compositeState.interactionStrength < 0.5 || compositeState.persistenceDays < 3.0)) {
    compositeStatus = 'FAIL';
    compositeMsg = "FAIL: Composite Activated Without Sufficient Interaction strength or Persistence duration.";
    warnings.push("Composite Consistency Check: Composite Activated Without Sufficient Interaction/Persistence.");
  } else {
    const highStateExists = states.sd.score > 50 || states.hv.score > 50;
    if (highStateExists && compositeState.status === 'Inactive') {
      compositeStatus = 'WARNING';
      compositeMsg = "High active latent states (SD or HV) detected but Emerging Crisis composite state remains Inactive.";
      warnings.push("Composite Consistency Check: Emerging Crisis is Inactive despite severe individual latent state inputs.");
    }
  }

  // Risk Consistency Check
  let riskStatus: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
  let riskMsg = "Risk synthesis tier aligns with composite state intensity.";
  if (compositeState.status !== 'Inactive' && compositeState.status !== 'Candidate' && compositeState.severity === 'Severe' && (updatedRisk.tier === 'Low' || updatedRisk.tier === 'Minimal')) {
    if (compositeState.confidence >= 30) {
      riskStatus = 'FAIL';
      riskMsg = "Severe active composite state exists but Risk Tier is Low/Minimal.";
      warnings.push("Risk Consistency Check: Risk Tier is Low/Minimal despite active Severe Emerging Crisis with sufficient confidence.");
    }
  }

  // Recommendation Consistency Check
  let recStatus: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
  let recMsg = "Clinician recommendations are proportional to the synthesized metabolic risk tier.";
  if (primaryRec) {
    if ((updatedRisk.tier === 'Critical' || updatedRisk.tier === 'High') && primaryRec.title.includes("Observation")) {
      recStatus = 'FAIL';
      recMsg = "Weak recommendation ('Observation') provided for High/Critical metabolic risk.";
      warnings.push("Recommendation Consistency Check: Weak clinician advice generated for a high-risk patient state.");
    }
    if ((updatedRisk.tier === 'Minimal' || updatedRisk.tier === 'Low') && primaryRec.title.includes("Urgent")) {
      recStatus = 'WARNING';
      recMsg = "Aggressive recommendation ('Urgent') provided for Low/Minimal metabolic risk.";
      warnings.push("Recommendation Consistency Check: Over-aggressive recommendation generated for a low-risk patient state.");
    }
  }

  const consistencyReport = {
    overallPassed: stateStatus !== 'FAIL' && compositeStatus !== 'FAIL' && riskStatus !== 'FAIL' && recStatus !== 'FAIL',
    checks: {
      stateCheck: { status: stateStatus, name: "State Consistency Check", message: stateMsg },
      compositeCheck: { status: compositeStatus, name: "Composite Consistency Check", message: compositeMsg },
      riskCheck: { status: riskStatus, name: "Risk Consistency Check", message: riskMsg },
      recommendationCheck: { status: recStatus, name: "Recommendation Consistency Check", message: recMsg }
    },
    warnings
  };

  const finalResult = {
    ...analysis,
    compositeState,
    risk: updatedRisk,
    recommendations,
    explainability: updatedExplainability,
    reasoningConfidence,
    consistencyReport
  };

  return sanitizeAndValidateAnalysis(finalResult);
}

function sanitizeAndValidateAnalysis(analysis: AnalysisResult): AnalysisResult {
  // Helpers for clamping and fallback
  const cleanScore = (val: any) => clamp(typeof val === 'number' ? val : Number(val), 0, 100);
  const cleanConf = (val: any) => clamp(typeof val === 'number' ? val : Number(val), 0, 100);

  // Validate metrics
  const cleanMetrics: any = {};
  for (const key of Object.keys(analysis.metrics) as (keyof MetricsOutput)[]) {
    const metric = analysis.metrics[key];
    cleanMetrics[key] = {
      raw: cleanScore(metric.raw),
      normalized: cleanScore(metric.normalized),
      confidence: cleanConf(metric.confidence),
      trend: metric.trend || 'flat'
    };
  }

  // Validate states
  const cleanStates: any = {};
  for (const key of Object.keys(analysis.states) as (keyof LatentStatesOutput)[]) {
    const state = analysis.states[key];
    if (!state) continue;
    cleanStates[key] = {
      ...state,
      score: cleanScore(state.score),
      confidence: cleanConf(state.confidence),
      severity: state.severity || 'Normal',
      status: state.status || 'Inactive',
      evidence: (state.evidence || []).map((e: string) => String(e).replace(/\bNaN\b/g, "0")),
      contributions: (state.contributions || []).map((c: any) => ({
        ...c,
        value: cleanScore(c.value)
      }))
    };
  }

  // Validate compositeState
  const rawComp = analysis.compositeState;
  const cleanComposite: CompositeStateOutput = {
    ...rawComp,
    score: cleanScore(rawComp.score),
    confidence: cleanConf(rawComp.confidence),
    interactionStrength: clamp(Number(rawComp.interactionStrength), 0, 1.0),
    persistenceDays: clamp(Number(rawComp.persistenceDays), 0, 100),
    contributingStates: (rawComp.contributingStates || []).map((cs: any) => ({
      ...cs,
      score: cleanScore(cs.score)
    }))
  };

  // Validate risk
  const rawRisk = analysis.risk;
  const cleanRisk: RiskOutput = {
    ...rawRisk,
    score: cleanScore(rawRisk.score),
    confidence: cleanConf(rawRisk.confidence),
    drivers: (rawRisk.drivers || []).map(d => String(d))
  };

  // Sanitize text summary and explainability summaries
  const sanitizeText = (txt: string) => {
    if (!txt) return "";
    return txt.replace(/\bNaN\b/g, "Unknown");
  };

  const cleanExplainability: ExplainabilityOutput = {
    summary: sanitizeText(analysis.explainability.summary),
    drivers: (analysis.explainability.drivers || []).map(d => String(d)),
    limitations: (analysis.explainability.limitations || []).map(l => sanitizeText(l))
  };

  return {
    ...analysis,
    metrics: cleanMetrics,
    states: cleanStates,
    compositeState: cleanComposite,
    risk: cleanRisk,
    explainability: cleanExplainability
  };
}

function createEmptyAnalysis(): AnalysisResult {
  const zeroMetric = { raw: 0, normalized: 0, confidence: 100, trend: 'flat' as const };
  const zeroState = (name: string) => ({
    score: 0,
    confidence: 100,
    severity: 'Normal' as const,
    status: 'Inactive',
    evidence: [`No measurements available to assess ${name}.`],
    contributions: [],
    gates: [],
    limitingFactors: [],
    reasoningTree: [],
    reasoningNarrative: "No data available."
  });
  return {
    window: { measurementCount: 0, totalDays: 0, dataQuality: 'low' },
    metrics: { vi: zeroMetric, ai: zeroMetric, vol: zeroMetric, bdi: zeroMetric, cbi: zeroMetric, sci: zeroMetric },
    states: {
      sd: zeroState('Silent Deterioration'),
      fr: zeroState('False Recovery'),
      cb: zeroState('Chronic Burden'),
      hv: zeroState('High Variability'),
      rd: zeroState('Recovery Deceleration'),
      tc: zeroState('Threshold Convergence'),
      tnr: zeroState('Treatment Non-Responsiveness'),
      sc: zeroState('State Confidence')
    },
    compositeState: {
      name: "Emerging Crisis",
      score: 0,
      confidence: 100,
      severity: 'Normal' as const,
      status: 'Inactive',
      contributingStates: [
        { name: "Silent Deterioration", score: 0 },
        { name: "High Variability", score: 0 }
      ],
      interactionStrength: 0,
      persistenceDays: 0,
      reasoningNarrative: "No data available.",
      gates: []
    },
    risk: { score: 0, confidence: 100, tier: 'Minimal', trend: 'Stable', drivers: ['No Data Available'], amplifiers: [], reducers: [] },
    explainability: {
      summary: "No clinical data has been uploaded or entered yet. Please add measurements to initiate reasoning analysis.",
      drivers: ['No Data Available'],
      limitations: ["No data entered."]
    },
    recommendations: [],
    reasoningConfidence: {
      stateConfidence: 100,
      compositeConfidence: 100,
      riskConfidence: 100,
      recommendationConfidence: 100
    },
    consistencyReport: {
      overallPassed: true,
      checks: {
        stateCheck: { status: 'PASS', name: "State Consistency Check", message: "No data available." },
        compositeCheck: { status: 'PASS', name: "Composite Consistency Check", message: "No data available." },
        riskCheck: { status: 'PASS', name: "Risk Consistency Check", message: "No data available." },
        recommendationCheck: { status: 'PASS', name: "Recommendation Consistency Check", message: "No data available." }
      },
      warnings: []
    }
  };
}

/**
 * API function to analyze blood glucose measurements
 */
export async function analyzeGlucose(
  measurements: Measurement[],
  windowDays: number | null
): Promise<AnalysisResult> {
  try {
    // Base URL check not required since relative path is supported
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        measurements,
        window_days: windowDays
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }
    
    const rawResult = await response.json();
    return postProcessAnalysis(rawResult);
  } catch (error) {
    console.warn("Express backend is offline or failed. Falling back to high-fidelity client-side calculations.", error);
    // Dynamic client side generation
    return generateLocalAnalysis(measurements, windowDays);
  }
}

/**
 * API function to upload a CSV file and return parsed measurements
 */
export async function uploadCsvApi(file: File): Promise<Measurement[]> {
  try {
    // Base URL check not required since relative path is supported
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/api/upload-csv`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.measurements;
  } catch (error) {
    console.warn("Express backend CSV upload failed. Parsing file client-side.", error);
    // Parse CSV client-side as fallback
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          const measurements = parseCsvString(text);
          resolve(measurements);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("File reading failed"));
      reader.readAsText(file);
    });
  }
}

/**
 * Client-side CSV parser
 */
export function parseCsvString(text: string): Measurement[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one data row.');
  }

  const header = lines[0].toLowerCase();
  const headers = header.split(',').map(h => h.trim());
  
  // Check if it has PatientID/patient id -> indicates multi-patient format
  const isMultiPatient = headers.includes('patientid') || headers.includes('patient id');

  if (!isMultiPatient) {
    // Old/Single-patient CSV parsing logic
    const dateIdx = headers.findIndex(h => h.includes('date'));
    const glucoseIdx = headers.findIndex(h => h.includes('glucose'));
    
    if (dateIdx === -1 || glucoseIdx === -1) {
      throw new Error('CSV must include "Date" and "Glucose" columns in header');
    }
    
    const measurements: Measurement[] = [];
    let invalidCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const row = lines[i].split(',');
      
      const rawDate = row[dateIdx]?.trim();
      const rawGlucose = row[glucoseIdx]?.trim();
      
      if (!rawDate || !rawGlucose) {
        invalidCount++;
        continue;
      }
      
      const glucose = parseInt(rawGlucose, 10);
      
      if (isNaN(glucose) || glucose < 50 || glucose > 600) {
        invalidCount++;
        continue;
      }
      
      measurements.push({
        date: parseDate(rawDate),
        glucose,
        source: 'csv_upload'
      });
    }
    
    const totalRows = lines.length - 1;
    if (invalidCount > totalRows / 2) {
      throw new Error(`CSV parsing failed: ${invalidCount} of ${totalRows} rows had invalid formats or values outside range 50-600 mg/dL.`);
    }
    
    return measurements;
  }

  // Multi-patient CSV parsing logic
  const patientIdIdx = headers.findIndex(h => h === 'patientid' || h === 'patient id');
  const nameIdx = headers.findIndex(h => h === 'name');
  const ageIdx = headers.findIndex(h => h === 'age');
  const sexIdx = headers.findIndex(h => h === 'sex');
  const yearIdx = headers.findIndex(h => h === 'year');
  const monthIdx = headers.findIndex(h => h === 'month');
  const dayIdx = headers.findIndex(h => h === 'day');
  const hourIdx = headers.findIndex(h => h === 'hour');
  const minuteIdx = headers.findIndex(h => h === 'minute');
  const secondIdx = headers.findIndex(h => h === 'second');
  const glucoseIdx = headers.findIndex(h => h === 'glucose');
  const sugarIdx = headers.findIndex(h => h.includes('sugar') || h.includes('consumed'));

  if ([patientIdIdx, nameIdx, ageIdx, sexIdx, yearIdx, monthIdx, dayIdx, hourIdx, minuteIdx, secondIdx, glucoseIdx, sugarIdx].some(idx => idx === -1)) {
    throw new Error('CSV missing required columns. Expected: PatientID, Name, Age, Sex, Year, Month, Day, Hour, Minute, Second, Glucose, ConsumedSugarLast6Hours');
  }

  const measurements: Measurement[] = [];
  let invalidCount = 0;

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const row = lines[i].split(',');
    
    const patientId = row[patientIdIdx]?.trim();
    const name = row[nameIdx]?.trim();
    const rawAge = row[ageIdx]?.trim();
    const sex = row[sexIdx]?.trim();
    const rawYear = row[yearIdx]?.trim();
    const rawMonth = row[monthIdx]?.trim();
    const rawDay = row[dayIdx]?.trim();
    const rawHour = row[hourIdx]?.trim();
    const rawMinute = row[minuteIdx]?.trim();
    const rawSecond = row[secondIdx]?.trim();
    const rawGlucose = row[glucoseIdx]?.trim();
    const rawSugar = row[sugarIdx]?.trim();

    if (!patientId || !name || !rawAge || !sex || !rawYear || !rawMonth || !rawDay || !rawHour || !rawMinute || !rawSecond || !rawGlucose) {
      invalidCount++;
      continue;
    }

    const age = parseInt(rawAge, 10);
    const year = parseInt(rawYear, 10);
    const month = parseInt(rawMonth, 10);
    const day = parseInt(rawDay, 10);
    const hour = parseInt(rawHour, 10);
    const minute = parseInt(rawMinute, 10);
    const second = parseInt(rawSecond, 10);
    const glucose = parseInt(rawGlucose, 10);

    if (isNaN(age) || isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute) || isNaN(second) || isNaN(glucose)) {
      invalidCount++;
      continue;
    }

    if (glucose < 50 || glucose > 600) {
      invalidCount++;
      continue;
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}.000Z`;
    const sugarValue: 'YES' | 'NO' = rawSugar?.trim().toUpperCase() === 'YES' ? 'YES' : 'NO';

    measurements.push({
      date: dateStr,
      glucose,
      source: 'csv_upload',
      consumedSugarLast6Hours: sugarValue,
      patientId,
      name,
      age,
      sex
    } as any);
  }

  const totalRows = lines.length - 1;
  if (invalidCount > totalRows / 2) {
    throw new Error(`CSV parsing failed: ${invalidCount} of ${totalRows} rows had invalid formats or values outside range 50-600 mg/dL.`);
  }

  return measurements;
}

/**
 * Automatically evaluates the chronological evolution of latent states over the uploaded dataset.
 */
export function generateHistoricalTimeline(measurements: Measurement[]): TimelineNode[] {
  if (measurements.length === 0) return [];
  const sorted = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const firstDate = new Date(sorted[0].date);
  const lastDate = new Date(sorted[sorted.length - 1].date);
  const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
  const spanDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  const timeline: TimelineNode[] = [];

  // Generate up to 5 nodes at standard points across the duration
  const points = [1, Math.round(spanDays * 0.25), Math.round(spanDays * 0.5), Math.round(spanDays * 0.75), spanDays];
  const uniquePoints = Array.from(new Set(points)).filter(p => p > 0).sort((a, b) => a - b);

  uniquePoints.forEach((dayNum) => {
    // Subset of data up to this day
    const cutoffDate = new Date(firstDate);
    cutoffDate.setDate(cutoffDate.getDate() + dayNum);
    const subData = sorted.filter(m => new Date(m.date) <= cutoffDate);

    if (subData.length === 0) return;

    // Run sub-analysis
    const analysis = generateLocalAnalysis(subData, null);
    
    // Find active states
    const activeStates: string[] = [];
    if (analysis.states.sd.score > 35) activeStates.push("Silent Deterioration");
    if (analysis.states.fr.score > 35) activeStates.push("False Recovery");
    if (analysis.states.cb.score > 35) activeStates.push("Chronic Burden");
    if (analysis.states.hv.score > 35) activeStates.push("High Variability");
    if (analysis.compositeState.status === 'Active' || analysis.compositeState.status === 'Escalating') {
      activeStates.push(analysis.compositeState.name);
    }

    if (activeStates.length === 0) {
      activeStates.push("Normal");
    }

    const nodeDate = subData[subData.length - 1].date;
    const formattedDate = new Date(nodeDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    let description = `Glycemic states evaluated from ${subData.length} measurements.`;
    if (analysis.compositeState.status === 'Active' || analysis.compositeState.status === 'Escalating') {
      description = analysis.compositeState.reasoningNarrative || `Active composite state: ${analysis.compositeState.name}`;
    } else if (activeStates.includes("Silent Deterioration")) {
      description = "Gradual elevation of glycemic baseline detected with low apparent volatility.";
    } else if (activeStates.includes("High Variability")) {
      description = "Patient profile exhibits rapid swings and high volatility index.";
    } else if (activeStates.includes("False Recovery")) {
      description = "Dips in average glucose mimicking recovery, but background stress remains high.";
    }

    timeline.push({
      day: dayNum,
      date: formattedDate,
      states: activeStates,
      description
    });
  });

  return timeline;
}
