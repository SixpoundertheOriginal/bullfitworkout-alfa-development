
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, CalendarDays, Dumbbell, Flame, Timer, Zap } from "lucide-react";
import { WorkoutStats } from "@/types/workout-metrics";

interface WorkoutSummaryProps {
  stats: WorkoutStats;
  className?: string;
}

export const WorkoutSummary = ({ stats, className = "" }: WorkoutSummaryProps) => {
  const navigate = useNavigate();
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };
  
  // Helper to get progress trend information
  const getProgressTrend = () => {
    if (!stats.progressMetrics) return null;
    
    const { volumeChangePercentage, strengthTrend } = stats.progressMetrics;
    
    if (Math.abs(volumeChangePercentage) < 3) {
      return { text: "Maintaining", color: "text-blue-400" };
    }
    
    if (strengthTrend === 'increasing') {
      return { 
        text: `Up ${Math.round(volumeChangePercentage)}%`, 
        color: "text-green-400" 
      };
    }
    
    if (strengthTrend === 'decreasing') {
      return { 
        text: `Down ${Math.round(Math.abs(volumeChangePercentage))}%`, 
        color: "text-red-400" 
      };
    }
    
    return { text: "Fluctuating", color: "text-yellow-400" };
  };
  
  const progressTrend = getProgressTrend();
  
  return (
    <Card className={`bg-gray-900 border-gray-800 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Workout Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col">
            <span className="text-3xl font-bold">{stats.totalWorkouts}</span>
            <span className="text-sm text-gray-400">Total Workouts</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold">{formatDuration(stats.totalDuration)}</span>
            <span className="text-sm text-gray-400">Total Time</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800 rounded p-2 text-center">
            <Dumbbell size={18} className="mx-auto mb-1 text-purple-400" />
            <span className="text-lg font-semibold">{stats.totalExercises}</span>
            <p className="text-xs text-gray-400">Exercises</p>
          </div>
          <div className="bg-gray-800 rounded p-2 text-center">
            <BarChart3 size={18} className="mx-auto mb-1 text-purple-400" />
            <span className="text-lg font-semibold">{stats.totalSets}</span>
            <p className="text-xs text-gray-400">Sets</p>
          </div>
          <div className="bg-gray-800 rounded p-2 text-center">
            <Timer size={18} className="mx-auto mb-1 text-purple-400" />
            <span className="text-lg font-semibold">{Math.round(stats.avgDuration)}</span>
            <p className="text-xs text-gray-400">Avg Min</p>
          </div>
        </div>
        
        {stats.progressMetrics && progressTrend && (
          <div className="mt-4 bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className={`text-sm font-medium ${progressTrend.color}`}>
                {progressTrend.text}
              </span>
            </div>
            
            {stats.progressMetrics.consistencyScore > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Consistency</span>
                  <span>{Math.round(stats.progressMetrics.consistencyScore)}%</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                    style={{ width: `${stats.progressMetrics.consistencyScore}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        {stats.streakDays > 0 && (
          <div className="mt-4 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Flame className="text-orange-400" size={20} />
              <span className="font-medium">
                {stats.streakDays} day{stats.streakDays !== 1 ? 's' : ''} streak!
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1">
              Keep it up and maintain your progress!
            </p>
          </div>
        )}
        
        <Button 
          className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          onClick={() => navigate('/training-session')}
        >
          <Zap size={16} className="mr-2" />
          Start New Workout
        </Button>
      </CardContent>
    </Card>
  );
};
