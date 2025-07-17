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
    <div className="mt-4 pt-3 border-t border-border/30">
      <Button
        onClick={onAddSet}
        className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 
          hover:from-primary/90 hover:to-primary/70
          text-primary-foreground font-medium
          transition-all duration-300 
          transform hover:scale-[1.02] active:scale-[0.98] 
          shadow-md hover:shadow-lg
          group"
      >
        <Plus 
          size={20} 
          className="mr-2 group-hover:rotate-90 transition-transform duration-300" 
        />
        Add Set
      </Button>
    </div>
  );
};