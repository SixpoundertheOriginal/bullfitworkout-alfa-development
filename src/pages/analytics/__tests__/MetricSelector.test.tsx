import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AnalyticsPage from '../AnalyticsPage';
import { ConfigProvider } from '@/config/runtimeConfig';
import type { TimeSeriesPoint } from '@/services/metrics-v2/dto';

describe('metric selector and KPI gating', () => {
  it('renders options based on flag and recovers metric on flag disable', () => {
    const data = {
      perWorkout: [],
      series: {} as Record<string, TimeSeriesPoint[]>,
      metricKeys: ['volume','sets','workouts','duration','reps','density','avgRest','setEfficiency'],
    };
    const { rerender } = render(
      <ConfigProvider initialFlags={{ derivedKpis: true }}>
        <AnalyticsPage data={data} />
      </ConfigProvider>
    );

    const select = screen.getByTestId('metric-select') as HTMLSelectElement;
    expect(select.options.length).toBe(8);
    expect(screen.getByTestId('kpi-density')).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'density' } });

    rerender(
      <ConfigProvider initialFlags={{ derivedKpis: false }}>
        <AnalyticsPage data={data} />
      </ConfigProvider>
    );

    const updated = screen.getByTestId('metric-select') as HTMLSelectElement;
    expect(updated.options.length).toBe(5);
    expect(updated.value).toBe('volume');
    expect(screen.queryByTestId('kpi-density')).toBeNull();
  });
});
