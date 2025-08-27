import type { ServiceOutput } from '../metrics-v2';

export type ParityDiff = {
  mismatches: string[]; // e.g., ['totals.totalVolumeKg', 'prs.length', 'series.volume.len']
  totals?: { v1?: number; v2?: number };
  prsLength?: { v1: number; v2: number };
  seriesVolumeLen?: { v1: number; v2: number };
};

// Non-throwing summary comparator: returns null if "good enough" equal
export function summarizeParityDiff(v1: unknown, v2: unknown): ParityDiff | null {
  // We only compare a few load-bearing fields to avoid overfitting to v1 internals
  const mismatches: string[] = [];

  // Total volume (if present)
  const v1Total = (v1 as any)?.totals?.totalVolumeKg;
  const v2Total = (v2 as ServiceOutput | undefined)?.totals?.totalVolumeKg;
  if (isFiniteNumber(v1Total) && isFiniteNumber(v2Total) && v1Total !== v2Total) {
    mismatches.push('totals.totalVolumeKg');
  }

  // PRs length
  const v1PrLen = Array.isArray((v1 as any)?.prs) ? (v1 as any).prs.length : undefined;
  const v2PrLen = Array.isArray((v2 as any)?.prs) ? (v2 as any).prs.length : undefined;
  if (isFiniteNumber(v1PrLen) && isFiniteNumber(v2PrLen) && v1PrLen !== v2PrLen) {
    mismatches.push('prs.length');
  }

  // Volume series length
  const v1VolLen = Array.isArray((v1 as any)?.series?.volume) ? (v1 as any).series.volume.length : undefined;
  const v2VolLen = Array.isArray((v2 as any)?.series?.volume) ? (v2 as any).series.volume.length : undefined;
  if (isFiniteNumber(v1VolLen) && isFiniteNumber(v2VolLen) && v1VolLen !== v2VolLen) {
    mismatches.push('series.volume.len');
  }

  if (mismatches.length === 0) return null;

  const diff: ParityDiff = { mismatches };
  if (isFiniteNumber(v1Total) || isFiniteNumber(v2Total)) diff.totals = { v1: v1Total, v2: v2Total };
  if (isFiniteNumber(v1PrLen) && isFiniteNumber(v2PrLen)) diff.prsLength = { v1: v1PrLen, v2: v2PrLen };
  if (isFiniteNumber(v1VolLen) && isFiniteNumber(v2VolLen)) diff.seriesVolumeLen = { v1: v1VolLen, v2: v2VolLen };
  return diff;
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

