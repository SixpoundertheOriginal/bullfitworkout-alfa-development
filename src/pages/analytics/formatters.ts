// Formatting helpers for analytics metrics

export const toFinite = (n: number | null | undefined): number =>
  typeof n === 'number' && Number.isFinite(n) ? n : 0;

const numberFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const formatNumber = (n: number) => numberFmt.format(n);

export const formatKgPerMin = (v: number | null | undefined): string =>
  `${formatNumber(toFinite(v))} kg/min`;

export const formatSeconds = (v: number | null | undefined): string => {
  const total = Math.max(0, toFinite(v));
  const minutes = Math.floor(total / 60);
  const seconds = Math.round(total % 60);
  return `${minutes}m ${seconds}s`;
};

