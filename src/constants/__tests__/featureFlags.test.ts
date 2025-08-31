import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

const modulePath = '@/constants/featureFlags';

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  delete process.env.VITE_KPI_ANALYTICS_ENABLED;
  delete process.env.VITE_ANALYTICS_DERIVED_KPIS_ENABLED;
});

afterAll(async () => {
  const { setFlagOverride } = await import(modulePath);
  setFlagOverride('ANALYTICS_DERIVED_KPIS_ENABLED', true);
  setFlagOverride('KPI_ANALYTICS_ENABLED', true);
});

describe('featureFlags precedence', () => {
  it('uses defaults when no overrides', async () => {
    const { FEATURE_FLAGS } = await import(modulePath);
    expect(FEATURE_FLAGS.KPI_ANALYTICS_ENABLED).toBe(true);
    expect(FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED).toBe(false);
  });

  it.skip('env overrides defaults', async () => {
    vi.stubEnv('VITE_KPI_ANALYTICS_ENABLED', 'false');
    const { FEATURE_FLAGS } = await import(modulePath);
    vi.unstubAllEnvs();
    expect(FEATURE_FLAGS.KPI_ANALYTICS_ENABLED).toBe(false);
  });

  it('localStorage overrides env', async () => {
    vi.stubEnv('VITE_KPI_ANALYTICS_ENABLED', 'false');
    localStorage.setItem('bf_flag_KPI_ANALYTICS_ENABLED', 'true');
    const { FEATURE_FLAGS } = await import(modulePath);
    vi.unstubAllEnvs();
    expect(FEATURE_FLAGS.KPI_ANALYTICS_ENABLED).toBe(true);
  });

  it('localStorage overrides derived KPI flag', async () => {
    localStorage.setItem('bf_flag_ANALYTICS_DERIVED_KPIS_ENABLED', 'true');
    const { FEATURE_FLAGS } = await import(modulePath);
    expect(FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED).toBe(true);
  });

  it('setFlagOverride overrides all', async () => {
    localStorage.setItem('bf_flag_KPI_ANALYTICS_ENABLED', 'true');
    const { FEATURE_FLAGS, setFlagOverride } = await import(modulePath);
    setFlagOverride('KPI_ANALYTICS_ENABLED', false);
    expect(FEATURE_FLAGS.KPI_ANALYTICS_ENABLED).toBe(false);
  });
});
