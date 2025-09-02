import { useSyncExternalStore } from 'react';

export type FeatureFlags = {
  KPI_ANALYTICS_ENABLED: boolean;
  KPI_DIAGNOSTICS_ENABLED: boolean;
  ANALYTICS_DERIVED_KPIS_ENABLED: boolean;
  ANALYTICS_V2_ENABLED: boolean;
  SETUP_CHOOSE_EXERCISES_ENABLED: boolean;
  SET_COMPLETE_NOTIFICATIONS_ENABLED: boolean;
  REST_FREEZE_ON_START: boolean;
};

const DEFAULTS: FeatureFlags = {
  KPI_ANALYTICS_ENABLED: true,
  KPI_DIAGNOSTICS_ENABLED: false,
  ANALYTICS_DERIVED_KPIS_ENABLED: false,
  ANALYTICS_V2_ENABLED: false,
  SETUP_CHOOSE_EXERCISES_ENABLED: true,
  SET_COMPLETE_NOTIFICATIONS_ENABLED: false,
  REST_FREEZE_ON_START: false,
};

const overrides: Partial<FeatureFlags> = {};

const lsKey = (name: keyof FeatureFlags) => `bf_flag_${name}`;

function readLocal(name: keyof FeatureFlags): boolean | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = window.localStorage.getItem(lsKey(name));
  return raw === null ? undefined : raw === 'true';
}

function readEnv(name: keyof FeatureFlags): boolean | undefined {
  const key = `VITE_${name}`;
  const raw = (import.meta as unknown as { env?: Record<string, unknown> }).env?.[key];
  return typeof raw === 'string' ? raw === 'true' : undefined;
}

function resolveFlag(name: keyof FeatureFlags): boolean {
  if (overrides[name] !== undefined) return overrides[name]!;
  const local = readLocal(name);
  if (local !== undefined) return local;
  const env = readEnv(name);
  if (env !== undefined) return env;
  return DEFAULTS[name];
}

export const FEATURE_FLAGS: FeatureFlags = {
  KPI_ANALYTICS_ENABLED: resolveFlag('KPI_ANALYTICS_ENABLED'),
  KPI_DIAGNOSTICS_ENABLED: resolveFlag('KPI_DIAGNOSTICS_ENABLED'),
  ANALYTICS_DERIVED_KPIS_ENABLED: resolveFlag('ANALYTICS_DERIVED_KPIS_ENABLED'),
  ANALYTICS_V2_ENABLED: resolveFlag('ANALYTICS_V2_ENABLED'),
  SETUP_CHOOSE_EXERCISES_ENABLED: resolveFlag('SETUP_CHOOSE_EXERCISES_ENABLED'),
  SET_COMPLETE_NOTIFICATIONS_ENABLED: resolveFlag('SET_COMPLETE_NOTIFICATIONS_ENABLED'),
  REST_FREEZE_ON_START: resolveFlag('REST_FREEZE_ON_START'),
};

export function setFlagOverride(name: keyof FeatureFlags, value: boolean) {
  overrides[name] = value;
  (FEATURE_FLAGS as Record<string, boolean>)[name] = value;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(lsKey(name), String(value));
  }
  subscribers.forEach((fn) => fn());
}

let logged = false;
export function logFlagsOnce() {
  if (logged) return;
  logged = true;
  const line = `[featureFlags] ${Object.entries(FEATURE_FLAGS)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ')}`;
  console.log(line);
}

const subscribers = new Set<() => void>();
function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

export function useFeatureFlags(): FeatureFlags {
  return useSyncExternalStore(subscribe, () => FEATURE_FLAGS, () => FEATURE_FLAGS);
}

export type { FeatureFlags as FlagsShape };
