/**
 * Deterministic utility helpers for Temporal Clinical Reasoning Engine (TCRE)
 * Phase 6.1: Mathematical Integrity Layer
 */

/**
 * Clamps a number strictly to the specified range [min, max].
 * Prevents NaN, undefined, null, or Infinity propagation by falling back to min.
 */
export function clamp(val: number, min: number, max: number): number {
  if (val === undefined || val === null || typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
    return min;
  }
  return Math.min(max, Math.max(min, val));
}

/**
 * Safely divides two numbers, preventing division by zero, NaN, or Infinity.
 * Returns the fallback value if the division is invalid or results in non-finite value.
 */
export function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  if (
    numerator === undefined || numerator === null || typeof numerator !== 'number' || isNaN(numerator) ||
    denominator === undefined || denominator === null || typeof denominator !== 'number' || isNaN(denominator) ||
    denominator === 0
  ) {
    return fallback;
  }
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
}

/**
 * Normalizes a raw value against a scale/range to a 0-100 range.
 * Safely handles zero or invalid ranges and clamps results strictly to 0-100.
 */
export function normalize(val: number, range: number): number {
  if (range <= 0 || isNaN(range) || !isFinite(range)) {
    return 0;
  }
  const result = safeDivide(val, range) * 100;
  return clamp(result, 0, 100);
}

/**
 * Computes a weighted average of values and weights.
 * Gracefully handles zero/invalid weights sum and returns 0 as a fallback.
 */
export function weightedAverage(values: number[], weights: number[]): number {
  if (!values || !weights || values.length === 0 || values.length !== weights.length) {
    return 0;
  }
  let sumProd = 0;
  let sumWeights = 0;
  for (let i = 0; i < values.length; i++) {
    const v = (values[i] === undefined || values[i] === null || typeof values[i] !== 'number' || isNaN(values[i])) ? 0 : values[i];
    const w = (weights[i] === undefined || weights[i] === null || typeof weights[i] !== 'number' || isNaN(weights[i])) ? 0 : weights[i];
    if (w < 0) continue; // Skip negative weights
    sumProd += v * w;
    sumWeights += w;
  }
  return sumWeights === 0 ? 0 : safeDivide(sumProd, sumWeights, 0);
}

/**
 * Normalizes confidence values to a 0-100 scale.
 */
export function confidenceNormalize(confidence: number): number {
  return clamp(Math.round(confidence), 0, 100);
}
