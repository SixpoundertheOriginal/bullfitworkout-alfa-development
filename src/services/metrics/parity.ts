import type { ServiceOutput } from '../metrics-v2';

export type ParityDiff = {
  mismatches: string[]; // e.g., ['totals.totalVolumeKg', 'prs.length', 'series.volume.len']
  totals?: { v1?: number; v2?: number };
  prsLength?: { v1?: number; v2?: number };
  seriesVolumeLen?: { v1?: number; v2?: number };
};

type PartialMetrics = {
  totals?: { totalVolumeKg?: unknown };
  prs?: unknown;
  series?: { volume?: unknown };
};

// Non-throwing summary comparator: returns null if "good enough" equal.
// Treats "presence/absence" or NaN vs number as a mismatch without throwing.
export function summarizeParityDiff(v1: unknown, v2: unknown): ParityDiff | null {
  const mismatches: string[] = [];

  const v1Data = v1 as PartialMetrics;
  const v2Data = v2 as (ServiceOutput & PartialMetrics) | PartialMetrics | undefined;

  // Total volume
  const v1Total = v1Data?.totals?.totalVolumeKg;
  const v2Total = v2Data?.totals?.totalVolumeKg;
  if (isFiniteNumber(v1Total) && isFiniteNumber(v2Total)) {
    if (v1Total !== v2Total) mismatches.push('totals.totalVolumeKg');
  } else if (v1Total !== v2Total) {
    mismatches.push('totals.totalVolumeKg.presence');
  }

  // PRs length
  const v1Prs = v1Data?.prs;
  const v2Prs = v2Data?.prs;
  const v1PrLen = Array.isArray(v1Prs) ? v1Prs.length : v1Prs;
  const v2PrLen = Array.isArray(v2Prs) ? v2Prs.length : v2Prs;
  if (isFiniteNumber(v1PrLen) && isFiniteNumber(v2PrLen)) {
    if (v1PrLen !== v2PrLen) mismatches.push('prs.length');
  } else if (v1PrLen !== v2PrLen) {
    mismatches.push('prs.length.presence');
  }

  // Volume series length
  const v1Vol = v1Data?.series?.volume;
  const v2Vol = v2Data?.series?.volume;
  const v1VolLen = Array.isArray(v1Vol) ? v1Vol.length : v1Vol;
  const v2VolLen = Array.isArray(v2Vol) ? v2Vol.length : v2Vol;
  if (isFiniteNumber(v1VolLen) && isFiniteNumber(v2VolLen)) {
    if (v1VolLen !== v2VolLen) mismatches.push('series.volume.len');
  } else if (v1VolLen !== v2VolLen) {
    mismatches.push('series.volume.len.presence');
  }

  if (mismatches.length === 0) return null;

  const diff: ParityDiff = { mismatches };
  if (isFiniteNumber(v1Total) || isFiniteNumber(v2Total)) diff.totals = { v1: Number(v1Total) || 0, v2: Number(v2Total) || 0 };
  if (isFiniteNumber(v1PrLen) || isFiniteNumber(v2PrLen)) diff.prsLength = { v1: Number(v1PrLen) || 0, v2: Number(v2PrLen) || 0 };
  if (isFiniteNumber(v1VolLen) || isFiniteNumber(v2VolLen)) diff.seriesVolumeLen = { v1: Number(v1VolLen) || 0, v2: Number(v2VolLen) || 0 };
  return diff;
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

