import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../AppRoutes';

describe('analytics route', () => {
  it('renders new AnalyticsPage on /analytics', () => {
    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByTestId('metric-select')).toBeInTheDocument();
  });
});
