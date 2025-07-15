
import React, { useEffect, useRef } from "react";
import { CircularProgress } from "./ui/circular-progress";
import { Timer, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RestTimerControlsProps {
  elapsedTime: number;
  maxTime: number;
  isActive: boolean;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
  className?: string;
  compact?: boolean;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const RestTimerControls = ({
  elapsedTime,
  maxTime,
  isActive,
  onPause,
  onResume,
  onReset,
  onSkip,
  className = "",
  compact = false,
}: RestTimerControlsProps) => {
  const progress = Math.min((elapsedTime / maxTime) * 100, 100);
  const toastObserverRef = useRef<MutationObserver | null>(null);
  
  useEffect(() => {
    console.log("RestTimerControls useEffect:", { elapsedTime, isActive, progress });
    
    // Listen for toast events to reset timer
    const resetOnToast = () => {
      console.log("RestTimerControls: Toast detected, resetting timer");
      if (isActive) {
        onReset();
      }
    };
    
    // Create a MutationObserver to watch for toast elements
    if (!toastObserverRef.current) {
      toastObserverRef.current = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (node instanceof HTMLElement && 
                  (node.classList.contains('toast') || 
                   node.getAttribute('role') === 'status' || 
                   node.getAttribute('data-sonner-toast') === 'true')) {
                if (node.textContent && node.textContent.includes("logged successfully")) {
                  resetOnToast();
                }
              }
            });
          }
        });
      });
      
      // Start observing the document body
      toastObserverRef.current.observe(document.body, { childList: true, subtree: true });
    }
    
    return () => {
      if (toastObserverRef.current) {
        toastObserverRef.current.disconnect();
        toastObserverRef.current = null;
      }
    };
  }, [elapsedTime, isActive, progress, onReset]);
  
  console.log("RestTimerControls rendered:", { elapsedTime, isActive, progress });

  if (compact) {
    return (
      <div className={cn("flex flex-col items-center gap-1", className)}>
        <Timer size={20} className={cn(
          "text-purple-400 mb-1",
          isActive && "animate-pulse"
        )} />
        <span className="text-lg font-mono text-white">
          {formatTime(elapsedTime)}
        </span>
        <span className="text-xs text-gray-400 font-medium">Rest</span>
        {!isActive && (
          <Button
            variant="outline"
            size="sm"
            className="mt-1 bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
            onClick={() => {
              onResume();
              onReset(); // Reset the timer when manually started
            }}
          >
            <Play size={14} className="mr-1" /> Start
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative flex items-center justify-center">
        <CircularProgress 
          value={progress} 
          className="w-16 h-16 [&>circle]:text-purple-500/20 [&>circle:last-child]:text-purple-500" 
        />
        <span className="absolute font-mono text-white text-sm">{formatTime(elapsedTime)}</span>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline" 
          size="icon"
          className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
          onClick={() => {
            if (isActive) {
              onPause();
            } else {
              onResume();
              onReset(); // Reset the timer when manually started
            }
          }}
        >
          {isActive ? <Pause size={18} /> : <Play size={18} />}
        </Button>
        <Button
          variant="outline"
          size="icon" 
          className="bg-gray-800/50 border-gray-700 hover:bg-gray-700 text-white"
          onClick={onSkip}
        >
          <Timer size={18} />
        </Button>
      </div>
    </div>
  );
};
