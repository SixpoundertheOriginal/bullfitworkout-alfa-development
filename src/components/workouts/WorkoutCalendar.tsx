import React from 'react';
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWorkoutDates } from "@/hooks/useWorkoutHistory";
import { Loader2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface WorkoutCalendarProps {
  className?: string;
  onDatePreview?: (date: string | null) => void;
}

export const WorkoutCalendar = ({ className = "", onDatePreview }: WorkoutCalendarProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [month, setMonth] = useState<Date>(new Date());
  
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  
  const { data: workoutDates = {}, isLoading, isError } = useWorkoutDates(year, monthIndex);
  
  if (isError) {
    toast.error("Failed to load workout calendar");
  }
  
  const handleSelectDate = (date: Date | undefined) => {
    if (!date) {
      onDatePreview?.(null);
      return;
    }
    
    const dateString = date.toISOString().split('T')[0];
    const workoutCount = workoutDates[dateString] || 0;
    
    if (workoutCount > 0) {
      if (onDatePreview) {
        // Use the callback for inline viewing instead of navigation
        onDatePreview(dateString);
      } else {
        // This case should not happen anymore with our updated flow
        navigate(`/training?tab=calendar&date=${dateString}`);
      }
    } else {
      // For dates without workouts, show the historical workout form
      navigate(`/training-session?date=${dateString}&historical=true`);
    }
  };

  const handleMonthChange = (newMonth: Date) => {
    console.log("Month changed to:", newMonth);
    setMonth(newMonth);
  };
  
  const dayClassName = (date: Date): string => {
    const dateString = date.toISOString().split('T')[0];
    const workoutCount = workoutDates[dateString] || 0;
    
    if (workoutCount > 0) {
      if (workoutCount >= 3) {
        return 'bg-purple-600 text-white rounded-full hover:bg-purple-700';
      } else if (workoutCount === 2) {
        return 'bg-purple-500/80 text-white rounded-full hover:bg-purple-600';
      } else {
        return 'bg-purple-500/50 text-white rounded-full hover:bg-purple-500';
      }
    }
    
    return '';
  };
  
  const CustomDayContent = ({ date }: { date: Date }) => {
    const dateString = date.toISOString().split('T')[0];
    const hasWorkout = workoutDates[dateString] || 0;
    const extraClass = dayClassName(date);
    const isInPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    
    return (
      <div className={`relative group ${extraClass || ''}`}>
        <div>{format(date, 'd')}</div>
        {!hasWorkout && isInPast && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 hover:bg-purple-500/20 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectDate(date);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Log historical workout</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  };
  
  return (
    <Card className={`bg-gray-900 border-gray-800 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Workout Calendar</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            <Calendar
              mode="single"
              className="rounded-md border-0"
              classNames={{
                day_selected: 'bg-purple-600 text-white hover:bg-purple-700 focus:bg-purple-600',
                day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
                day_today: 'bg-gray-800 text-white',
                nav_button: 'border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
              }}
              selected={undefined}
              onSelect={handleSelectDate}
              onMonthChange={handleMonthChange}
              month={month}
              disabled={{ after: new Date() }}
              components={{
                DayContent: CustomDayContent
              }}
            />
            
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-500/50"></div>
                <span className="text-xs text-gray-400">1 workout</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-500/80"></div>
                <span className="text-xs text-gray-400">2 workouts</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                <span className="text-xs text-gray-400">3+ workouts</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
