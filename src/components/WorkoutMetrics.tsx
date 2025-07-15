
import React, { useState, useEffect } from "react";
import { Timer, Dumbbell, Clock, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MetricCard } from "./metrics/MetricCard";
import { TopRestTimer } from "./TopRestTimer";
import { CircularProgress } from "@/components/ui/circular-progress";
import { cn } from "@/lib/utils";
import { theme } from "@/lib/theme";
import { typography } from "@/lib/typography";

interface WorkoutMetricsProps {
  time: number;
  exerciseCount: number;
  completedSets: number;
  totalSets: number;
  showRestTimer: boolean;
  onRestTimerComplete: () => void;
  onRestTimeUpdate?: (time: number) => void;
  onManualRestStart?: () => void;
  onRestTimerReset?: () => void;
  restTimerResetSignal?: number;
  currentRestTime?: number;
  className?: string;
}

export const WorkoutMetrics = ({
  time,
  exerciseCount,
  completedSets,
  totalSets,
  showRestTimer,
  onRestTimerComplete,
  onRestTimeUpdate,
  onManualRestStart,
  onRestTimerReset,
  restTimerResetSignal = 0,
  currentRestTime,
  className
}: WorkoutMetricsProps) => {
  const [resetCounter, setResetCounter] = useState(0);
  
  // Use the external reset signal
  useEffect(() => {
    if (restTimerResetSignal > 0) {
      setResetCounter(restTimerResetSignal);
    }
  }, [restTimerResetSignal]);

  useEffect(() => {
    if (showRestTimer) {
      setResetCounter(prev => prev + 1);
    }
  }, [showRestTimer]);

  useEffect(() => {
    const handleToastReset = () => {
      if (showRestTimer) {
        setResetCounter(prev => prev + 1);
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement && 
                (node.classList.contains('toast') || 
                 node.getAttribute('role') === 'status' || 
                 node.getAttribute('data-sonner-toast') === 'true')) {
              if (node.textContent && node.textContent.includes("logged successfully")) {
                handleToastReset();
              }
            }
          });
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, [showRestTimer]);

  const startTime = new Date();
  startTime.setSeconds(startTime.getSeconds() - time);
  const formattedStartTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const completionPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <div className={cn("relative w-full", className)}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-gray-900/40 backdrop-blur-md border border-white/5">
        {/* Time Card */}
        <MetricCard
          icon={Clock}
          value={formatTime(time)}
          label="Time"
          tooltip={`Tracked since ${formattedStartTime}`}
          gradientClass="from-sky-600/10 via-black/5 to-sky-900/10 hover:from-sky-600/20 hover:to-sky-900/20"
          valueClass="text-sky-300 font-semibold bg-gradient-to-br from-sky-200 to-sky-400 bg-clip-text text-transparent text-lg sm:text-xl"
          labelClass={typography.sections.label}
          className="p-2 sm:p-3"
        />

        {/* Exercise Count Card */}
        <MetricCard
          icon={Dumbbell}
          value={exerciseCount}
          label="Exercises"
          tooltip="Active exercises in your workout"
          gradientClass="from-emerald-600/10 via-black/5 to-emerald-900/10 hover:from-emerald-600/20 hover:to-emerald-900/20"
          valueClass="text-emerald-300 font-semibold bg-gradient-to-br from-emerald-200 to-emerald-400 bg-clip-text text-transparent text-lg sm:text-xl"
          labelClass={typography.sections.label}
          className="p-2 sm:p-3"
        />

        {/* Sets Card */}
        <MetricCard
          icon={Timer}
          value={`${completedSets}/${totalSets}`}
          label="Sets"
          tooltip={`${Math.round(completionPercentage)}% sets completed`}
          progressValue={completionPercentage}
          gradientClass="from-violet-600/10 via-black/5 to-violet-900/10 hover:from-violet-600/20 hover:to-violet-900/20"
          valueClass="text-violet-300 font-semibold bg-gradient-to-br from-violet-200 to-violet-400 bg-clip-text text-transparent text-lg sm:text-xl"
          labelClass={typography.sections.label}
          className="p-2 sm:p-3"
        />

        {/* Rest Timer Card */}
        <div className={cn(
          "relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border border-white/10 backdrop-blur-xl transition-all duration-300",
          "bg-gradient-to-br from-gray-900/80 via-gray-800/40 to-gray-900/90 hover:from-orange-600/20 hover:to-orange-900/20",
          "hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/10",
          "min-w-[80px] w-full",
          "relative overflow-hidden"
        )}>
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative mb-1 sm:mb-2 rounded-full bg-white/8 shadow-inner flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center">
              <CircularProgress
                value={showRestTimer ? 100 : 0}
                size={32}
                className="text-orange-500/20"
              >
                <Timer
                  size={16}
                  className={cn(
                    "text-orange-300 absolute inset-0 m-auto",
                    showRestTimer && "animate-pulse"
                  )}
                />
              </CircularProgress>
            </div>
            <TopRestTimer
              isActive={showRestTimer}
              onComplete={onRestTimerComplete}
              resetSignal={resetCounter}
              onTimeUpdate={onRestTimeUpdate}
              onManualStart={onManualRestStart}
              currentRestTime={currentRestTime}
              className="scale-90 sm:scale-100"
            />

            {!showRestTimer && (
              <Button
                variant="outline"
                size="sm"
                onClick={onManualRestStart}
                className="mt-1 sm:mt-2 bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20 text-orange-300 transition-all duration-300 text-xs font-medium scale-90 sm:scale-100"
              >
                <Play size={12} className="mr-1" /> Start Timer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
