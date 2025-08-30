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
  },
};

export const expectedChartSeries = {
  series: {
    tonnage_kg: [
      { date: '2024-05-01', value: 1000 },
      { date: '2024-05-02', value: 1100 },
    ],
    duration_min: [
      { date: '2024-05-01', value: 60 },
    ],
    density_kg_per_min: [
      { date: '2024-05-01', value: 5 },
    ],
  },
  availableMeasures: ['tonnage_kg', 'duration_min', 'density_kg_per_min'],
};
