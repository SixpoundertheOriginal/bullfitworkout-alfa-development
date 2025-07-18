
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

interface ExerciseActionsProps {
  onAddSet: () => void;
}

export const ExerciseActions: React.FC<ExerciseActionsProps> = ({
  onAddSet
}) => {
  return (
    <div className="mt-4 pt-3 border-t border-gray-800/30">
      <Button
        onClick={onAddSet}
        className="
          w-full h-12 text-base font-medium rounded-xl
          bg-blue-600 hover:bg-blue-700 active:bg-blue-800
          text-white shadow-md hover:shadow-lg
          transition-all duration-200 
          transform hover:scale-[1.02] active:scale-[0.98] 
          flex items-center justify-center gap-2
          group
        "
      >
        <Plus 
          size={20} 
          strokeWidth={2.5}
          className="group-hover:rotate-90 transition-transform duration-300" 
        />
        Add Set
      </Button>
    </div>
  );
};
