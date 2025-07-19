import { supabase } from "@/integrations/supabase/client";

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise_name: string;
  type: string; // Database returns string, not enum
  value: number;
  unit: string;
  date: string;
  workout_id?: string;
  previous_record?: any; // Database returns Json type
  equipment_type: string;
  notes?: string;
  created_at: string;
}

export interface PRDetectionResult {
  isNewPR: boolean;
  prType: 'weight' | 'reps' | 'volume';
  currentValue: number;
  previousBest?: number;
  improvement?: number;
  improvementPercentage?: number;
}

export interface HistoricalExerciseData {
  exercise_name: string;
  weight: number;
  reps: number;
  created_at: string;
  workout_id: string;
}

export class PersonalRecordsService {
  
  /**
   * Get all historical exercise data for a user and specific exercise
   */
  static async getHistoricalExerciseData(
    userId: string,
    exerciseName: string
  ): Promise<HistoricalExerciseData[]> {
    console.log(`🔍 Getting historical data for user ${userId}, exercise: ${exerciseName}`);
    
    try {
      const { data: exerciseSets, error } = await supabase
        .from('exercise_sets')
        .select(`
          exercise_name,
          weight,
          reps,
          created_at,
          workout_id,
          workout_sessions!inner(user_id)
        `)
        .eq('exercise_name', exerciseName)
        .eq('workout_sessions.user_id', userId)
        .eq('completed', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching historical exercise data:', error);
        return [];
      }

      console.log(`📊 Found ${exerciseSets?.length || 0} historical sets for ${exerciseName}`);
      return exerciseSets || [];
    } catch (error) {
      console.error('Error in getHistoricalExerciseData:', error);
      return [];
    }
  }

  /**
   * Calculate PRs from historical data
   */
  static calculatePRsFromHistory(historicalData: HistoricalExerciseData[]): {
    maxWeight: number;
    maxReps: number;
    maxVolume: number;
  } {
    if (historicalData.length === 0) {
      return { maxWeight: 0, maxReps: 0, maxVolume: 0 };
    }

    const maxWeight = Math.max(...historicalData.map(set => set.weight));
    const maxReps = Math.max(...historicalData.map(set => set.reps));
    
    // Calculate max volume per workout
    const volumesByWorkout: Record<string, number> = {};
    historicalData.forEach(set => {
      const volume = set.weight * set.reps;
      if (!volumesByWorkout[set.workout_id]) {
        volumesByWorkout[set.workout_id] = 0;
      }
      volumesByWorkout[set.workout_id] += volume;
    });
    
    const maxVolume = Math.max(...Object.values(volumesByWorkout));

    console.log(`📈 Historical PRs - Weight: ${maxWeight}, Reps: ${maxReps}, Volume: ${maxVolume}`);
    return { maxWeight, maxReps, maxVolume };
  }

