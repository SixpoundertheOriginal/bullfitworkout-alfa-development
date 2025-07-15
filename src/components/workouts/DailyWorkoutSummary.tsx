
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CalendarDays, Clock, Dumbbell, ArrowLeft, ArrowRight } from "lucide-react";
import { WorkoutCard } from "@/components/WorkoutCard";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TrainingStartButton } from '@/components/training/TrainingStartButton';

interface DailyWorkoutSummaryProps {
  date: string;
  onClose?: () => void;
  preview?: boolean;
}

export const DailyWorkoutSummary = ({ date, onClose, preview = false }: DailyWorkoutSummaryProps) => {
  const { workouts, exerciseCounts, isLoading } = useWorkoutHistory({
    startDate: date,
    endDate: date
  });
  
  const navigate = useNavigate();
  
  const formattedDate = format(new Date(date), 'MMMM d, yyyy');
  
  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/training?tab=calendar');
    }
  };

  const handleViewAll = () => {
    navigate(`/training?tab=history&date=${date}`);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-purple-400" />
            {formattedDate}
          </CardTitle>
          {!preview ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="flex items-center gap-1 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {workouts.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                  <Clock className="h-4 w-4" />
                  Total Time
                </div>
                <div className="text-xl font-semibold">
                  {workouts.reduce((acc, w) => acc + (w.duration || 0), 0)} min
                </div>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                  <Dumbbell className="h-4 w-4" />
                  Workouts
                </div>
                <div className="text-xl font-semibold">
                  {workouts.length}
                </div>
              </div>
            </div>
            
            <div className="space-y-3 mt-4">
              {workouts.map((workout) => (
                <WorkoutCard
                  key={workout.id}
                  id={workout.id}
                  name={workout.name}
                  type={workout.training_type}
                  date={workout.start_time}
                  duration={workout.duration}
                  exerciseCount={exerciseCounts[workout.id]?.exercises || 0}
                  setCount={exerciseCounts[workout.id]?.sets || 0}
                />
              ))}
            </div>
            
            {preview && (
              <Button
                onClick={handleViewAll}
                className="w-full mt-4 flex items-center justify-center gap-2"
                variant="outline"
              >
                View Full Summary
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-gray-400 mb-6">No workouts recorded on this date</p>
            
            {/* Add start button for current date */}
            {date === format(new Date(), 'yyyy-MM-dd') && (
              <div className="flex justify-center mt-4">
                <TrainingStartButton 
                  label="Start Today's Workout" 
                  size={100}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
