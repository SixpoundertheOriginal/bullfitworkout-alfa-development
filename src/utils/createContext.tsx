
import React from 'react';

export function createContext<ContextType>() {
  const Context = React.createContext<ContextType | undefined>(undefined);

  function useContext() {
    const ctx = React.useContext(Context);
    if (!ctx) {
      throw new Error('useContext must be used within its provider');
    }
    return ctx;
  }

  return [Context.Provider, useContext] as const;
}
