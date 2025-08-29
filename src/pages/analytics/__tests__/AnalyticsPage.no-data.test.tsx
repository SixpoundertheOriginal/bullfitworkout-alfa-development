import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnalyticsPage } from '../AnalyticsPage';

describe('AnalyticsPage defaults', () => {
  it('renders without workout data', () => {
    const { getByTestId } = render(<AnalyticsPage />);
    expect(getByTestId('series').textContent).toBe('[]');
  });
});
