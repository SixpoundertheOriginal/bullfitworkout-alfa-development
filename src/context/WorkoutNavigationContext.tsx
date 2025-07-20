import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWorkoutStore } from '@/store/workoutStore';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createContext } from '@/utils/createContext';

interface WorkoutNavigationContextType {
  confirmNavigation: (to: string) => void;
}

const [Provider, useWorkoutNavigation] = createContext<WorkoutNavigationContextType>();

export function WorkoutNavigationContextProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isActive, updateLastActiveRoute } = useWorkoutStore();
  const { isVisible } = usePageVisibility();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [lastPath, setLastPath] = useState<string>(location.pathname);

  const isTrainingRoute = location.pathname === '/training-session';
  
  // Update last active route if we're on the training session page
  useEffect(() => {
    if (isTrainingRoute) {
      updateLastActiveRoute(location.pathname);
      console.log('Updated last active route:', location.pathname);
    }
    
    // Keep track of last path for recovery
    setLastPath(location.pathname);
  }, [isTrainingRoute, location.pathname, updateLastActiveRoute]);

  // Log debug info for navigation context
  useEffect(() => {
    console.log('WorkoutNavigationContext state:', { 
      isActive, 
      currentPath: location.pathname,
      isTrainingRoute,
      isVisible
    });
  }, [isActive, location.pathname, isTrainingRoute, isVisible]);

  // Navigation confirmation logic
  const confirmNavigation = useCallback((to: string) => {
    // Skip confirmation if navigating to the same page
    if (to === location.pathname) {
      return;
    }
    
    if (isActive && isTrainingRoute) {
      setShowDialog(true);
      setPendingNavigation(to);
      console.log('Confirming navigation from workout to:', to);
    } else {
      navigate(to);
    }
  }, [isActive, isTrainingRoute, navigate, location.pathname]);

  return (
    <Provider value={{ confirmNavigation }}>
      {children}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Active Workout in Progress</AlertDialogTitle>
            <AlertDialogDescription>
              You have an active workout. Are you sure you want to leave? Your progress will be saved and you can return any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDialog(false)}>
              Return to Workout
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingNavigation) {
                  navigate(pendingNavigation);
                }
                setShowDialog(false);
              }}
            >
              Leave Workout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Provider>
  );
}

export { useWorkoutNavigation };
