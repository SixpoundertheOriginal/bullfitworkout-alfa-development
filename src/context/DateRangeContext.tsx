
import React, { createContext, useContext, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, startOfWeek, endOfWeek } from 'date-fns';

interface DateRangeContextType {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with the current week (Monday to Sunday)
  const now = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfWeek(now, { weekStartsOn: 1 }), // Monday
    to: endOfWeek(now, { weekStartsOn: 1 }), // Sunday
  });

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
}
