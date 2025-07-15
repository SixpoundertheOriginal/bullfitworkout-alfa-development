import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Dumbbell,
  Clock,
  BarChart2
} from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { ExerciseSet } from '@/types/exercise';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useWorkoutStats } from '@/hooks/useWorkoutStats';

export function WorkoutCalendarTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  
  const { data: workouts, isLoading: loadingWorkouts } = useQuery({
    queryKey: ['calendar-workouts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
  
  const selectedDateISO = date ? format(date, 'yyyy-MM-dd') : '';
  
  const { data: selectedDayWorkouts, isLoading: loadingDayWorkouts } = useQuery({
    queryKey: ['day-workouts', user?.id, selectedDateISO],
    queryFn: async () => {
      if (!date) return [];
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!date,
  });
  
  const { data: exerciseSets, isLoading: loadingSets } = useQuery({
    queryKey: ['selected-day-exercise-sets', selectedDayWorkouts],
    queryFn: async () => {
      if (!selectedDayWorkouts || selectedDayWorkouts.length === 0) return {};
      
      const workoutIds = selectedDayWorkouts.map(w => w.id);
      
      const { data, error } = await supabase
        .from('exercise_sets')
        .select('*')
        .in('workout_id', workoutIds);
      
      if (error) throw error;
      
      const setsByWorkout: Record<string, ExerciseSet[]> = {};
      data?.forEach(set => {
        if (!setsByWorkout[set.workout_id]) {
          setsByWorkout[set.workout_id] = [];
        }
        setsByWorkout[set.workout_id].push(set as ExerciseSet);
      });
      
      return setsByWorkout || {};
    },
    enabled: !!selectedDayWorkouts && selectedDayWorkouts.length > 0,
  });
  
  const workoutDates: Record<string, boolean> = {};
  workouts?.forEach(workout => {
    const date = parseISO(workout.start_time);
    const dateString = format(date, 'yyyy-MM-dd');
    workoutDates[dateString] = true;
  });
  
  const handlePreviousMonth = () => {
    const previousMonth = new Date(month);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    setMonth(previousMonth);
  };
  
  const handleNextMonth = () => {
    const nextMonth = new Date(month);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setMonth(nextMonth);
  };
  
  const handleViewWorkout = (workoutId: string) => {
    navigate(`/workout/${workoutId}`);
  };
  
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins ? `${mins}m` : ''}`;
  };
  
  const renderDateCell = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const hasWorkout = workoutDates[dateString];
    const isSelectedDate = selectedDateISO === dateString;
    
    return (
      <div className={`h-9 w-9 p-0 relative font-normal aria-selected:opacity-100 hover:bg-gray-800/80 rounded-md
        ${hasWorkout ? 'font-medium' : ''}
        ${isToday(date) ? 'border border-purple-500' : ''}
      `}>
        <div className="absolute inset-0 flex items-center justify-center">
          {date.getDate()}
        </div>
        {hasWorkout && (
          <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full 
            ${isSelectedDate ? 'bg-white' : 'bg-purple-500'}`}
          />
        )}
      </div>
    );
  };
  
  const renderWorkoutDetails = (workout: any) => {
    const workoutSets = exerciseSets?.[workout.id] || [];
    const exerciseCount = new Set(workoutSets.map(set => set.exercise_name)).size;
    const totalSets = workoutSets.length;
    const totalVolume = workoutSets.reduce((acc, set) => acc + (set.weight * set.reps), 0);
    
    const startTime = new Date(workout.start_time);
    
    return (
      <Card className="mb-3 bg-gray-800/30 border-gray-700/50" key={workout.id}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-base font-medium">{workout.name || `${workout.training_type} Workout`}</h3>
              <p className="text-xs text-gray-400">{format(startTime, 'h:mm a')}</p>
            </div>
            <span className="bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded text-xs">
              {workout.training_type}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="flex items-center gap-1.5">
              <Clock className="text-gray-400 h-4 w-4" />
              <span className="text-sm">{formatDuration(workout.duration)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Dumbbell className="text-gray-400 h-4 w-4" />
              <span className="text-sm">{exerciseCount} exercises</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart2 className="text-gray-400 h-4 w-4" />
              <span className="text-sm">{totalSets} sets</span>
            </div>
          </div>
          
          <div className="mt-3">
            <Button 
              variant="outline" 
              className="w-full text-xs h-8 border-gray-600 bg-gray-800/50 hover:bg-gray-700"
              onClick={() => handleViewWorkout(workout.id)}
            >
              View Workout Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="pb-4">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
        <div className="md:col-span-3 lg:col-span-3">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Workout Calendar</h3>
              <div className="flex">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handlePreviousMonth}
                  className="h-7 w-7 text-gray-400"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="px-2 flex items-center text-sm">
                  {format(month, 'MMMM yyyy')}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleNextMonth}
                  className="h-7 w-7 text-gray-400"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-0 bg-transparent">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                month={month}
                onMonthChange={setMonth}
                className="w-full pointer-events-auto"
                classNames={{
                  day_selected: "bg-purple-600 text-white hover:bg-purple-600/90",
                  day_today: "bg-gray-800 text-white",
                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 pointer-events-auto"
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="md:col-span-4 lg:col-span-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 h-full">
            {date && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-purple-400" />
                    {format(date, 'EEEE, MMMM d, yyyy')}
                  </h3>
                  {isToday(date) && (
                    <span className="bg-green-500/20 text-green-300 px-2 py-0.5 text-xs rounded-full">
                      Today
                    </span>
                  )}
                </div>
                
                <div className="space-y-4">
                  {loadingDayWorkouts ? (
                    Array(2).fill(0).map((_, i) => (
                      <Card className="mb-3 bg-gray-800/30 border-gray-700/50" key={i}>
                        <CardContent className="p-4">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/4 mb-4" />
                          <div className="grid grid-cols-3 gap-2 mt-4">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : selectedDayWorkouts && selectedDayWorkouts.length > 0 ? (
                    <div>
                      {selectedDayWorkouts.map(workout => renderWorkoutDetails(workout))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Dumbbell className="mx-auto h-12 w-12 text-gray-700 mb-2" />
                      <p>No workouts on this day</p>
                      <Button 
                        variant="outline" 
                        className="mt-4 border-purple-600/50 text-purple-400"
                        onClick={() => navigate('/training-session')}
                      >
                        Start a Workout
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
