import React from 'react';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import AllExercisesPage from "@/pages/AllExercisesPage";
import { Exercise } from "@/types/exercise";

interface AddExerciseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectExercise: (exercise: string | Exercise) => void;
  trainingType?: string;
}

export const AddExerciseSheet: React.FC<AddExerciseSheetProps> = ({
  open,
  onOpenChange,
  onSelectExercise,
  trainingType = "",
}) => {
  const handleAdd = (exercise: Exercise, sourceTab: string) => {
    onSelectExercise(exercise);
    console.log('exercise_add', { id: exercise.id, name: exercise.name, sourceTab });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[80vh] rounded-t-xl border-t border-gray-700 bg-gray-900 p-0"
        data-testid="add-exercise-sheet"
      >
        <AllExercisesPage
          standalone={false}
          onAddExercise={handleAdd}
          trainingType={trainingType}
        />
      </SheetContent>
    </Sheet>
  );
};
