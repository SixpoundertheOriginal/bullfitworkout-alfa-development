// src/components/training/WorkoutSessionFooter.tsx

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface WorkoutSessionFooterProps {
  onAddExercise: () => void;
  onFinishWorkout: () => void;
  hasExercises: boolean;
  isSaving: boolean;
}

export const WorkoutSessionFooter: React.FC<WorkoutSessionFooterProps> = ({
  onAddExercise,
  onFinishWorkout,
  hasExercises,
  isSaving
}) => {
  return (
    <div
      className="
        sticky bottom-0 left-0 right-0 z-40
        px-4 py-3
        bg-black/80 backdrop-blur-sm
        safe-bottom
      "
    >
      <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto">
        <Button
          onClick={onAddExercise}
          className="
            w-full py-3 flex items-center justify-center gap-2
            bg-gradient-to-r from-indigo-600 to-purple-600
            hover:from-indigo-700 hover:to-purple-700
            text-white font-semibold rounded-full
            shadow-lg hover:shadow-xl transition-all duration-200
          "
        >
          <Plus size={20} />
          Add Exercise
        </Button>

        {hasExercises && (
          <Button
            onClick={onFinishWorkout}
            disabled={isSaving}
            className="
              w-full py-3 flex items-center justify-center gap-2
              bg-gradient-to-r from-purple-600 to-pink-500
              hover:from-purple-700 hover:to-pink-600
              text-white font-semibold rounded-full
              shadow-lg hover:shadow-xl transition-all duration-200
              animate-fade-in
            "
          >
            {isSaving ? "Saving..." : "Finish Workout"}
          </Button>
        )}
      </div>
    </div>
  );
};
