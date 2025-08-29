// Formatting helpers for analytics metrics

export function fmtKgPerMin(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  return `${v.toFixed(2)} kg/min`;
}

export function fmtSeconds(n: number): string {
  const v = Number.isFinite(n) ? Math.max(0, n) : 0;
  const minutes = Math.floor(v / 60);
  const seconds = Math.round(v % 60);
  return `${minutes}m ${seconds}s`;
}

export function fmtRatio(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return 'N/A';
  return `${n.toFixed(2)}×`;
}
