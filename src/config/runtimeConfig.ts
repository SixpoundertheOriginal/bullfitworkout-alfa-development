import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFlag as getFeatureFlag, setFlagOverride } from './featureFlags';

export type Flags = {
  derivedKpis: boolean;
};

const FLAG_PATHS: Record<keyof Flags, string> = {
  derivedKpis: 'analytics.derivedKpis.enabled',
};

const isBrowser = typeof window !== 'undefined';

interface ConfigCtxValue {
  flags: Flags;
  setFlag: (name: keyof Flags, value: boolean) => void;
}

const ConfigCtx = createContext<ConfigCtxValue>({
  flags: { derivedKpis: false },
  setFlag: () => {},
});

export interface ConfigProviderProps {
  children: React.ReactNode;
  initialFlags?: Partial<Flags>;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children, initialFlags }) => {
  const [flags, setFlags] = useState<Flags>(() => {
    const defaultDerived = getFeatureFlag('ANALYTICS_DERIVED_KPIS_ENABLED', import.meta.env.MODE !== 'production');
    return {
      derivedKpis:
        typeof initialFlags?.derivedKpis === 'boolean' ? initialFlags.derivedKpis : defaultDerived,
    };
  });

  const setFlag = (name: keyof Flags, value: boolean) => {
    setFlags(prev => ({ ...prev, [name]: value }));
    if (name === 'derivedKpis') {
      setFlagOverride('ANALYTICS_DERIVED_KPIS_ENABLED', value);
    }
  };

  useEffect(() => {
    if (isBrowser) {
      const windowWithFlags = window as any;
      windowWithFlags.__FLAGS__ = {
        ...windowWithFlags.__FLAGS__,
        [FLAG_PATHS.derivedKpis]: flags.derivedKpis,
      };
    }
  }, [flags.derivedKpis]);

  return (
    <ConfigCtx.Provider value={{ flags, setFlag }}>
      {children}
    </ConfigCtx.Provider>
  );
};

export function useConfig() {
  return useContext(ConfigCtx);
}