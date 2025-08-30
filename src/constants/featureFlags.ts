export type FlagName =
  | 'ANALYTICS_DERIVED_KPIS_ENABLED'
  | 'KPI_ANALYTICS_ENABLED'
  | 'SET_COMPLETE_NOTIFICATIONS_ENABLED'
  | 'SETUP_CHOOSE_EXERCISES_ENABLED';

const defaults: Record<FlagName, boolean> = {
  ANALYTICS_DERIVED_KPIS_ENABLED: import.meta.env.DEV,
  KPI_ANALYTICS_ENABLED: true,
  SET_COMPLETE_NOTIFICATIONS_ENABLED: false,
  SETUP_CHOOSE_EXERCISES_ENABLED:
    (import.meta.env.VITE_SETUP_CHOOSE_EXERCISES_ENABLED ?? 'true') === 'true',
};

const overrides: Partial<Record<FlagName, boolean>> = {};

function readLocal(name: FlagName): boolean | undefined {
  if (typeof window === 'undefined') return undefined;
  const v = window.localStorage.getItem(name);
  return v === null ? undefined : v === 'true';
}

function readEnv(name: FlagName): boolean | undefined {
  const envKey = `VITE_${name}`;
  const raw = (import.meta as any).env?.[envKey];
  return typeof raw === 'string' ? raw === 'true' : undefined;
}

export function getFlag(name: FlagName, def: boolean = defaults[name]): boolean {
  if (overrides[name] !== undefined) return overrides[name] as boolean;
  const local = readLocal(name);
  if (local !== undefined) return local;
  const env = readEnv(name);
  if (env !== undefined) return env;
  return def;
}

export function setFlagOverride(name: FlagName, value: boolean) {
  overrides[name] = value;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(name, String(value));
      (window as any).__FLAGS__ = {
        ...(window as any).__FLAGS__,
        [name]: value,
      };
    } catch {
      // ignore
    }
  }
}

export const FEATURE_FLAGS = {
  get ANALYTICS_DERIVED_KPIS_ENABLED() {
    return getFlag('ANALYTICS_DERIVED_KPIS_ENABLED');
  },
  set ANALYTICS_DERIVED_KPIS_ENABLED(v: boolean) {
    setFlagOverride('ANALYTICS_DERIVED_KPIS_ENABLED', v);
  },
  get KPI_ANALYTICS_ENABLED() {
    return getFlag('KPI_ANALYTICS_ENABLED');
  },
  set KPI_ANALYTICS_ENABLED(v: boolean) {
    setFlagOverride('KPI_ANALYTICS_ENABLED', v);
  },
  get SET_COMPLETE_NOTIFICATIONS_ENABLED() {
    return getFlag('SET_COMPLETE_NOTIFICATIONS_ENABLED');
  },
  set SET_COMPLETE_NOTIFICATIONS_ENABLED(v: boolean) {
    setFlagOverride('SET_COMPLETE_NOTIFICATIONS_ENABLED', v);
  },
  get SETUP_CHOOSE_EXERCISES_ENABLED() {
    return getFlag('SETUP_CHOOSE_EXERCISES_ENABLED');
  },
  set SETUP_CHOOSE_EXERCISES_ENABLED(v: boolean) {
    setFlagOverride('SETUP_CHOOSE_EXERCISES_ENABLED', v);
  },
} as const;

const bootLine =
  `[featureFlags] ANALYTICS_DERIVED_KPIS_ENABLED=${FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED} ` +
  `KPI_ANALYTICS_ENABLED=${FEATURE_FLAGS.KPI_ANALYTICS_ENABLED} ` +
  `SET_COMPLETE_NOTIFICATIONS_ENABLED=${FEATURE_FLAGS.SET_COMPLETE_NOTIFICATIONS_ENABLED}`;
console.debug(bootLine);
