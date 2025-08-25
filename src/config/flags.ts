/**
 * Feature Flag Configuration
 * 
 * Centralized feature flag management for safe rollouts
 */

interface FeatureFlags {
  BW_LOADS_ENABLED: boolean;
  ADVANCED_METRICS: boolean;
  AI_RECOMMENDATIONS: boolean;
}

// Environment-based defaults
const isDevelopment = import.meta.env.DEV;
const isStaging = import.meta.env.VITE_APP_ENV === 'staging';
const isProduction = import.meta.env.VITE_APP_ENV === 'production';

const DEFAULT_FLAGS: FeatureFlags = {
  // Bodyweight loads: enabled in dev/staging, controlled rollout in production
  BW_LOADS_ENABLED: isDevelopment || isStaging || false,
  
  // Advanced metrics features
  ADVANCED_METRICS: isDevelopment || isStaging,
  
  // AI-powered recommendations
  AI_RECOMMENDATIONS: true,
};

// Override flags from environment variables if present
const ENV_OVERRIDES: Partial<FeatureFlags> = {
  BW_LOADS_ENABLED: import.meta.env.VITE_BW_LOADS_ENABLED === 'true',
};

// Merge defaults with environment overrides
export const FEATURE_FLAGS: FeatureFlags = {
  ...DEFAULT_FLAGS,
  ...Object.fromEntries(
    Object.entries(ENV_OVERRIDES).filter(([_, value]) => value !== undefined)
  ) as Partial<FeatureFlags>,
};

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