  /**
   * Detect if a new set creates any personal records
   */
  static async detectPersonalRecords(
    userId: string,
    exerciseName: string,
    weight: number,
    reps: number,
    workoutId?: string
  ): Promise<PRDetectionResult[]> {
    console.log(`🎯 PR Detection Started: ${exerciseName}, ${weight}kg × ${reps} reps`);
    
    const results: PRDetectionResult[] = [];
    const volume = weight * reps;

    try {
      // Get all historical data for this exercise
      const historicalData = await this.getHistoricalExerciseData(userId, exerciseName);
      
      if (historicalData.length === 0) {
        console.log(`🆕 First time doing ${exerciseName} - all are PRs!`);
        // First time doing this exercise - everything is a PR
        results.push(
          {
            isNewPR: true,
            prType: 'weight',
            currentValue: weight,
            previousBest: 0,
            improvement: weight,
            improvementPercentage: 100
          },
          {
            isNewPR: true,
            prType: 'reps',
            currentValue: reps,
            previousBest: 0,
            improvement: reps,
            improvementPercentage: 100
          },
          {
            isNewPR: true,
            prType: 'volume',
            currentValue: volume,
            previousBest: 0,
            improvement: volume,
            improvementPercentage: 100
          }
        );
        return results;
      }

      // Calculate current PRs from historical data
      const currentPRs = this.calculatePRsFromHistory(historicalData);

      // Check weight PR
      if (weight > currentPRs.maxWeight) {
        const improvement = weight - currentPRs.maxWeight;
        const improvementPercentage = currentPRs.maxWeight > 0 ? (improvement / currentPRs.maxWeight) * 100 : 100;
        
        console.log(`🏆 NEW WEIGHT PR! ${weight}kg beats previous ${currentPRs.maxWeight}kg`);
        results.push({
          isNewPR: true,
          prType: 'weight',
          currentValue: weight,
          previousBest: currentPRs.maxWeight,
          improvement,
          improvementPercentage
        });
      }

      // Check reps PR (at same or higher weight)
      const maxRepsAtThisWeight = Math.max(
        ...historicalData
          .filter(set => set.weight >= weight)
          .map(set => set.reps),
        0
      );
      
      if (reps > maxRepsAtThisWeight) {
        const improvement = reps - maxRepsAtThisWeight;
        const improvementPercentage = maxRepsAtThisWeight > 0 ? (improvement / maxRepsAtThisWeight) * 100 : 100;
        
        console.log(`🏆 NEW REPS PR! ${reps} reps at ${weight}kg beats previous ${maxRepsAtThisWeight}`);
        results.push({
          isNewPR: true,
          prType: 'reps',
          currentValue: reps,
          previousBest: maxRepsAtThisWeight,
          improvement,
          improvementPercentage
        });
      }

      // Check volume PR (for single set)
      if (volume > currentPRs.maxVolume) {
        const improvement = volume - currentPRs.maxVolume;
        const improvementPercentage = currentPRs.maxVolume > 0 ? (improvement / currentPRs.maxVolume) * 100 : 100;
        
        console.log(`🏆 NEW VOLUME PR! ${volume}kg total beats previous ${currentPRs.maxVolume}kg`);
        results.push({
          isNewPR: true,
          prType: 'volume',
          currentValue: volume,
          previousBest: currentPRs.maxVolume,
          improvement,
          improvementPercentage
        });
      }

      console.log(`✅ PR Detection Complete: Found ${results.length} new PRs`);
      return results;
    } catch (error) {
      console.error('Error detecting personal records:', error);
      return [];
    }
  }

