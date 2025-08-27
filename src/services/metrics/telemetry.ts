import type { ParityDiff } from './parity';

export type ParityEvent =
  | { kind: 'metrics_parity_mismatch'; userIdHash?: string; diff: ParityDiff }
  | { kind: 'metrics_parity_error'; userIdHash?: string; error: string };

// No-op emitter for now. Replace with your logger/analytics later.
export function emitMetricsTelemetry(event: ParityEvent): void {
  // Intentionally empty; tests can spy on this via jest/vitest mocks.
}

