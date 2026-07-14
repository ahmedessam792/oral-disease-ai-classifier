import type { ModelInfoResponse, PredictionResponse } from "./types";

export interface AnalysisReport {
  reportId: string;
  analyzedAt: string; // ISO
  result: PredictionResponse;
  modelInfo: ModelInfoResponse | null;
  elapsedMs: number | null;
  fileName: string | null;
}

/** Locally generated, non-identifying. Never leaves the browser except inside
 * the PDF the user downloads. */
export function makeReportId(analyzedAt: string): string {
  const date = new Date(analyzedAt);
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
  // 4 random chars keep two reports in the same second distinct.
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ARC-${stamp}-${suffix}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** arcus-analysis-report-YYYY-MM-DD-HHmm.pdf */
export function reportFileName(analyzedAt: string): string {
  const date = new Date(analyzedAt);
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}`;
  return `arcus-analysis-report-${day}-${time}.pdf`;
}

/**
 * Probabilities as displayed.
 *
 * A bare "0.0%" reads as "this class is impossible", which is not what a
 * softmax says. Anything that would round to 0.0 is shown as "<0.1%" instead.
 */
export function formatProbability(probability: number): string {
  const percent = probability * 100;
  if (percent > 0 && percent < 0.05) return "<0.1%";
  return `${percent.toFixed(1)}%`;
}

/** Bars keep a visible sliver so all classes are physically present, without
 * distorting the number beside them. */
export function barScale(probability: number): number {
  return Math.max(probability, 0.004);
}

/** Confidence, rounded DOWN — 99.9% must never display as 100%. */
export function displayConfidence(confidence: number): number {
  return Math.floor(confidence * 100);
}

export function sortedProbabilities(
  probabilities: Record<string, number>,
): [string, number][] {
  return Object.entries(probabilities).sort(([, a], [, b]) => b - a);
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
