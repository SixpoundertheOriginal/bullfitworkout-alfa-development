import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { MetricSelector } from '@/components/analytics/MetricSelector';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import type { MetricKey } from '@/services/metrics-v2/dto';

const ALL_KEYS: MetricKey[] = ['volume','sets','workouts','duration','reps','density','avgRest','setEfficiency'];

describe('MetricSelector', () => {
  const original = FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED;
  afterEach(() => { (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = original; });

  it('shows derived KPIs when flag=true', () => {
    (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = true;
    render(<MetricSelector metricKeys={ALL_KEYS} value="volume" onChange={() => {}} />);
    expect(screen.getByText(/Workout Density/)).toBeInTheDocument();
    expect(screen.getByText(/Avg Rest/)).toBeInTheDocument();
    expect(screen.getByText(/Set Efficiency/)).toBeInTheDocument();
  });

  it('hides derived KPIs when flag=false', () => {
    (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = false;
    render(<MetricSelector metricKeys={ALL_KEYS} value="volume" onChange={() => {}} />);
    expect(screen.queryByText(/Workout Density/)).not.toBeInTheDocument();
  });
});
