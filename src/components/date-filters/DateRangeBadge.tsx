
import React from 'react';
import { useDateRange } from '@/context/DateRangeContext';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const DateRangeBadge: React.FC = () => {
  const { dateRange } = useDateRange();
  
  if (!dateRange?.from) {
    return null;
  }
  
  const formattedStart = dateRange.from ? format(dateRange.from, 'MMM d, yyyy') : '';
  const formattedEnd = dateRange.to ? format(dateRange.to, 'MMM d, yyyy') : formattedStart;
  
  return (
    <Badge variant="outline" className="bg-gray-800/50 border-gray-700 text-xs flex items-center gap-1">
      <CalendarIcon className="h-3 w-3 text-purple-400" />
      <span>
        {formattedStart} {dateRange.to && formattedStart !== formattedEnd ? `- ${formattedEnd}` : ''}
      </span>
    </Badge>
  );
};
