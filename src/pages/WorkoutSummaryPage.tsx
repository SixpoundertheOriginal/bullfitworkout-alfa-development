import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Calendar, RotateCcw } from 'lucide-react';
import { useWorkoutStore } from '@/store/workoutStore';

interface WorkoutSummaryData {
  workoutId: string;
  name: string;
  duration: number;
  exerciseCount: number;
  totalSets: number;
  totalVolume: number;
  trainingType?: string;
  completedAt: string;
}

export const WorkoutSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearWorkoutState } = useWorkoutStore();
  
  // Get workout data from navigation state
  const workoutData = location.state?.workoutData as WorkoutSummaryData;
  
  // If no workout data, redirect to home
  React.useEffect(() => {
    if (!workoutData) {
      navigate('/', { replace: true });
    }
  }, [workoutData, navigate]);

  const handleStartNewWorkout = () => {
    // Clear any remaining workout state
    clearWorkoutState();
    
    // Navigate to training setup
    navigate('/training-session');
  };

  const handleViewHistory = () => {
    navigate('/');
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!workoutData) {
    return null; // Will redirect to home
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Workout Complete!</h1>
            <p className="text-muted-foreground">Great job finishing your session</p>
          </div>
        </div>

        {/* Workout Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {workoutData.name}
            </CardTitle>
            {workoutData.trainingType && (
              <Badge variant="secondary" className="w-fit">
                {workoutData.trainingType}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Duration</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatDuration(workoutData.duration)}
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Exercises</div>
                <p className="text-2xl font-bold text-foreground">
                  {workoutData.exerciseCount}
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Total Sets</div>
                <p className="text-2xl font-bold text-foreground">
                  {workoutData.totalSets}
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Volume</div>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(workoutData.totalVolume)}kg
                </p>
              </div>
            </div>

            {/* Completion Time */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Completed at {new Date(workoutData.completedAt).toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Achievement Badge */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="pt-6 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Achievement Unlocked!</h3>
              <p className="text-muted-foreground">
                You've completed another step towards your fitness goals
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleStartNewWorkout}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Start New Workout
          </Button>
          
          <Button 
            onClick={handleViewHistory}
            variant="outline"
            className="w-full h-12 text-base"
            size="lg"
          >
            View Workout History
          </Button>
        </div>

        {/* Footer Message */}
        <div className="text-center text-sm text-muted-foreground">
          Keep up the consistency! Every workout brings you closer to your goals.
        </div>
      </div>
    </div>
  );
};

export default WorkoutSummaryPage;