  /**
   * Bootstrap function to populate initial PRs from all existing workout data
   */
  static async bootstrapPersonalRecords(userId: string): Promise<void> {
    console.log(`🚀 Bootstrapping PRs for user ${userId}`);
    
    try {
      // Get all unique exercises for this user
      const { data: exercises, error: exercisesError } = await supabase
        .from('exercise_sets')
        .select(`
          exercise_name,
          workout_sessions!inner(user_id)
        `)
        .eq('workout_sessions.user_id', userId)
        .eq('completed', true);

      if (exercisesError || !exercises) {
        console.error('Error fetching user exercises:', exercisesError);
        return;
      }

      const uniqueExercises = [...new Set(exercises.map(e => e.exercise_name))];
      console.log(`📋 Found ${uniqueExercises.length} unique exercises: ${uniqueExercises.join(', ')}`);

      // For each exercise, calculate and save PRs
      for (const exerciseName of uniqueExercises) {
        const historicalData = await this.getHistoricalExerciseData(userId, exerciseName);
        
        if (historicalData.length === 0) continue;

        const prs = this.calculatePRsFromHistory(historicalData);
        
        // Find the workout/set that achieved each PR
        const weightPRSet = historicalData.find(set => set.weight === prs.maxWeight);
        const repsPRSet = historicalData.reduce((best, current) => 
          current.reps > best.reps ? current : best
        );
        
        // Calculate volume PR set
        const volumesByWorkout: Record<string, { volume: number, date: string }> = {};
        historicalData.forEach(set => {
          const volume = set.weight * set.reps;
          if (!volumesByWorkout[set.workout_id]) {
            volumesByWorkout[set.workout_id] = { volume: 0, date: set.created_at };
          }
          volumesByWorkout[set.workout_id].volume += volume;
        });
        
        const volumePRWorkout = Object.entries(volumesByWorkout)
          .reduce((best, [workoutId, data]) => 
            data.volume > best.volume ? { workoutId, ...data } : best
          , { workoutId: '', volume: 0, date: '' });

        // Save PRs to database - set workout_id to null to avoid foreign key constraint issues
        const prRecords = [
          {
            user_id: userId,
            exercise_id: exerciseName.toLowerCase().replace(/\s+/g, '_'),
            exercise_name: exerciseName,
            type: 'weight',
            value: prs.maxWeight,
            unit: 'kg',
            date: weightPRSet?.created_at || new Date().toISOString(),
            workout_id: null, // Set to null to avoid foreign key constraint violation
            equipment_type: 'barbell',
            previous_record: null
          },
          {
            user_id: userId,
            exercise_id: exerciseName.toLowerCase().replace(/\s+/g, '_'),
            exercise_name: exerciseName,
            type: 'reps',
            value: prs.maxReps,
            unit: 'reps',
            date: repsPRSet?.created_at || new Date().toISOString(),
            workout_id: null, // Set to null to avoid foreign key constraint violation
            equipment_type: 'barbell',
            previous_record: null
          },
          {
            user_id: userId,
            exercise_id: exerciseName.toLowerCase().replace(/\s+/g, '_'),
            exercise_name: exerciseName,
            type: 'volume',
            value: prs.maxVolume,
            unit: 'kg',
            date: volumePRWorkout.date,
            workout_id: null, // Set to null to avoid foreign key constraint violation
            equipment_type: 'barbell',
            previous_record: null
          }
        ];

        // Only save PRs with valid values
        const validPRs = prRecords.filter(pr => pr.value > 0);
        
        if (validPRs.length > 0) {
          const { error: insertError } = await supabase
            .from('personal_records')
            .upsert(validPRs, { 
              onConflict: 'user_id,exercise_name,type',
              ignoreDuplicates: false 
            });

          if (insertError) {
            console.error(`Error saving PRs for ${exerciseName}:`, insertError);
          } else {
            console.log(`✅ Saved ${validPRs.length} PRs for ${exerciseName}`);
          }
        }
      }

      console.log(`🎉 Bootstrap complete! Check your PRs on the Overview page.`);
    } catch (error) {
      console.error('Error in bootstrapPersonalRecords:', error);
    }
  }

  /**
   * Save new personal records to the database using upsert to handle duplicates
   */
  static async savePersonalRecords(
    userId: string,
    exerciseName: string,
    prResults: PRDetectionResult[],
    workoutId?: string,
    equipmentType: string = 'barbell'
  ): Promise<void> {
    for (const pr of prResults.filter(pr => pr.isNewPR)) {
      try {
        const { error } = await supabase
          .from('personal_records')
          .upsert({
            user_id: userId,
            exercise_id: exerciseName.toLowerCase().replace(/\s+/g, '_'),
            exercise_name: exerciseName,
            type: pr.prType,
            value: pr.currentValue,
            unit: pr.prType === 'weight' ? 'kg' : pr.prType === 'reps' ? 'reps' : 'kg',
            date: new Date().toISOString(),
            workout_id: null, // Set to null to avoid foreign key constraint violation
            equipment_type: equipmentType,
            previous_record: pr.previousBest ? {
              value: pr.previousBest,
              date: new Date().toISOString(),
              improvement: pr.improvement || 0
            } : null
          }, {
            onConflict: 'user_id,exercise_name,type',
            ignoreDuplicates: false
          });

        if (error) {
          console.error('Error saving personal record:', error);
          throw error; // Re-throw for proper error handling
        } else {
          console.log(`💾 Saved ${pr.prType} PR: ${pr.currentValue}`);
        }
      } catch (error) {
        console.error('Error in savePersonalRecords:', error);
        // Don't re-throw to prevent page refresh - just log the error
      }
    }
  }

  /**
   * Get personal records for a specific exercise
   */
  static async getExerciseRecords(userId: string, exerciseName: string): Promise<PersonalRecord[]> {
    try {
      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_name', exerciseName)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching exercise records:', error);
      return [];
    }
  }

  /**
   * Get recent personal records across all exercises
   */
  static async getRecentRecords(userId: string, limit: number = 10): Promise<PersonalRecord[]> {
    try {
      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent records:', error);
      return [];
    }
  }
}
