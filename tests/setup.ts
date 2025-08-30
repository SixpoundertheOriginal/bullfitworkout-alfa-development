import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { setFlagOverride, logFlagsOnce } from '@/constants/featureFlags';

// Freeze time for stable query keys and date buckets
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-08-30T12:00:00.000Z'));
  setFlagOverride('ANALYTICS_DERIVED_KPIS_ENABLED', true);
  setFlagOverride('KPI_ANALYTICS_ENABLED', true);
  logFlagsOnce();
});

// Mock ResizeObserver (used by chart libs)
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = RO as any;

// Give elements a size so ResponsiveContainer calculates layout
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get: () => 800,
});
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get: () => 300,
});

// Optional: getBoundingClientRect with non-zero values
HTMLElement.prototype.getBoundingClientRect = function () {
  return {
    x: 0,
    y: 0,
    width: 800,
    height: 300,
    top: 0,
    left: 0,
    bottom: 300,
    right: 800,
    toJSON() {},
  } as any;
};

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.useRealTimers();
});
