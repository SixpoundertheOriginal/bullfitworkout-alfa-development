import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnalyticsPage } from '../AnalyticsPage';

describe('AnalyticsPage defaults', () => {
  it('renders without workout data', () => {
    const client = new QueryClient();
    const { getByTestId } = render(
      <QueryClientProvider client={client}>
        <AnalyticsPage />
      </QueryClientProvider>
    );
    expect(getByTestId('metric-select')).toBeDisabled();
    expect(getByTestId('empty-series').textContent).toBe('No data to display');
  });
});
