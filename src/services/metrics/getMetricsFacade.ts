import type { DateRange, MetricsRepository } from '../metrics-v2/repository';
import { getMetricsV2, type ServiceOutput } from '../metrics-v2';
import { summarizeParityDiff } from './parity';
import { emitMetricsTelemetry, type ParityEvent } from './telemetry';

export type FetchV1<TV1> = (userId: string, range: DateRange) => Promise<TV1>;

export type ShadowFlags = {
  v2?: boolean;     // full cutover (returns v2)
  shadow?: boolean; // run v2 in parallel, compare, emit telemetry, but return v1
};

export type GetMetricsShadowOptions<TV1> = {
  fetchV1: FetchV1<TV1>;
  repoV2: MetricsRepository;
  flags?: ShadowFlags;
  userIdHashFn?: (userId: string) => string; // optional, to avoid PII
};

export async function getMetricsShadow<TV1>(
  userId: string,
  range: DateRange,
  opts: GetMetricsShadowOptions<TV1>
): Promise<TV1 | ServiceOutput> {
  const { fetchV1, repoV2, flags = {}, userIdHashFn } = opts;

  // Cutover path: return v2
  if (flags.v2) {
    return getMetricsV2(repoV2, userId, range);
  }

  // Default path: return v1
  const v1 = await fetchV1(userId, range);

  // Shadow path: run v2 in parallel, compare, emit telemetry (non-throwing)
  if (flags.shadow) {
    try {
      const v2 = await getMetricsV2(repoV2, userId, range);
      const diff = summarizeParityDiff(v1, v2);
      if (diff) {
        const event: ParityEvent = {
          kind: 'metrics_parity_mismatch',
          userIdHash: userIdHashFn ? userIdHashFn(userId) : undefined,
          diff,
        };
        emitMetricsTelemetry(event);
      }
    } catch (e) {
      emitMetricsTelemetry({
        kind: 'metrics_parity_error',
        userIdHash: userIdHashFn ? userIdHashFn(userId) : undefined,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return v1;
}

