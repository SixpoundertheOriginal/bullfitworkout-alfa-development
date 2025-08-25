/**
 * Script to apply bodyweight exercise metadata patches
 * 
 * This script normalizes core bodyweight exercises and adds the Hanging Knee Raise
 * to the exercise database via metadata updates.
 */

import { supabase } from '@/integrations/supabase/client';
import exercisesPatch from '@/data/bodyweight-exercises-patch.json';

interface ExerciseMetadata {
  name: string;
  aliases?: string[];
  type: 'reps' | 'hold' | 'time' | 'distance';
  is_bodyweight: boolean;
  bw_multiplier?: number;
  static_posture_factor?: number;
  primary_muscle_groups: string[];
  secondary_muscle_groups?: string[];
  equipment_type: string[];
  movement_pattern: string;
  difficulty: string;
  is_compound: boolean;
  description: string;
}

export async function applyBodyweightMetadataPatch(): Promise<void> {
  console.log('Starting bodyweight metadata patch application...');
  
  try {
    for (const exerciseData of exercisesPatch.exercises) {
      console.log(`Processing ${exerciseData.name}...`);
      
      // Check if exercise already exists
      const { data: existingExercise, error: fetchError } = await supabase
        .from('exercises')
        .select('id, name, metadata')
        .ilike('name', exerciseData.name)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(`Error fetching ${exerciseData.name}:`, fetchError);
        continue;
      }
      
      if (existingExercise) {
        // Update existing exercise with normalized metadata
        const existingMeta = existingExercise.metadata && typeof existingExercise.metadata === 'object' ? existingExercise.metadata : {};
        const updatedMetadata = {
          ...existingMeta,
          ...exerciseData,
          normalized: true,
          updated_at: new Date().toISOString()
        };
        
        const { error: updateError } = await supabase
          .from('exercises')
          .update({
            type: exerciseData.type,
            is_bodyweight: exerciseData.is_bodyweight,
            bw_multiplier: exerciseData.bw_multiplier,
            static_posture_factor: exerciseData.static_posture_factor,
            primary_muscle_groups: exerciseData.primary_muscle_groups,
            secondary_muscle_groups: exerciseData.secondary_muscle_groups || [],
            equipment_type: exerciseData.equipment_type,
            movement_pattern: exerciseData.movement_pattern,
            difficulty: exerciseData.difficulty,
            is_compound: exerciseData.is_compound,
            description: exerciseData.description,
            metadata: updatedMetadata
          })
          .eq('id', existingExercise.id);
        
        if (updateError) {
          console.error(`Error updating ${exerciseData.name}:`, updateError);
        } else {
          console.log(`✅ Updated ${exerciseData.name}`);
        }
      } else {
        // Create new exercise (for Hanging Knee Raise)
        const { error: insertError } = await supabase
          .from('exercises')
          .insert({
            name: exerciseData.name,
            description: exerciseData.description,
            type: exerciseData.type,
            is_bodyweight: exerciseData.is_bodyweight,
            bw_multiplier: exerciseData.bw_multiplier,
            static_posture_factor: exerciseData.static_posture_factor,
            primary_muscle_groups: exerciseData.primary_muscle_groups,
            secondary_muscle_groups: exerciseData.secondary_muscle_groups || [],
            equipment_type: exerciseData.equipment_type,
            movement_pattern: exerciseData.movement_pattern,
            difficulty: exerciseData.difficulty,
            is_compound: exerciseData.is_compound,
            instructions: {},
            tips: [],
            variations: exerciseData.aliases || [],
            metadata: {
              ...exerciseData,
              normalized: true,
              created_at: new Date().toISOString()
            },
            user_id: null // Global exercise
          });
        
        if (insertError) {
          console.error(`Error creating ${exerciseData.name}:`, insertError);
        } else {
          console.log(`✅ Created ${exerciseData.name}`);
        }
      }
    }
    
    console.log('✅ Bodyweight metadata patch application completed successfully!');
    
    // Verify the patch was applied correctly
    await verifyPatchApplication();
    
  } catch (error) {
    console.error('❌ Error applying bodyweight metadata patch:', error);
    throw error;
  }
}

async function verifyPatchApplication(): Promise<void> {
  console.log('\nVerifying patch application...');
  
  const exerciseNames = exercisesPatch.exercises.map(e => e.name);
  
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('name, metadata')
    .in('name', exerciseNames);
  
  if (error) {
    console.error('Error verifying patch:', error);
    return;
  }
  
  if (!exercises || exercises.length === 0) {
    console.warn('⚠️  No exercises found after patch application');
    return;
  }
  
  console.log('\nPatch verification results:');
  exercises.forEach(exercise => {
    const patchData = exercisesPatch.exercises.find(e => e.name === exercise.name);
    if (patchData) {
      console.log(`✅ ${exercise.name}: Successfully processed`);
    }
  });
}

// Export for direct usage
export { exercisesPatch };

// Allow script to be run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  applyBodyweightMetadataPatch()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}