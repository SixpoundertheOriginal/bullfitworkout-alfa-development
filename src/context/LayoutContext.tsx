
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DateRange } from 'react-day-picker';
import { startOfWeek, endOfWeek } from 'date-fns';

interface LayoutContextProps {
  currentRoute: string;
  activeWorkoutId?: string | null;
  setActiveWorkoutId: (id: string | null) => void;
  isFilterVisible: boolean;
  setFilterVisible: (visible: boolean) => void;
}

const LayoutContext = createContext<LayoutContextProps | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [currentRoute, setCurrentRoute] = useState(location.pathname);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [isFilterVisible, setFilterVisible] = useState(false);
  
  // Update current route when location changes
  useEffect(() => {
    setCurrentRoute(location.pathname);
    
    // Show filter on overview page, hide on others
    setFilterVisible(location.pathname === '/overview');
  }, [location.pathname]);
  
  const value = {
    currentRoute,
    activeWorkoutId,
    setActiveWorkoutId,
    isFilterVisible,
    setFilterVisible,
  };
  
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

export const useLayout = (): LayoutContextProps => {
  const context = useContext(LayoutContext);
  
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  
  return context;
};
