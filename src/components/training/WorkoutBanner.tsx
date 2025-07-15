
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkoutStore } from '@/store/workoutStore';
import { cn } from '@/lib/utils';
import { Dumbbell, PlayCircle, Clock } from 'lucide-react';
import { formatTime } from '@/utils/formatTime';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { toast } from "@/hooks/use-toast";

export const WorkoutBanner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isVisible } = usePageVisibility();
  const { 
    isActive, 
    exercises, 
    elapsedTime, 
    workoutStatus,
    explicitlyEnded
  } = useWorkoutStore();
  const [visible, setVisible] = useState(false);
  
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
  
  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      console.log('Tab visible in WorkoutBanner, checking workout state');
    }
  }, [isVisible]);
  
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
        className="bg-gradient-to-r from-purple-900/90 to-blue-900/90 rounded-lg p-3 shadow-lg 
                   border border-blue-800/50 flex items-center justify-between cursor-pointer
                   hover:from-purple-800/90 hover:to-blue-800/90 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="bg-blue-800/60 p-2 rounded-full">
            <Dumbbell className="h-5 w-5 text-blue-200" />
          </div>
          <div>
            <h4 className="font-medium text-white">
              Active Workout
            </h4>
            <p className="text-xs text-blue-200">
              {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'} in progress
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-blue-200 text-sm">
            <Clock className="h-3.5 w-3.5 mr-1" />
            {formatTime(elapsedTime)}
          </div>
          <PlayCircle className="h-6 w-6 text-blue-200" />
        </div>
      </div>
    </div>
  );
};
