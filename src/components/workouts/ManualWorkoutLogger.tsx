import React, { useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useWorkoutSave } from '@/hooks/useWorkoutSave';
import { ExerciseAutocomplete } from '@/components/ExerciseAutocomplete';
import { ManualSetInput } from '@/components/workouts/ManualSetInput';
import { TrainingTypeSelector } from '@/components/training/TrainingTypeSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { X, Plus, Calendar as CalendarIcon, Clock, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ManualWorkoutLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ManualExerciseSet {
  weight: number;
  reps: number;
  restTime: number;
  completed: boolean;
  isEditing: boolean;
}

interface ManualExercise {
  name: string;
  sets: ManualExerciseSet[];
}

export const ManualWorkoutLogger: React.FC<ManualWorkoutLoggerProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [workoutDate, setWorkoutDate] = useState<Date>(new Date());
  const [workoutName, setWorkoutName] = useState('');
  const [trainingType, setTrainingType] = useState('');
  const [duration, setDuration] = useState<number>(60); // minutes
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<ManualExercise[]>([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setWorkoutDate(new Date());
      setWorkoutName('');
      setTrainingType('');
      setDuration(60);
      setNotes('');
      setExercises([]);
    }
  }, [isOpen]);

  const addExercise = (exerciseName: string) => {
    if (exercises.find(ex => ex.name === exerciseName)) {
      toast({
        title: "Exercise already added",
        description: `${exerciseName} is already in this workout`,
        variant: "destructive"
      });
      return;
    }

    const newExercise: ManualExercise = {
      name: exerciseName,
      sets: [{
        weight: 0,
        reps: 0,
        restTime: 60,
        completed: true,
        isEditing: false
      }]
    };

    setExercises(prev => [...prev, newExercise]);
  };

  const removeExercise = (exerciseName: string) => {
    setExercises(prev => prev.filter(ex => ex.name !== exerciseName));
  };

  const addSet = (exerciseName: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.name === exerciseName) {
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, {
            weight: lastSet?.weight || 0,
            reps: lastSet?.reps || 0,
            restTime: 60,
            completed: true,
            isEditing: false
          }]
        };
      }
      return ex;
    }));
  };

  const updateSet = (exerciseName: string, setIndex: number, updatedSet: Partial<ManualExerciseSet>) => {
    setExercises(prev => prev.map(ex => {
      if (ex.name === exerciseName) {
        return {
          ...ex,
          sets: ex.sets.map((set, idx) => 
            idx === setIndex ? { ...set, ...updatedSet } : set
          )
        };
      }
      return ex;
    }));
  };

  const deleteSet = (exerciseName: string, setIndex: number) => {
    setExercises(prev => prev.map(ex => {
      if (ex.name === exerciseName) {
        if (ex.sets.length === 1) {
          // If it's the last set, remove the entire exercise
          return null;
        }
        return {
          ...ex,
          sets: ex.sets.filter((_, idx) => idx !== setIndex)
        };
      }
      return ex;
    }).filter(Boolean) as ManualExercise[]);
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save workouts",
        variant: "destructive"
      });
      return;
    }

    if (!workoutName.trim()) {
      toast({
        title: "Workout name required",
        description: "Please enter a name for your workout",
        variant: "destructive"
      });
      return;
    }

    if (!trainingType) {
      toast({
        title: "Training type required",
        description: "Please select a training type",
        variant: "destructive"
      });
      return;
    }

    if (exercises.length === 0) {
      toast({
        title: "Add exercises",
        description: "Please add at least one exercise to your workout",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Format workout data for saving
      const startTime = new Date(workoutDate);
      startTime.setHours(9, 0, 0, 0); // Default to 9 AM
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      const workoutData = {
        user_id: user.id,
        name: workoutName,
        training_type: trainingType,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration: duration * 60, // Convert to seconds
        notes: notes || null,
        is_historical: true,
        logged_at: new Date().toISOString()
      };

      // Format exercise sets for saving
      const exerciseSets = exercises.flatMap((exercise, exerciseIndex) => 
        exercise.sets.map((set, setIndex) => ({
          exercise_name: exercise.name,
          weight: set.weight,
          reps: set.reps,
          completed: set.completed,
          set_number: setIndex + 1,
          rest_time: set.restTime
        }))
      );

      // Use the Supabase client directly
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('save-complete-workout', {
        body: {
          workout_data: workoutData,
          exercise_sets: exerciseSets
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to save workout');
      }

      if (data?.workout_id) {
        toast({
          title: "Workout saved successfully!",
          description: `${workoutName} has been logged for ${format(workoutDate, 'MMM dd, yyyy')}`,
        });
        onSuccess();
      } else {
        throw new Error(data?.error || 'Failed to save workout');
      }
    } catch (error) {
      console.error('Error saving manual workout:', error);
      toast({
        title: "Failed to save workout",
        description: "Please try again or check your connection",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Log Past Workout
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Workout Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workout-name">Workout Name</Label>
              <Input
                id="workout-name"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="e.g., Push Day, Morning Run..."
              />
            </div>

            <div className="space-y-2">
              <Label>Workout Date</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !workoutDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {workoutDate ? format(workoutDate, 'PPP') : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={workoutDate}
                    onSelect={(date) => {
                      if (date) {
                        setWorkoutDate(date);
                        setIsCalendarOpen(false);
                      }
                    }}
                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Training Type</Label>
              <TrainingTypeSelector
                selectedType={trainingType}
                onSelect={setTrainingType}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
                max={480}
              />
            </div>
          </div>

          {/* Exercises Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Exercises</h3>
              <ExerciseAutocomplete
                onSelectExercise={(exercise) => addExercise(exercise.name)}
              />
            </div>

            {exercises.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-400">
                  <p>No exercises added yet</p>
                  <p className="text-sm">Use the search above to add exercises</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {exercises.map((exercise) => (
                  <Card key={exercise.name}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex justify-between items-center text-base">
                        <span>{exercise.name}</span>
                        <div className="flex gap-2">
                          <Badge variant="secondary">
                            {exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addSet(exercise.name)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeExercise(exercise.name)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {exercise.sets.map((set, setIndex) => (
                        <ManualSetInput
                          key={setIndex}
                          setNumber={setIndex + 1}
                          weight={set.weight}
                          reps={set.reps}
                          restTime={set.restTime}
                          onWeightChange={(weight) => updateSet(exercise.name, setIndex, { weight })}
                          onRepsChange={(reps) => updateSet(exercise.name, setIndex, { reps })}
                          onRestTimeChange={(restTime) => updateSet(exercise.name, setIndex, { restTime })}
                          onDelete={() => deleteSet(exercise.name, setIndex)}
                          canDelete={exercise.sets.length > 1}
                        />
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did the workout feel? Any notable achievements or observations..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Workout
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};