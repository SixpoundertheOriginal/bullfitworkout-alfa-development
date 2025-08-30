// Exercise Data Validation Service - Ensures data integrity before analytics
import { supabase } from '@/integrations/supabase/client';

export interface ValidationIssue {
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  category: string;
  count: number;
  details: any;
  impact: 'ANALYTICS_CORRUPTION' | 'DATA_LOSS' | 'FILTERING_ISSUES' | 'PERFORMANCE';
}

export interface ValidationReport {
  isValid: boolean;
  issues: ValidationIssue[];
  timestamp: Date;
  canProceedWithAnalytics: boolean;
}

export interface DuplicateName {
  name: string;
  occurrence_count: number;
  affected_ids: string[];
}

export interface OrphanedReferences {
  orphaned_workout_exercises: number;
  orphaned_sets: number;
  missing_exercise_ids: string[];
}

export class ExerciseDataValidator {
  /**
   * Validates data integrity across the exercise library
   * CRITICAL: This must return canProceedWithAnalytics: true before analytics implementation
   */
  async validateDataIntegrity(): Promise<ValidationReport> {
    const issues: ValidationIssue[] = [];
    
    try {
      // Check for duplicate exercise names
      const duplicateNames = await this.checkDuplicateNames();
      if (duplicateNames.length > 0) {
        issues.push({
          type: 'CRITICAL',
          category: 'DUPLICATE_NAMES',
          count: duplicateNames.length,
          details: duplicateNames,
          impact: 'ANALYTICS_CORRUPTION'
        });
      }
      
      // Check for orphaned exercise references
      const orphanedRefs = await this.checkOrphanedReferences();
      if (orphanedRefs.total > 0) {
        issues.push({
          type: 'CRITICAL',
          category: 'ORPHANED_REFERENCES',
          count: orphanedRefs.total,
          details: orphanedRefs,
          impact: 'DATA_LOSS'
        });
      }
      
      // Check for nullable critical fields
      const nullableFields = await this.checkNullableCriticalFields();
      if (nullableFields.length > 0) {
        issues.push({
          type: 'CRITICAL',
          category: 'NULLABLE_CRITICAL_FIELDS',
          count: nullableFields.length,
          details: nullableFields,
          impact: 'ANALYTICS_CORRUPTION'
        });
      }
      
      // Check for inconsistent muscle group values
      const invalidMuscleGroups = await this.checkInvalidMuscleGroups();
      if (invalidMuscleGroups.length > 0) {
        issues.push({
          type: 'WARNING',
          category: 'INVALID_MUSCLE_GROUPS',
          count: invalidMuscleGroups.length,
          details: invalidMuscleGroups,
          impact: 'FILTERING_ISSUES'
        });
      }
      
      const criticalIssues = issues.filter(i => i.type === 'CRITICAL');
      const analyticsBlockers = issues.filter(i => i.impact === 'ANALYTICS_CORRUPTION' || i.impact === 'DATA_LOSS');
      
      return {
        isValid: criticalIssues.length === 0,
        issues,
        timestamp: new Date(),
        canProceedWithAnalytics: analyticsBlockers.length === 0
      };
      
    } catch (error) {
      console.error('Error validating data integrity:', error);
      return {
        isValid: false,
        issues: [{
          type: 'CRITICAL',
          category: 'VALIDATION_ERROR',
          count: 1,
          details: { error: error.message },
          impact: 'ANALYTICS_CORRUPTION'
        }],
        timestamp: new Date(),
        canProceedWithAnalytics: false
      };
    }
  }
  
  private async checkDuplicateNames(): Promise<DuplicateName[]> {
    try {
      const { data, error } = await supabase.rpc('get_exercise_integrity_audit');
      
      if (error) {
        console.error('Error checking duplicate names:', error);
        return [];
      }
      
      return (data || [])
        .filter((item: any) => item.issue_type === 'duplicate_names')
        .map((item: any) => ({
          name: item.name,
          occurrence_count: item.occurrence_count,
          affected_ids: item.affected_ids || []
        }));
    } catch (error) {
      console.error('Error in checkDuplicateNames:', error);
      return [];
    }
  }
  
  private async checkOrphanedReferences(): Promise<{ total: number; details: any }> {
    try {
      const { data, error } = await supabase.rpc('get_orphaned_exercise_references');
      
      if (error) {
        console.error('Error checking orphaned references:', error);
        return { total: 0, details: [] };
      }
      
      const orphanedSets = (data || [])
        .filter((item: any) => item.issue_type === 'orphaned_exercise_sets')
        .reduce((sum: number, item: any) => sum + item.occurrence_count, 0);
      
      return {
        total: orphanedSets,
        details: data || []
      };
    } catch (error) {
      console.error('Error in checkOrphanedReferences:', error);
      return { total: 0, details: [] };
    }
  }
  
  private async checkNullableCriticalFields(): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_exercise_integrity_audit');
      
      if (error) {
        console.error('Error checking nullable fields:', error);
        return [];
      }
      
      return (data || [])
        .filter((item: any) => 
          item.issue_type === 'nullable_is_custom' || 
          item.issue_type === 'nullable_created_by'
        );
    } catch (error) {
      console.error('Error in checkNullableCriticalFields:', error);
      return [];
    }
  }
  
  private async checkInvalidMuscleGroups(): Promise<any[]> {
    try {
      // Check for inconsistent casing and invalid values in muscle groups
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, primary_muscle_groups, secondary_muscle_groups')
        .limit(1000); // Limit for performance
      
      if (error) {
        console.error('Error checking muscle groups:', error);
        return [];
      }
      
      const validMuscleGroups = [
        'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
        'quadriceps', 'hamstrings', 'glutes', 'calves', 'core', 'full_body'
      ];
      
      const invalidExercises = (data || []).filter(exercise => {
        const primaryInvalid = exercise.primary_muscle_groups?.some((mg: string) => 
          !validMuscleGroups.includes(mg.toLowerCase())
        );
        const secondaryInvalid = exercise.secondary_muscle_groups?.some((mg: string) => 
          !validMuscleGroups.includes(mg.toLowerCase())
        );
        return primaryInvalid || secondaryInvalid;
      });
      
      return invalidExercises;
    } catch (error) {
      console.error('Error in checkInvalidMuscleGroups:', error);
      return [];
    }
  }
  
  /**
   * Performs a quick health check on exercise data
   */
  async quickHealthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      const { data: duplicates } = await supabase.rpc('get_exercise_integrity_audit');
      const hasDuplicates = (duplicates || []).some((item: any) => item.issue_type === 'duplicate_names');
      
      if (hasDuplicates) {
        return {
          healthy: false,
          message: 'Exercise library has duplicate names that will corrupt analytics'
        };
      }
      
      return {
        healthy: true,
        message: 'Exercise library data integrity looks good'
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${error.message}`
      };
    }
  }
}