import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Target, 
  Dumbbell, 
  Activity, 
  Info,
  Lightbulb,
  Shuffle,
  Star,
  Heart,
  Plus,
  X
} from 'lucide-react';
import { Exercise } from '@/types/exercise';

interface ExerciseDetailsModalProps {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToWorkout?: (exercise: Exercise) => void;
  onToggleFavorite?: (exercise: Exercise) => void;
  isFavorite?: boolean;
  showActions?: boolean;
}

export function ExerciseDetailsModal({ 
  exercise, 
  open, 
  onOpenChange, 
  onAddToWorkout,
  onToggleFavorite,
  isFavorite = false,
  showActions = true
}: ExerciseDetailsModalProps) {
  if (!exercise) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-success/10 text-success border-success/20';
      case 'intermediate': return 'bg-warning/10 text-warning border-warning/20';
      case 'advanced': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'expert': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getMovementPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'push': return '↗️';
      case 'pull': return '↙️';
      case 'squat': return '🦵';
      case 'hinge': return '🏃';
      case 'lunge': return '🤸';
      case 'rotation': return '🔄';
      case 'carry': return '🎒';
      case 'isometric': return '⏸️';
      default: return '💪';
    }
  };

  const formatMuscleGroups = (groups: string[]) => {
    return groups.map(group => group.charAt(0).toUpperCase() + group.slice(1)).join(', ');
  };

  const formatEquipment = (equipment: string[]) => {
    return equipment.map(item => item.charAt(0).toUpperCase() + item.slice(1)).join(', ');
  };

  const parseInstructions = (instructions: any) => {
    if (typeof instructions === 'string') {
      try {
        return JSON.parse(instructions);
      } catch {
        return {};
      }
    }
    return instructions || {};
  };

  const instructions = parseInstructions(exercise.instructions);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-left">
                {exercise.name}
              </DialogTitle>
              <p className="text-muted-foreground mt-2">
                {exercise.description}
              </p>
            </div>
            {showActions && (
              <div className="flex items-center gap-2 ml-4">
                {onToggleFavorite && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleFavorite(exercise)}
                    className={`p-2 ${isFavorite ? 'text-red-500' : 'text-muted-foreground'}`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                )}
                {onAddToWorkout && (
                  <Button
                    onClick={() => onAddToWorkout(exercise)}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add to Workout
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Target className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Primary Muscles</p>
                <p className="text-sm font-semibold">{formatMuscleGroups(exercise.primary_muscle_groups)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Dumbbell className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Equipment</p>
                <p className="text-sm font-semibold">{formatEquipment(exercise.equipment_type)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <span className="text-xl flex-shrink-0">{getMovementPatternIcon(exercise.movement_pattern)}</span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Movement</p>
                <p className="text-sm font-semibold capitalize">{exercise.movement_pattern}</p>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={getDifficultyColor(exercise.difficulty)}>
              <Star className="h-3 w-3 mr-1" />
              {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
            </Badge>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {exercise.is_compound ? 'Compound Exercise' : 'Isolation Exercise'}
            </Badge>
            {exercise.secondary_muscle_groups && exercise.secondary_muscle_groups.length > 0 && (
              <Badge variant="outline">
                +{exercise.secondary_muscle_groups.length} Secondary Muscles
              </Badge>
            )}
          </div>

          <Separator />

          {/* Secondary Muscles */}
          {exercise.secondary_muscle_groups && exercise.secondary_muscle_groups.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Secondary Muscles Worked
              </h4>
              <p className="text-muted-foreground">
                {formatMuscleGroups(exercise.secondary_muscle_groups)}
              </p>
            </div>
          )}

          {/* Instructions */}
          {instructions && Object.keys(instructions).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Exercise Instructions
              </h4>
              <div className="space-y-3">
                {instructions.setup && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <span className="font-medium text-sm">Setup:</span>
                    <p className="text-sm text-muted-foreground mt-1">{instructions.setup}</p>
                  </div>
                )}
                {instructions.execution && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <span className="font-medium text-sm">Execution:</span>
                    <p className="text-sm text-muted-foreground mt-1">{instructions.execution}</p>
                  </div>
                )}
                {instructions.breathing && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <span className="font-medium text-sm">Breathing:</span>
                    <p className="text-sm text-muted-foreground mt-1">{instructions.breathing}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          {exercise.tips && exercise.tips.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Pro Tips
              </h4>
              <div className="space-y-2">
                {exercise.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <span className="text-primary text-lg flex-shrink-0">💡</span>
                    <p className="text-sm text-muted-foreground">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variations */}
          {exercise.variations && exercise.variations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Shuffle className="h-4 w-4" />
                Exercise Variations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {exercise.variations.map((variation, index) => (
                  <Badge key={index} variant="outline" className="justify-start p-2 h-auto">
                    {variation}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {exercise.metadata && Object.keys(exercise.metadata).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Additional Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {typeof exercise.metadata === 'object' && Object.entries(exercise.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between p-2 rounded bg-muted/30">
                    <span className="font-medium capitalize text-sm">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-sm text-muted-foreground">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}