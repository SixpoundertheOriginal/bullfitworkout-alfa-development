export function getReps(s: any) {
  return s.reps ?? s.completedReps ?? s.actualReps ?? 0;
}

export function isBodyweightSet(s: any) {
  return !!s.isBodyweight || s.equipment === 'bodyweight' || s.type === 'bodyweight';
}

export function getLoadKg(s: any, includeBW: boolean, bodyweightKg: number) {
  const unit = s.unit ?? s.weightUnit ?? 'kg';
  const base = unit === 'kg' ? (s.weightKg ?? s.weight ?? 0)
    : unit === 'lb' ? (s.weight ?? 0) * 0.45359237 : 0;
  const bw = includeBW && isBodyweightSet(s) ? (bodyweightKg || 0) * (s.loadFactor ?? 1) : 0;
  return base + bw;
}

export function getVolumeKg(s: any, includeBW: boolean, bodyweightKg: number) {
  const reps = getReps(s);
  if (!reps) return 0;
  return getLoadKg(s, includeBW, bodyweightKg) * reps;
}
