import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { IntelligentMetricsDisplay } from '@/components/metrics/IntelligentMetricsDisplay';
import { ExerciseVolumeChart } from '@/components/metrics/ExerciseVolumeChart';
import { PRCelebration } from '@/components/personalRecords/PRCelebration';
import { ExerciseSet } from "@/types/exercise";
import { useWeightUnit } from "@/context/WeightUnitContext";
import { useWorkoutStore } from "@/store/workoutStore";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { usePersonalRecords } from "@/hooks/usePersonalRecords";
import { PRDetectionResult } from "@/services/personalRecordsService";

// Define a local version of ExerciseSet to match what's used in the workout state
interface LocalExerciseSet {
  weight: number;
  reps: number;
  restTime: number;
  completed: boolean;
  isEditing: boolean;
}

export interface WorkoutCompletionEnhancedProps {
  exercises?: Record<string, LocalExerciseSet[]>;
  duration?: number;
  intensity?: number;
  efficiency?: number;
  onComplete?: () => void;
}

export const WorkoutCompletionEnhanced = ({
  exercises = {},
  duration = 0,
  intensity = 0,
  efficiency = 0,
  onComplete = () => {}
}: WorkoutCompletionEnhancedProps = {}) => {
  const { weightUnit } = useWeightUnit();
  const { resetSession } = useWorkoutStore();
  const navigate = useNavigate();
  const { detectPRs, savePRs } = usePersonalRecords();
  
  const [detectedPRs, setDetectedPRs] = useState<Record<string, PRDetectionResult[]>>({});
  const [showPRCelebration, setShowPRCelebration] = useState<Record<string, boolean>>({});

  // Convert LocalExerciseSet to ExerciseSet for the chart components
  const convertedExercises = Object.entries(exercises).reduce((acc, [exerciseName, sets]) => {
    acc[exerciseName] = sets.map((set, index) => ({
      id: `temp-${exerciseName}-${index}`,
      weight: set.weight,
      reps: set.reps,
      completed: set.completed,
      set_number: index + 1,
      exercise_name: exerciseName,
      workout_id: 'temp-workout',
      ...(set.restTime !== undefined && { restTime: set.restTime })
    })) as ExerciseSet[];
    return acc;
  }, {} as Record<string, ExerciseSet[]>);

  // Detect PRs on component mount
  useEffect(() => {
    const detectAllPRs = async () => {
      console.log('🎯 Starting PR detection for workout completion...');
      const prResults: Record<string, PRDetectionResult[]> = {};
      const celebrationStates: Record<string, boolean> = {};

      for (const [exerciseName, sets] of Object.entries(exercises)) {
        const completedSets = sets.filter(set => set.completed);
        if (completedSets.length === 0) {
          console.log(`⏭️ Skipping ${exerciseName} - no completed sets`);
          continue;
        }

        console.log(`🔍 Checking PRs for ${exerciseName} with ${completedSets.length} completed sets`);

        // Check each completed set for PRs
        for (const set of completedSets) {
          try {
            const prs = await detectPRs.mutateAsync({
              exerciseName,
              weight: set.weight,
              reps: set.reps
            });

            if (prs.some(pr => pr.isNewPR)) {
              if (!prResults[exerciseName]) {
                prResults[exerciseName] = [];
              }
              
              // Merge PRs, keeping the best ones
              prs.forEach(newPR => {
                if (newPR.isNewPR) {
                  const existingPR = prResults[exerciseName].find(pr => pr.prType === newPR.prType);
                  if (!existingPR || newPR.currentValue > existingPR.currentValue) {
                    prResults[exerciseName] = prResults[exerciseName].filter(pr => pr.prType !== newPR.prType);
                    prResults[exerciseName].push(newPR);
                  }
                }
              });
              
              celebrationStates[exerciseName] = true;
            }
          } catch (error) {
            console.error(`❌ Error detecting PRs for ${exerciseName}:`, error);
          }
        }
      }

      console.log('✅ PR detection complete:', prResults);
      setDetectedPRs(prResults);
      setShowPRCelebration(celebrationStates);
    };

    if (Object.keys(exercises).length > 0) {
      detectAllPRs();
    }
  }, [exercises, detectPRs]);
  
  const handleDiscard = () => {
    // Fully terminate the workout session
    resetSession();
    
    // Show confirmation toast
    toast({
      title: "Workout discarded",
      description: "Your workout session has been terminated"
    });
    
    // Navigate to main dashboard
    navigate('/');
  };

  const handleComplete = async () => {
    console.log('💾 Saving PRs before workout completion...');
    
    // Save all detected PRs before completing workout
    for (const [exerciseName, prs] of Object.entries(detectedPRs)) {
      if (prs.some(pr => pr.isNewPR)) {
        try {
          await savePRs.mutateAsync({
            exerciseName,
            prResults: prs,
            equipmentType: 'barbell' // Could be made dynamic based on exercise
          });
          console.log(`✅ Saved PRs for ${exerciseName}`);
        } catch (error) {
          console.error(`❌ Error saving PRs for ${exerciseName}:`, error);
        }
      }
    }

    // Show success toast for PRs
    const totalPRs = Object.values(detectedPRs).reduce((total, prs) => 
      total + prs.filter(pr => pr.isNewPR).length, 0
    );

    if (totalPRs > 0) {
      toast({
        title: `🎉 ${totalPRs} New Personal Record${totalPRs > 1 ? 's' : ''}!`,
        description: "Your progress has been recorded"
      });
    } else {
      toast({
        title: "Workout Complete! 💪",
        description: "Great work - keep pushing for those PRs!"
      });
    }

    // Complete the workout
    onComplete();
  };

  const closePRCelebration = (exerciseName: string) => {
    setShowPRCelebration(prev => ({
      ...prev,
      [exerciseName]: false
    }));
  };

  return (
    <div className="mt-8 flex flex-col items-center">
      {/* PR Celebrations */}
      {Object.entries(detectedPRs).map(([exerciseName, prs]) => (
        <PRCelebration
          key={exerciseName}
          prs={prs}
          exerciseName={exerciseName}
          isVisible={showPRCelebration[exerciseName] || false}
          onClose={() => closePRCelebration(exerciseName)}
        />
      ))}

      <div className="flex w-full justify-between gap-3 mb-4">
        <Button
          variant="outline"
          className="w-1/2 py-3 border-gray-700 hover:bg-gray-800"
          onClick={handleDiscard}
        >
          Discard
        </Button>
        
        <Button
          className="w-1/2 py-3 bg-gradient-to-r from-green-600 to-emerald-500 
            hover:from-green-700 hover:to-emerald-600 text-white font-medium 
            rounded-full shadow-lg hover:shadow-xl"
          onClick={handleComplete}
          disabled={savePRs.isPending}
        >
          {savePRs.isPending ? 'Saving PRs...' : 'Complete Workout'}
        </Button>
      </div>
      
      <IntelligentMetricsDisplay 
        exercises={convertedExercises}
        intensity={intensity}
        efficiency={efficiency}
      />
      
      <div className="mt-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800 w-full">
        <ExerciseVolumeChart 
          exercises={convertedExercises} 
          weightUnit={weightUnit}
        />
      </div>
    </div>
  );
};

export default WorkoutCompletionEnhanced;
