import {
  TONNAGE_ID,
  SETS_ID,
  REPS_ID,
  DURATION_ID,
  DENSITY_ID,
  AVG_REST_ID,
  EFF_ID,
} from './metricIds';

export const BASE_MEASURES = [
  { id: TONNAGE_ID, label: 'Tonnage (kg)' },
  { id: SETS_ID, label: 'Sets' },
  { id: REPS_ID, label: 'Reps' },
  { id: DURATION_ID, label: 'Duration (min)' },
];

export const DERIVED_MEASURES = [
  { id: DENSITY_ID, label: 'Density (kg/min)' },
  { id: AVG_REST_ID, label: 'Avg Rest (sec)' },
  { id: EFF_ID, label: 'Set Efficiency (kg/min)' },
];

export const MEASURES = [...BASE_MEASURES, ...DERIVED_MEASURES];
