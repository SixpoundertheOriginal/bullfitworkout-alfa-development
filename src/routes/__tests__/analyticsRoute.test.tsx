import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import AppRoutes from '../AppRoutes';
import { renderWithProviders } from '../../../tests/utils/renderWithProviders';

vi.mock('recharts', async () => await import('../../../tests/mocks/recharts'));

describe('analytics route', () => {
  it('renders new AnalyticsPage on /analytics', () => {
    renderWithProviders(<AppRoutes />, { route: '/analytics' });
    expect(screen.getByTestId('metric-select')).toBeInTheDocument();
  });
});
