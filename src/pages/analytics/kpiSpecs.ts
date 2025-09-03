export type KpiSpec = {
  key: string;
  label: string;
  section: 'core' | 'derived';
  formatter: (n: number) => string;
  flag?: 'ANALYTICS_DERIVED_KPIS_ENABLED';
};

const formatInt = (n: number): string => {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : Math.round(n).toString();
};

const formatFixed0 = (n: number): string => n.toFixed(0);
const formatFixed2 = (n: number): string => n.toFixed(2);

export const coreKpiSpecs: KpiSpec[] = [
  {
    key: 'sets',
    label: 'Sets',
    section: 'core',
    formatter: formatInt
  },
  {
    key: 'reps',
    label: 'Reps',
    section: 'core',
    formatter: formatInt
  },
  {
    key: 'duration_min',
    label: 'Duration (min)',
    section: 'core',
    formatter: formatFixed0
  },
  {
    key: 'tonnage_kg',
    label: 'Tonnage (kg)',
    section: 'core',
    formatter: formatInt
  },
  {
    key: 'density_kg_per_min',
    label: 'Density (kg/min)',
    section: 'core',
    formatter: formatFixed2
  }
];

export const derivedKpiSpecs: KpiSpec[] = [
  {
    key: 'avg_reps_per_set',
    label: 'Avg Reps/Set',
    section: 'derived',
    formatter: formatFixed2,
    flag: 'ANALYTICS_DERIVED_KPIS_ENABLED'
  },
  {
    key: 'avg_tonnage_per_set_kg',
    label: 'Avg Tonnage/Set (kg)',
    section: 'derived',
    formatter: formatFixed2,
    flag: 'ANALYTICS_DERIVED_KPIS_ENABLED'
  },
  {
    key: 'avg_tonnage_per_rep_kg',
    label: 'Avg Tonnage/Rep (kg)',
    section: 'derived',
    formatter: formatFixed2,
    flag: 'ANALYTICS_DERIVED_KPIS_ENABLED'
  },
  {
    key: 'avg_rest_sec',
    label: 'Avg Rest (sec)',
    section: 'derived',
    formatter: formatFixed0,
    flag: 'ANALYTICS_DERIVED_KPIS_ENABLED'
  },
  {
    key: 'avg_duration_per_set_min',
    label: 'Avg Duration/Set (min)',
    section: 'derived',
    formatter: formatFixed2,
    flag: 'ANALYTICS_DERIVED_KPIS_ENABLED'
  },
  {
    key: 'set_efficiency_kg_per_min',
    label: 'Set Efficiency (kg/min)',
    section: 'derived',
    formatter: formatFixed2,
    flag: 'ANALYTICS_DERIVED_KPIS_ENABLED'
  }
];

export const allKpiSpecs: KpiSpec[] = [...coreKpiSpecs, ...derivedKpiSpecs];