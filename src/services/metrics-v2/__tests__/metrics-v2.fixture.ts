export const v2Payload = {
  series: {
    tonnageKg: [
      { timestamp: '2024-05-01T06:00:00Z', value: 1000 },
      { timestamp: '2024-05-02T06:00:00Z', value: 1100 },
    ],
    durationMin: [
      { timestamp: '2024-05-01T06:00:00Z', value: 60 },
    ],
    densityKgPerMin: [
      { timestamp: '2024-05-01T06:00:00Z', value: 5 },
    ],
    avgRestSec: [
      { ts: '2024-05-01T23:00:00Z', value: 90 },
    ],
    setEfficiencyKgPerMin: [
      { ts: '2024-05-01T21:00:00Z', value: 1.5 },
    ],
  },
};

const tonnageSeries = [
  { date: '2024-05-01', value: 1000 },
  { date: '2024-05-02', value: 1100 },
];
const durationSeries = [{ date: '2024-05-01', value: 60 }];
const densitySeries = [{ date: '2024-05-01', value: 5 }];
const restSeries = [{ date: '2024-05-02', value: 90 }];
const efficiencySeries = [{ date: '2024-05-01', value: 1.5 }];

export const expectedChartSeries = {
  series: {
    tonnage_kg: tonnageSeries,
    tonnageKg: tonnageSeries,
    duration_min: durationSeries,
    durationMin: durationSeries,
    density_kg_per_min: densitySeries,
    densityKgPerMin: densitySeries,
    avg_rest_sec: restSeries,
    avgRestSec: restSeries,
    set_efficiency_kg_per_min: efficiencySeries,
    setEfficiencyKgPerMin: efficiencySeries,
  },
  availableMeasures: [
    'tonnage_kg',
    'duration_min',
    'density_kg_per_min',
    'avg_rest_sec',
    'set_efficiency_kg_per_min',
  ],
};
