import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Clock, Activity, ChevronRight } from "lucide-react";
import { format } from 'date-fns';

interface LastWorkoutSummaryProps {
  workouts: any[];
}

export const LastWorkoutSummary: React.FC<LastWorkoutSummaryProps> = ({ workouts }) => {

  if (!workouts || workouts.length === 0) {
    return (
      <Card className="bg-gray-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white/90">
            <Activity className="h-5 w-5 text-purple-400" />
            Recent Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400">
            No recent workouts found
          </div>
        </CardContent>
      </Card>
    );
  }

  const lastWorkout = workouts[0];
  console.log('LastWorkoutSummary - workout data:', lastWorkout);
  
  // Get exercise data from the correct property
  const exerciseData = lastWorkout.exercises || lastWorkout.exercise_sets || [];
  console.log('Exercise data:', exerciseData);
  
  // Count unique exercises, not total sets
  const uniqueExercises = new Set(exerciseData.map((set: any) => set.exercise_name) || []).size;
  
  // Calculate total volume from exercise sets
  const totalVolume = exerciseData.reduce((sum: number, set: any) => {
    const volume = (set.weight || 0) * (set.reps || 0);
    console.log('Set volume calculation:', { weight: set.weight, reps: set.reps, volume });
    return sum + volume;
  }, 0) || 0;
  
  console.log('Total volume calculated:', totalVolume, 'from', exerciseData.length, 'sets');

  const handleViewDetails = () => {
    window.location.href = `/workout/${lastWorkout.id}`;
  };

  return (
    <Card className="bg-gray-900/50 border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white/90">
          <Activity className="h-5 w-5 text-purple-400" />
          Recent Session
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-lg font-semibold text-white">
            {lastWorkout.name || lastWorkout.training_type}
          </div>
          <div className="text-sm text-gray-400">
            {format(new Date(lastWorkout.start_time), 'MMM d, yyyy')}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              Duration
            </div>
            <div className="text-sm font-medium text-white">
              {lastWorkout.duration ? Math.round(lastWorkout.duration / 60) : 0}m
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Dumbbell className="h-3 w-3" />
              Volume
            </div>
            <div className="text-sm font-medium text-white">
              {totalVolume > 0 ? `${Math.round(totalVolume).toLocaleString()}kg` : '0kg'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Activity className="h-3 w-3" />
              Exercises
            </div>
            <div className="text-sm font-medium text-white">
              {uniqueExercises}
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full border-white/20 text-white hover:bg-white/10"
          onClick={handleViewDetails}
        >
          View Full Details
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};