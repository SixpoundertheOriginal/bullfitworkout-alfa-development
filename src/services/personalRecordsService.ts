
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

export class PersonalRecordsService {
  
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
    const results: PRDetectionResult[] = [];
    const volume = weight * reps;

    try {
      // Get existing PRs for this exercise
      const { data: existingPRs } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_name', exerciseName)
        .order('date', { ascending: false });

      const weightPR = existingPRs?.find(pr => pr.type === 'weight');
      const repsPR = existingPRs?.find(pr => pr.type === 'reps');
      const volumePR = existingPRs?.find(pr => pr.type === 'volume');

      // Check weight PR
      if (!weightPR || weight > weightPR.value) {
        results.push({
          isNewPR: true,
          prType: 'weight',
          currentValue: weight,
          previousBest: weightPR?.value,
          improvement: weightPR ? weight - weightPR.value : weight,
          improvementPercentage: weightPR ? ((weight - weightPR.value) / weightPR.value) * 100 : 100
        });
      }

      // Check reps PR (for same or higher weight)
      if (!repsPR || (weight >= (repsPR.previous_record as any)?.weight && reps > repsPR.value)) {
        results.push({
          isNewPR: true,
          prType: 'reps',
          currentValue: reps,
          previousBest: repsPR?.value,
          improvement: repsPR ? reps - repsPR.value : reps,
          improvementPercentage: repsPR ? ((reps - repsPR.value) / repsPR.value) * 100 : 100
        });
      }

      // Check volume PR
      if (!volumePR || volume > volumePR.value) {
        results.push({
          isNewPR: true,
          prType: 'volume',
          currentValue: volume,
          previousBest: volumePR?.value,
          improvement: volumePR ? volume - volumePR.value : volume,
          improvementPercentage: volumePR ? ((volume - volumePR.value) / volumePR.value) * 100 : 100
        });
      }

      return results;
    } catch (error) {
      console.error('Error detecting personal records:', error);
      return [];
    }
  }

  /**
   * Save new personal records to the database
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
          .insert({
            user_id: userId,
            exercise_id: exerciseName.toLowerCase().replace(/\s+/g, '_'),
            exercise_name: exerciseName,
            type: pr.prType,
            value: pr.currentValue,
            unit: pr.prType === 'weight' ? 'kg' : pr.prType === 'reps' ? 'reps' : 'kg',
            date: new Date().toISOString(),
            workout_id: workoutId,
            equipment_type: equipmentType,
            previous_record: pr.previousBest ? {
              value: pr.previousBest,
              date: new Date().toISOString(),
              improvement: pr.improvement || 0
            } : null
          });

        if (error) {
          console.error('Error saving personal record:', error);
        }
      } catch (error) {
        console.error('Error in savePersonalRecords:', error);
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
