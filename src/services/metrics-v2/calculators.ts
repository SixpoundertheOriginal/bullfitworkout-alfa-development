// Calculator signatures (implement later). Keep factors as data, not code.
export const loadFactorMap: Record<string, number> = {
  'Pull-Up': 0.93,
  'Chin-Up': 0.95,
  'Dip': 0.84,
};

export function calcSetVolume(weightKg: number | undefined, reps: number | undefined): number {
  // TODO: implement
  return 0;
}

export function calcBodyweightLoad(userBwKg: number, exerciseName: string): number {
  // TODO: implement
  return 0;
}

export function calcIsometricLoad(weightKg: number | undefined, seconds: number | undefined): number {
  // TODO: implement
  return 0;
}
