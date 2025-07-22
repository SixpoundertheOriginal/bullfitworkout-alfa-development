
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkoutStore } from '@/store/workoutStore';
import { cn } from '@/lib/utils';
import { Dumbbell, PlayCircle, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { formatTime } from '@/utils/formatTime';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { toast } from "@/hooks/use-toast";
import { quickHealthCheck, clearCorruption } from '@/utils/immediateCorruptionCleanup';

export const WorkoutBanner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isVisible } = usePageVisibility();
  const { 
    isActive, 
    exercises, 
    elapsedTime, 
    workoutStatus,
    explicitlyEnded,
    lastTabActivity
  } = useWorkoutStore();
  const [visible, setVisible] = useState(false);
  const [isStuck, setIsStuck] = useState(false);
  const lastCheckRef = useRef<number>(Date.now());
  
  // Update banner visibility
  useEffect(() => {
    const currentPath = location.pathname;
    const exerciseCount = Object.keys(exercises).length;
    const shouldShow = isActive && 
                     !explicitlyEnded && 
                     workoutStatus !== 'saved' &&
                     currentPath !== '/training-session' && 
                     exerciseCount > 0;
                     
    // Debug info
    console.log('WorkoutBanner evaluated:', { 
      isActive, 
      workoutStatus,
      currentPath,
      exerciseCount,
      elapsedTime,
      explicitlyEnded,
      visible: shouldShow
    });
    
    setVisible(shouldShow);
  }, [isActive, exercises, location, workoutStatus, explicitlyEnded]);
  
  // Handle visibility changes and check for stuck states
  useEffect(() => {
    if (isVisible) {
      console.log('Tab visible in WorkoutBanner, checking workout state');
      
      // Check for stuck workout state
      const now = Date.now();
      if (workoutStatus === 'saving' && lastTabActivity) {
        const stuckTime = now - lastTabActivity;
        // If stuck in saving state for more than 2 minutes
        if (stuckTime > 2 * 60 * 1000) {
          setIsStuck(true);
        }
      } else if (workoutStatus !== 'saved' && now - lastCheckRef.current > 60 * 1000) {
        // Run health check every minute for active workouts
        const health = quickHealthCheck();
        if (!health.isHealthy) {
          setIsStuck(true);
        }
        lastCheckRef.current = now;
      }
    }
  }, [isVisible, workoutStatus, lastTabActivity]);
  
  // Handle emergency reset for stuck workouts
  const handleEmergencyReset = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to training session
    
    toast({
      title: "Emergency workout reset",
      description: "Cleaning up stuck workout data...",
      duration: 3000,
    });
    
    const success = clearCorruption(true); // Skip confirmation for better UX
    
    if (success) {
      toast({
        title: "Workout reset successful",
        description: "Your workout has been reset. The page will refresh.",
        duration: 3000,
      });
      
      // Auto-refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      toast({
        title: "Reset failed",
        description: "Please try refreshing the page manually",
        variant: "destructive",
        duration: 5000,
      });
    }
  };
  
  // Handle navigation to workout session
  const handleResumeWorkout = () => {
    navigate('/training-session');
    
    if (Object.keys(exercises).length > 0) {
      toast({
        title: "Resuming your workout",
      });
    }
  };
  
  if (!visible) return null;
  
  const exerciseCount = Object.keys(exercises).length;
  
  return (
    <div className={cn(
      "fixed bottom-16 inset-x-0 z-50 px-4 py-2",
      "transform transition-all duration-300 ease-in-out",
      visible ? "translate-y-0" : "translate-y-full"
    )}>
      <div 
        onClick={handleResumeWorkout}
        className={cn(
          "rounded-lg p-3 shadow-lg border flex items-center justify-between cursor-pointer transition-colors",
          isStuck 
            ? "bg-gradient-to-r from-red-900/90 to-orange-800/90 border-red-700/50 hover:from-red-800/90 hover:to-orange-700/90" 
            : "bg-gradient-to-r from-purple-900/90 to-blue-900/90 border-blue-800/50 hover:from-purple-800/90 hover:to-blue-800/90"
        )}
      >
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2 rounded-full",
            isStuck ? "bg-red-800/60" : "bg-blue-800/60"
          )}>
            {isStuck ? (
              <AlertTriangle className="h-5 w-5 text-orange-200" />
            ) : (
              <Dumbbell className="h-5 w-5 text-blue-200" />
            )}
          </div>
          <div>
            <h4 className="font-medium text-white">
              {isStuck ? "Workout Stuck" : "Active Workout"}
            </h4>
            <p className="text-xs text-blue-200">
              {isStuck 
                ? `${workoutStatus === 'saving' ? 'Stuck while saving' : 'Recovery needed'}`
                : `${exerciseCount} ${exerciseCount === 1 ? 'exercise' : 'exercises'} in progress`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-blue-200 text-sm">
            <Clock className="h-3.5 w-3.5 mr-1" />
            {formatTime(elapsedTime)}
          </div>
          
          {isStuck ? (
            <button
              onClick={handleEmergencyReset}
              className="flex items-center justify-center bg-red-600 hover:bg-red-700 rounded-full p-1.5 text-white transition-colors"
              aria-label="Emergency Reset"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          ) : (
            <PlayCircle className="h-6 w-6 text-blue-200" />
          )}
        </div>
      </div>
    </div>
  );
};
