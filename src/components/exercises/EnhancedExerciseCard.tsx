import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronDown, 
  ChevronUp, 
  Target, 
  Dumbbell, 
  Activity, 
  Info,
  Lightbulb,
  Shuffle,
  Star,
  Heart,
  Eye,
  TrendingUp,
  Calendar,
  Award,
  Sparkles,
  Settings
} from 'lucide-react';
import { Exercise } from '@/types/exercise';
import { ExerciseVariantSelector } from './ExerciseVariantSelector';
import { AIRecommendationBadge } from './AIRecommendationBadge';
import { useExerciseVariants } from '@/hooks/useExerciseVariants';
import { VariantSelectionData } from '@/types/exercise-variants';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedExerciseCardProps {
  exercise: Exercise;
  onAddToWorkout?: (exercise: Exercise, variantData?: VariantSelectionData) => void;
  onToggleFavorite?: (exercise: Exercise) => void;
  onViewDetails?: (exercise: Exercise) => void;
  isFavorite?: boolean;
  showAddToWorkout?: boolean;
  showVariantSelector?: boolean;
  showAIRecommendations?: boolean;
}

export function EnhancedExerciseCard({ 
  exercise, 
  onAddToWorkout, 
  onToggleFavorite,
  onViewDetails,
  isFavorite = false,
  showAddToWorkout = true,
  showVariantSelector = true,
  showAIRecommendations = true
}: EnhancedExerciseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVariantData, setSelectedVariantData] = useState<VariantSelectionData | null>(null);
  const { variants, recommendations, getProgressionTrend, getLastPerformed, getPersonalBest } = useExerciseVariants(exercise.id);

  const progressionTrend = getProgressionTrend(exercise.id);
  const lastPerformed = getLastPerformed(exercise.id);
  const personalBest = getPersonalBest(exercise.id);

  const handleVariantSelect = (variantData: VariantSelectionData) => {
    setSelectedVariantData(variantData);
  };

  const handleAddToWorkout = () => {
    if (onAddToWorkout) {
      onAddToWorkout(exercise, selectedVariantData || undefined);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <TrendingUp className="w-4 h-4 text-yellow-500 rotate-90" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'advanced': return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      case 'expert': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getMovementPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'push': return '↗️';
      case 'pull': return '↙️';
      case 'squat': return '🦵';
      case 'hinge': return '🏃';
      case 'lunge': return '🤸';
      case 'core': return '🔄';
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
    <Card 
      className="w-full transition-all duration-300 group relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(236,72,153,0.1) 100%),
          linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)
        `,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        filter: 'drop-shadow(0 8px 16px rgba(139, 92, 246, 0.1)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
      }}
    >
      {/* Inner highlight overlay */}
      <div 
        className="absolute inset-0 rounded-lg"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 50%)'
        }}
      />

      {/* Premium glow effect on hover */}
      <div 
        className="absolute inset-0 rounded-lg transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.15) 100%)',
          filter: 'blur(1px)'
        }}
      />

      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle 
              className="text-lg font-semibold transition-colors"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              {exercise.name}
            </CardTitle>
            <p 
              className="text-sm mt-1 line-clamp-2"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              {exercise.description}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFavorite(exercise)}
                className={`p-2 ${isFavorite ? 'text-red-500' : 'text-muted-foreground'}`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            )}
            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(exercise)}
                className="flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {showAddToWorkout && onAddToWorkout && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddToWorkout}
                className="flex items-center gap-1 relative overflow-hidden group/btn"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(236,72,153,0.2) 100%)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  color: 'rgba(255,255,255,0.9)'
                }}
              >
                <Activity className="h-4 w-4" />
                Add
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        {/* Key Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Primary Muscles</p>
              <p className="text-sm font-medium">{formatMuscleGroups(exercise.primary_muscle_groups)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Equipment</p>
              <p className="text-sm font-medium">{formatEquipment(exercise.equipment_type)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-lg">{getMovementPatternIcon(exercise.movement_pattern)}</span>
            <div>
              <p className="text-xs text-muted-foreground">Movement</p>
              <p className="text-sm font-medium capitalize">{exercise.movement_pattern}</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge className={getDifficultyColor(exercise.difficulty)}>
            {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
          </Badge>
          <Badge variant="secondary">
            {exercise.is_compound ? 'Compound' : 'Isolation'}
          </Badge>
          {exercise.secondary_muscle_groups && exercise.secondary_muscle_groups.length > 0 && (
            <Badge variant="outline">
              +{exercise.secondary_muscle_groups.length} Secondary
            </Badge>
          )}
        </div>

        {/* Smart Insights Section */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-muted/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Last: {lastPerformed ? formatDistanceToNow(new Date(lastPerformed), { addSuffix: true }) : 'Never'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(progressionTrend)}
              <span className="text-sm text-muted-foreground capitalize">
                {progressionTrend}
              </span>
            </div>
            {personalBest && (
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  PR: {personalBest.weight}kg × {personalBest.reps}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations */}
        {showAIRecommendations && recommendations.length > 0 && (
          <AIRecommendationBadge recommendations={recommendations} />
        )}

        {/* Expandable Content */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Exercise Variant Selector */}
            {showVariantSelector && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Exercise Variants & Advanced Tracking
                </h4>
                <ExerciseVariantSelector
                  exerciseId={exercise.id}
                  exerciseName={exercise.name}
                  onVariantSelect={handleVariantSelect}
                  className="mb-4"
                />
              </div>
            )}

            {/* Secondary Muscles */}
            {exercise.secondary_muscle_groups && exercise.secondary_muscle_groups.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Secondary Muscles
                </h4>
                <p className="text-sm text-muted-foreground">
                  {formatMuscleGroups(exercise.secondary_muscle_groups)}
                </p>
              </div>
            )}

            {/* Instructions */}
            {instructions && Object.keys(instructions).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Instructions
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {instructions.setup && (
                    <div>
                      <span className="font-medium">Setup:</span> {instructions.setup}
                    </div>
                  )}
                  {instructions.execution && (
                    <div>
                      <span className="font-medium">Execution:</span> {instructions.execution}
                    </div>
                  )}
                  {instructions.breathing && (
                    <div>
                      <span className="font-medium">Breathing:</span> {instructions.breathing}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tips */}
            {exercise.tips && exercise.tips.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Tips
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {exercise.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Variations */}
            {exercise.variations && exercise.variations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Shuffle className="h-4 w-4" />
                  Variations
                </h4>
                <div className="flex flex-wrap gap-2">
                  {exercise.variations.map((variation, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {variation}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Normalized fields */}
            <div>
              <h4 className="text-sm font-medium mb-2">Additional Info</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Type:</span> {exercise.type}
                </div>
                <div>
                  <span className="font-medium">Bodyweight:</span>{' '}
                  {exercise.is_bodyweight ? 'Yes' : 'No'}
                </div>
                {exercise.bw_multiplier != null && (
                  <div>
                    <span className="font-medium">BW Multiplier:</span> {exercise.bw_multiplier}
                  </div>
                )}
                {exercise.static_posture_factor != null && (
                  <div>
                    <span className="font-medium">Static Posture:</span> {exercise.static_posture_factor}
                  </div>
                )}
                {exercise.energy_cost_factor != null && (
                  <div>
                    <span className="font-medium">Energy Cost:</span> {exercise.energy_cost_factor}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show More
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}