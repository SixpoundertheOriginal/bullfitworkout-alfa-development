
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { useDateRange } from '@/context/DateRangeContext';

type DateRangeOption = {
  label: string;
  value: () => DateRange;
};

export function DateRangeFilter() {
  const { dateRange, setDateRange } = useDateRange();
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const today = new Date();
  
  const dateRangeOptions: DateRangeOption[] = [
    {
      label: 'Today',
      value: () => ({
        from: today,
        to: today,
      }),
    },
    {
      label: 'This Week',
      value: () => ({
        from: startOfWeek(today, { weekStartsOn: 1 }),
        to: endOfWeek(today, { weekStartsOn: 1 }),
      }),
    },
    {
      label: 'Last 30 Days',
      value: () => ({
        from: subDays(today, 29),
        to: today,
      }),
    },
    {
      label: 'Year to Date',
      value: () => ({
        from: startOfYear(today),
        to: today,
      }),
    },
  ];

  const [selectedPreset, setSelectedPreset] = useState<string>('This Week');

  // Initialize with "This Week" on component mount
  useEffect(() => {
    if (!isInitialized && !dateRange) {
      const thisWeekRange = dateRangeOptions.find(option => option.label === 'This Week');
      if (thisWeekRange) {
        setDateRange(thisWeekRange.value());
        setSelectedPreset(thisWeekRange.label);
        setIsInitialized(true);
      }
    }
  }, [dateRange, isInitialized, setDateRange]);

  const handleSelect = (preset: DateRangeOption) => {
    const range = preset.value();
    setDateRange(range);
    setSelectedPreset(preset.label);
    setIsOpen(false);
  };
  
  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange(range);
      setSelectedPreset('Custom Range');
    }
  };
  
  return (
    <div className="flex items-center space-x-2 flex-shrink-0">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-auto justify-between text-sm bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600",
              !dateRange && "text-gray-400"
            )}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-purple-400" />
              <span>
                {selectedPreset === 'Custom Range' && dateRange?.from ? (
                  <>
                    {format(dateRange.from, "MMM d")} -{" "}
                    {dateRange.to ? format(dateRange.to, "MMM d, yyyy") : null}
                  </>
                ) : (
                  selectedPreset
                )}
              </span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="end">
          <div className="grid gap-4 p-3">
            <div className="flex flex-col space-y-2">
              {dateRangeOptions.map((option) => (
                <Button
                  key={option.label}
                  variant={selectedPreset === option.label ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleSelect(option)}
                  className="justify-start font-normal hover:bg-gray-700"
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="border-t border-gray-700 pt-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleCalendarSelect}
                numberOfMonths={1}
                className="bg-gray-800"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
