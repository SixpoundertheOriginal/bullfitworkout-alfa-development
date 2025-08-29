import React, { createContext, useContext, useMemo } from 'react';

export type Flags = {
  derivedKpis: boolean;
};

const FLAG_PATHS: Record<keyof Flags, string> = {
  derivedKpis: 'analytics.derivedKpis.enabled',
};

const isBrowser = typeof window !== 'undefined';

function readLocal(): Record<string, unknown> {
  if (!isBrowser) return {};
  try {
    const raw = window.localStorage.getItem('bf.flags');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function readWindow(): Record<string, unknown> {
  if (!isBrowser) return {};
  return (window as any).__FLAGS__ || {};
}

function readEnv(key: string): unknown {
  const envKey = `VITE_${key.replace(/\./g, '_').toUpperCase()}`;
  // import.meta may not exist in some test contexts
  const env = (import.meta as any)?.env;
  return env ? env[envKey] : undefined;
}

export function getFlag(name: keyof Flags, defaults: Flags): boolean {
  const path = FLAG_PATHS[name];
  const winVal = readWindow()[path];
  if (typeof winVal === 'boolean') return winVal;
  const localVal = readLocal()[path];
  if (typeof localVal === 'boolean') return localVal;
  const envVal = readEnv(path);
  if (typeof envVal === 'string') {
    return envVal === 'true';
  }
  return defaults[name];
}

const ConfigCtx = createContext<{ flags: Flags }>({ flags: { derivedKpis: false } });

export interface ConfigProviderProps {
  children: React.ReactNode;
  initialFlags?: Partial<Flags>;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children, initialFlags }) => {
  const flags = useMemo<Flags>(() => {
    const defaults: Flags = { derivedKpis: import.meta.env.MODE !== 'production' };
    return {
      derivedKpis:
        typeof initialFlags?.derivedKpis === 'boolean'
          ? initialFlags.derivedKpis
          : getFlag('derivedKpis', defaults),
    };
  }, [initialFlags?.derivedKpis]);

  if (isBrowser) {
    (window as any).__FLAGS__ = {
      ...(window as any).__FLAGS__,
      [FLAG_PATHS.derivedKpis]: flags.derivedKpis,
    };
  }

  return React.createElement(ConfigCtx.Provider, { value: { flags } }, children);
};

export function useConfig() {
  return useContext(ConfigCtx);
}

