import { normalizeTotals } from '@/services/metrics-v2/chartAdapter';

const round2 = (n: number) => Math.round(n * 100) / 100;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toCanonicalTotals(rawTotals: any): {
  sets: number;
  reps: number;
  duration_min: number;
  tonnage_kg: number;
  density_kg_per_min: number;
} {
  const norm = normalizeTotals(rawTotals ?? {});
  const sets = norm.sets ?? 0;
  const reps = norm.reps ?? 0;
  const duration_min = round2(norm.duration_min ?? 0);
  const tonnage_kg = round2(norm.tonnage_kg ?? 0);
  let density_kg_per_min = norm.density_kg_per_min;
  if (density_kg_per_min == null) {
    density_kg_per_min = duration_min > 0 ? round2(tonnage_kg / duration_min) : 0;
  } else {
    density_kg_per_min = round2(density_kg_per_min);
  }
  return { sets, reps, duration_min, tonnage_kg, density_kg_per_min };
}
