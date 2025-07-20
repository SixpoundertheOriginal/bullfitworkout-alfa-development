import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useWorkoutStore } from '@/store/workoutStore';

interface ClearWorkoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
}

export const ClearWorkoutButton: React.FC<ClearWorkoutButtonProps> = ({
  variant = 'outline',
  size = 'default',
  className = '',
  showIcon = true
}) => {
  const [isClearing, setIsClearing] = useState(false);
  const { clearWorkoutState, isActive, exercises } = useWorkoutStore();

  const handleClearWorkout = async () => {
    setIsClearing(true);
    
    try {
      clearWorkoutState();
      setTimeout(() => {
        setIsClearing(false);
      }, 500);
    } catch (error) {
      console.error('Error clearing workout:', error);
      setIsClearing(false);
    }
  };

  const exerciseCount = Object.keys(exercises || {}).length;
  const hasWorkoutData = isActive || exerciseCount > 0;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isClearing}
        >
          {showIcon && <Trash2 className="h-4 w-4 mr-1" />}
          {isClearing ? 'Clearing...' : 'Clear Workout'}
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Clear Workout Session?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This will permanently delete all workout data, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li>All exercises and sets ({exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''})</li>
              <li>Workout timing and progress</li>
              <li>Rest timer states</li>
              <li>Training configuration</li>
            </ul>
            {hasWorkoutData && (
              <p className="font-medium text-red-600">
                You have an active workout session. This action cannot be undone.
              </p>
            )}
            {!hasWorkoutData && (
              <p className="text-muted-foreground">
                This will clear any corrupted data and reset the app to a clean state.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClearWorkout}
            className="bg-red-600 hover:bg-red-700"
            disabled={isClearing}
          >
            {isClearing ? 'Clearing...' : 'Clear Everything'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};