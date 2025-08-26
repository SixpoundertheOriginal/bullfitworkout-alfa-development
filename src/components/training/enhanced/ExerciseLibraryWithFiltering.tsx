import { useMemo } from 'react';
import { useWorkoutSetupContext } from '@/context/WorkoutSetupContext';
import { useExercises } from '@/hooks/useExercises';
import { calculateExerciseRelevance } from '@/utils/exerciseRelevance';
import { componentPatterns, typography } from '@/utils/tokenUtils';
import { Target } from 'lucide-react';
import type { Exercise } from '@/types/exercise';

interface ExerciseCardProps {
  exercise: Exercise;
  isRecommended: boolean;
  matchedCriteria?: string[];
}

const ExerciseCard = ({ exercise, isRecommended, matchedCriteria = [] }: ExerciseCardProps) => (
  <div
    className={`${componentPatterns.card.primary()} ${
      isRecommended ? 'ring-2 ring-purple-500/50' : ''
    } transition-all hover:scale-[1.02]`}
  >
    <div className="flex items-center justify-between mb-2">
      <h4 className={typography.headingMd()}>{exercise.name}</h4>
      {isRecommended && (
        <div className="flex items-center gap-1">
          <span className={`${typography.caption()} text-purple-400`}>Recommended</span>
        </div>
      )}
    </div>
    <p className={`${typography.bodyText()} text-zinc-400 mb-2`}>{exercise.description}</p>
    {matchedCriteria.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-3">
        {matchedCriteria.map((c) => (
          <span key={c} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
            {c}
          </span>
        ))}
      </div>
    )}
  </div>
);

const ExerciseLibraryWithFiltering = () => {
  const { state } = useWorkoutSetupContext();
  const { selectedFocus, selectedSubFocus } = state;
  const { exercises } = useExercises();

  const scoredExercises = useMemo(() =>
    exercises
      .map((ex) => calculateExerciseRelevance(ex, selectedFocus?.toString() || '', selectedSubFocus || undefined))
      .sort((a, b) => b.relevanceScore - a.relevanceScore),
    [exercises, selectedFocus, selectedSubFocus]
  );

  const recommended = scoredExercises.filter((e) => e.isRecommended);
  const others = scoredExercises.filter((e) => !e.isRecommended);

  return (
    <div className="space-y-6">
      <div className={componentPatterns.card.secondary()}>
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-purple-500" />
          <span className={typography.caption()}>Showing exercises for {selectedFocus?.toString()}</span>
        </div>
        {selectedSubFocus && (
          <p className={`${typography.caption()} text-zinc-400`}>Sub-focus: {selectedSubFocus}</p>
        )}
      </div>

      {recommended.length > 0 && (
        <section>
          <h3 className={`${typography.sectionHeading()} mb-4`}>Recommended for You</h3>
          <div className="grid gap-3">
            {recommended.map(({ exercise, matchedCriteria }) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                isRecommended
                matchedCriteria={matchedCriteria}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className={`${typography.sectionHeading()} mb-4`}>Other Exercises</h3>
        <div className="grid gap-3">
          {others.map(({ exercise }) => (
            <ExerciseCard key={exercise.id} exercise={exercise} isRecommended={false} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ExerciseLibraryWithFiltering;
