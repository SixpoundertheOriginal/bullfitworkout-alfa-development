/**
 * Feature Flag Configuration
 * 
 * Centralized feature flag management for safe rollouts
 */

interface FeatureFlags {
  BW_LOADS_ENABLED: boolean;
  ADVANCED_METRICS: boolean;
  AI_RECOMMENDATIONS: boolean;
  // Gate for KPI Analytics tab/flows
  KPI_ANALYTICS_ENABLED: boolean;
}

// Environment-based defaults
const isDevelopment = import.meta.env.DEV;
const isStaging = import.meta.env.VITE_APP_ENV === 'staging';
const isProduction = import.meta.env.VITE_APP_ENV === 'production';
// Treat lovable.dev previews as staging-like environments at runtime
const isLovablePreview = typeof window !== 'undefined' && /lovable\.dev$/i.test(window.location.hostname);

const DEFAULT_FLAGS: FeatureFlags = {
  // Bodyweight loads: enabled in dev/staging, controlled rollout in production
  BW_LOADS_ENABLED: isDevelopment || isStaging || false,
  
  // Advanced metrics features
  ADVANCED_METRICS: isDevelopment || isStaging,
  
  // AI-powered recommendations
  AI_RECOMMENDATIONS: true,

  // KPI analytics: ENABLED by default pre-MVP; can be disabled via env
  KPI_ANALYTICS_ENABLED: true,
};

// Override flags from environment variables if present (only when explicitly set)
const ENV_OVERRIDES: Partial<FeatureFlags> = {};
const BW_RAW = (import.meta as any).env?.VITE_BW_LOADS_ENABLED;
if (typeof BW_RAW !== 'undefined') ENV_OVERRIDES.BW_LOADS_ENABLED = BW_RAW === 'true';
const KPI_RAW = (import.meta as any).env?.VITE_KPI_ANALYTICS_ENABLED;
if (typeof KPI_RAW !== 'undefined') ENV_OVERRIDES.KPI_ANALYTICS_ENABLED = KPI_RAW === 'true';

// Merge defaults with environment overrides
export const FEATURE_FLAGS: FeatureFlags = { ...DEFAULT_FLAGS, ...ENV_OVERRIDES };

export type FeatureFlagKey = keyof FeatureFlags;

/**
 * Hook for accessing feature flags
 */
export function useFeatureFlag(flag: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Utility for checking flags in non-React contexts
 */
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[flag];
}

// Telemetry functions (optional)
export function emitTelemetry(event: string, data: Record<string, any>) {
  if (isDevelopment) {
    console.log(`[Telemetry] ${event}:`, data);
  }
  
  // In production, send to analytics service
  // analytics.track(event, data);
}

export function emitBwLoadApplied(data: {
  exerciseId: string;
  userBw: number;
  loadPerRep: number;
}) {
  emitTelemetry('bw_load_applied', data);
}

export function emitIsometricWorkLogged(data: {
  exerciseId: string;
  loadKg: number;
  durationSec: number;
  workKgSec: number;
}) {
  emitTelemetry('isometric_work_logged', data);
}
