import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useFeatureFlags } from '@/constants/featureFlags';
import { useBodyweightKg } from '@/providers/ProfileProvider';
import {
  isBodyweight,
  effectiveLoadPerRepKg,
  isometricLoadKg,
  formatLoadKg,
  isUsingDefaultBodyweight
} from '@/utils/load';
import { componentPatterns, typography, effects } from '@/utils/tokenUtils';
import { designTokens } from '@/designTokens';

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
  
  // Feature flags and bodyweight calculations
  const { ANALYTICS_DERIVED_KPIS_ENABLED: bwLoadsEnabled } = useFeatureFlags();
  const bodyweightKg = useBodyweightKg();
  const isDefaultBw = isUsingDefaultBodyweight(bodyweightKg);
  
  // Calculate load estimates for bodyweight exercises
  const effectiveLoad = effectiveLoadPerRepKg(exercise, bodyweightKg);
  const isometricLoad = isometricLoadKg(exercise, bodyweightKg);
  const showLoadBadge = bwLoadsEnabled && isBodyweight(exercise) && (effectiveLoad !== null || isometricLoad !== null);

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

  const difficultyBadgeColors: Record<string, string> = {
    beginner: `bg-[${designTokens.colors.semantic.success}]/10 text-[${designTokens.colors.semantic.success}] border-[${designTokens.colors.semantic.success}]/20`,
    intermediate: `bg-[${designTokens.colors.semantic.info}]/10 text-[${designTokens.colors.semantic.info}] border-[${designTokens.colors.semantic.info}]/20`,
    advanced: `bg-[${designTokens.colors.semantic.warning}]/10 text-[${designTokens.colors.semantic.warning}] border-[${designTokens.colors.semantic.warning}]/20`,
    expert: `bg-[${designTokens.colors.semantic.error}]/10 text-[${designTokens.colors.semantic.error}] border-[${designTokens.colors.semantic.error}]/20`,
    default: 'bg-gray-500/10 text-gray-700 border-gray-500/20'
  };

  const getDifficultyColor = (difficulty: string) =>
    difficultyBadgeColors[difficulty] || difficultyBadgeColors.default;

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
      className={`${componentPatterns.cards.metric()} w-full after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-br after:from-purple-600/15 after:to-pink-500/15 after:opacity-0 group-hover:after:opacity-100 after:transition-opacity after:duration-300 after:blur-sm group-hover:${effects.glow.purple()}`}
    >
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className={typography.cardTitle()}>
              {exercise.name}
            </CardTitle>
            <p className={`${typography.cardSubtitle()} mt-1 line-clamp-2`}>
              {exercise.description}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {onToggleFavorite && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleFavorite(exercise)}
                className={`${componentPatterns.button.ghost()} h-8 w-8 p-2 ${isFavorite ? 'text-red-500' : 'text-muted-foreground'} hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            )}
            {onViewDetails && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewDetails(exercise)}
                className={`${componentPatterns.button.ghost()} h-8 w-8 p-2 hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {showAddToWorkout && onAddToWorkout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddToWorkout}
                className={`${componentPatterns.button.primary()} h-8 text-xs px-3 flex items-center gap-1 active:${designTokens.animations.press.scale}`}
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
                <p className={typography.caption()}>Primary Muscles</p>
                <p className={typography.cardSubtitle()}>
                  {formatMuscleGroups(exercise.primary_muscle_groups)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <div>
                <p className={typography.caption()}>Equipment</p>
                <p className={typography.cardSubtitle()}>
                  {formatEquipment(exercise.equipment_type)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-lg">{getMovementPatternIcon(exercise.movement_pattern)}</span>
              <div>
                <p className={typography.caption()}>Movement</p>
                <p className={`${typography.cardSubtitle()} capitalize`}>
                  {exercise.movement_pattern}
                </p>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={`${getDifficultyColor(exercise.difficulty)} ${typography.caption()}`}>
              {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
            </Badge>
            <Badge variant="secondary" className={typography.caption()}>
              {exercise.is_compound ? 'Compound' : 'Isolation'}
            </Badge>
            {exercise.secondary_muscle_groups && exercise.secondary_muscle_groups.length > 0 && (
              <Badge variant="outline" className={typography.caption()}>
                +
                <span className={`${typography.metricNumber()} text-xs`}>
                  {exercise.secondary_muscle_groups.length}
                </span>{' '}
                Secondary
              </Badge>
            )}
          
          {/* Bodyweight Load Estimation Badge (Feature Flagged) */}
            {showLoadBadge && effectiveLoad !== null && exercise.type === 'reps' && (
              <Badge
                variant="outline"
                className={`bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-200 border-emerald-500/30 shadow-lg ${typography.caption()}`}
                aria-label={`Estimated load per rep: ${formatLoadKg(effectiveLoad)} kg using ${isDefaultBw ? 'default' : 'profile'} bodyweight`}
              >
                <Activity className="w-3 h-3 mr-1" />
                Est. Load @
                <span className={`${typography.metricNumber()} text-xs ml-1`}>
                  {formatLoadKg(bodyweightKg)}
                </span>
                kg{isDefaultBw ? ' (default)' : ''}: ≈
                <span className={`${typography.metricNumber()} text-xs ml-1`}>
                  {formatLoadKg(effectiveLoad)}
                </span>
                kg
              </Badge>
            )}
          
          {/* Isometric Load Badge */}
            {showLoadBadge && isometricLoad !== null && ['hold', 'time'].includes(exercise.type) && (
              <Badge
                variant="outline"
                className={`bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-200 border-amber-500/30 shadow-lg ${typography.caption()}`}
                aria-label={`Isometric load: ${formatLoadKg(isometricLoad)} kg using ${isDefaultBw ? 'default' : 'profile'} bodyweight`}
              >
                <Target className="w-3 h-3 mr-1" />
                Isometric load:
                <span className={`${typography.metricNumber()} text-xs ml-1`}>
                  {formatLoadKg(isometricLoad)}
                </span>
                kg{isDefaultBw ? ' (default)' : ''}
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
          className={`${componentPatterns.button.ghost()} w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`}
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