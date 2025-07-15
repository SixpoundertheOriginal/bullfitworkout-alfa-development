
import React from 'react';
import { TrainingTypeTag } from "@/components/TrainingTypeTag";
import { TrainingTypeObj } from "@/constants/trainingTypes";

interface WorkoutHeaderProps {
  trainingType: TrainingTypeObj | undefined;
}

export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({ trainingType }) => {
  if (!trainingType) return null;

  return (
    <div className="px-4 py-2 mb-2">
      <TrainingTypeTag type={trainingType.name as any} className="mb-2" />
    </div>
  );
};
