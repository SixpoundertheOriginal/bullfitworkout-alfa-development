import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll } from 'vitest';

// Freeze system time for deterministic snapshots and time calculations
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
});

afterAll(() => {
  vi.useRealTimers();
});

// Global helper: allow tests to mock feature flags via vi.mock('@/constants/featureFlags')
