import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, Clock, Target } from 'lucide-react';
import { Exercise } from '@/types/exercise';
import { EnhancedExerciseCard } from './EnhancedExerciseCard';

interface SmartRecommendationsProps {
  exercises: Exercise[];
  recentExercises: Exercise[];
  favoriteExercises: Exercise[];
  onSelectExercise?: (exercise: Exercise) => void;
  onToggleFavorite?: (exercise: Exercise) => void;
  isFavorite?: (exerciseId: string) => boolean;
}

export function SmartRecommendations({
  exercises,
  recentExercises,
  favoriteExercises,
  onSelectExercise,
  onToggleFavorite,
  isFavorite
}: SmartRecommendationsProps) {
  
  // Smart recommendation algorithm
  const getSmartRecommendations = () => {
    const recommendations: { exercise: Exercise; reason: string; category: string }[] = [];
    
    // Get muscle groups from recent workouts
    const recentMuscleGroups = new Set<string>();
    recentExercises.forEach(exercise => {
      exercise.primary_muscle_groups.forEach(muscle => recentMuscleGroups.add(muscle));
      exercise.secondary_muscle_groups?.forEach(muscle => recentMuscleGroups.add(muscle));
    });

    // 1. Complementary exercises - recommend exercises that work muscles not recently trained
    const allMuscleGroups = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'];
    const underworkedMuscles = allMuscleGroups.filter(muscle => !recentMuscleGroups.has(muscle));
    
    underworkedMuscles.forEach(muscle => {
      const complementaryExercise = exercises.find(ex => 
        ex.primary_muscle_groups.includes(muscle as any) && 
        !recentExercises.some(recent => recent.id === ex.id)
      );
      
      if (complementaryExercise) {
        recommendations.push({
          exercise: complementaryExercise,
          reason: `Target ${muscle} muscles`,
          category: 'balance'
        });
      }
    });

    // 2. Progressive difficulty - suggest slightly harder exercises
    const recentDifficultyLevels = recentExercises.map(ex => ex.difficulty);
    const shouldProgressTo = recentDifficultyLevels.includes('beginner') ? 'intermediate' : 
                            recentDifficultyLevels.includes('intermediate') ? 'advanced' : null;
    
    if (shouldProgressTo) {
      const progressionExercise = exercises.find(ex => 
        ex.difficulty === shouldProgressTo &&
        recentMuscleGroups.has(ex.primary_muscle_groups[0]) &&
        !recentExercises.some(recent => recent.id === ex.id)
      );
      
      if (progressionExercise) {
        recommendations.push({
          exercise: progressionExercise,
          reason: `Progress to ${shouldProgressTo}`,
          category: 'progression'
        });
      }
    }

    // 3. Equipment variety - suggest exercises with different equipment
    const recentEquipment = new Set<string>();
    recentExercises.forEach(exercise => {
      exercise.equipment_type.forEach(eq => recentEquipment.add(eq));
    });

    const varietyExercise = exercises.find(ex => 
      ex.equipment_type.some(eq => !recentEquipment.has(eq)) &&
      recentMuscleGroups.has(ex.primary_muscle_groups[0]) &&
      !recentExercises.some(recent => recent.id === ex.id)
    );

    if (varietyExercise) {
      recommendations.push({
        exercise: varietyExercise,
        reason: 'Try new equipment',
        category: 'variety'
      });
    }

    // 4. Compound movement recommendations
    const hasCompoundMovements = recentExercises.some(ex => ex.is_compound);
    if (!hasCompoundMovements) {
      const compoundExercise = exercises.find(ex => 
        ex.is_compound && 
        !recentExercises.some(recent => recent.id === ex.id)
      );
      
      if (compoundExercise) {
        recommendations.push({
          exercise: compoundExercise,
          reason: 'Add compound movement',
          category: 'efficiency'
        });
      }
    }

    // Remove duplicates and limit to 6 recommendations
    const uniqueRecommendations = recommendations.filter((rec, index, self) => 
      index === self.findIndex(r => r.exercise.id === rec.exercise.id)
    );

    return uniqueRecommendations.slice(0, 6);
  };

  const recommendations = getSmartRecommendations();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'balance': return <Target className="h-4 w-4" />;
      case 'progression': return <TrendingUp className="h-4 w-4" />;
      case 'variety': return <Clock className="h-4 w-4" />;
      case 'efficiency': return <Lightbulb className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'balance': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'progression': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'variety': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'efficiency': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  if (recommendations.length === 0) {
    return (
      <Card 
        className="relative overflow-hidden"
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
        <CardHeader className="relative z-10">
          <CardTitle 
            className="flex items-center gap-2"
            style={{ color: 'rgba(255,255,255,0.9)' }}
          >
            <Lightbulb className="h-5 w-5" style={{ color: 'rgba(139,92,246,0.8)' }} />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <p 
            className="text-center py-4"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Complete a few workouts to get personalized exercise recommendations!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5" style={{ color: 'rgba(139,92,246,0.8)' }} />
        <h3 
          className="text-lg font-semibold"
          style={{ color: 'rgba(255,255,255,0.9)' }}
        >
          Smart Recommendations
        </h3>
        <Badge 
          variant="secondary" 
          className="text-xs relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(236,72,153,0.2) 100%)',
            border: '1px solid rgba(139,92,246,0.3)',
            color: 'rgba(255,255,255,0.9)'
          }}
        >
          AI Powered
        </Badge>
      </div>
      
      <div className="space-y-4">
        {recommendations.map(({ exercise, reason, category }) => (
          <div key={exercise.id} className="relative">
            <div className="absolute -top-2 -right-2 z-10">
              <Badge 
                className={`text-xs px-2 py-1 flex items-center gap-1 relative overflow-hidden`}
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.8) 0%, rgba(236,72,153,0.8) 100%)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {getCategoryIcon(category)}
                {reason}
              </Badge>
            </div>
            <EnhancedExerciseCard
              exercise={exercise}
              onAddToWorkout={onSelectExercise}
              onToggleFavorite={onToggleFavorite}
              isFavorite={isFavorite ? isFavorite(exercise.id) : false}
              showAddToWorkout={!!onSelectExercise}
            />
          </div>
        ))}
      </div>
    </div>
  );
}