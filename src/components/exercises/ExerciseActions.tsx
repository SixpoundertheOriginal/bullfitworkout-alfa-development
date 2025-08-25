
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
    <div className="relative">
      {/* Neural network connection lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      
      <div className="pt-6">
        <Button
          onClick={onAddSet}
          className="
            relative w-full h-14 text-base font-semibold rounded-2xl overflow-hidden
            bg-gradient-to-r from-primary/90 to-secondary/90 hover:from-primary hover:to-secondary
            text-white shadow-2xl hover:shadow-primary/25
            transition-all duration-500 ease-out
            transform hover:scale-[1.02] active:scale-[0.98] 
            border border-primary/20 hover:border-primary/40
            group
            before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300
            hover:before:opacity-100
          "
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-2 left-4 w-1 h-1 bg-white/60 rounded-full animate-pulse"></div>
            <div className="absolute bottom-3 right-6 w-0.5 h-0.5 bg-white/60 rounded-full animate-pulse delay-300"></div>
            <div className="absolute top-4 right-8 w-0.5 h-0.5 bg-white/60 rounded-full animate-pulse delay-700"></div>
          </div>
          
          <div className="relative z-10 flex items-center justify-center gap-3">
            <div className="relative">
              <Plus 
                size={22} 
                strokeWidth={2.5}
                className="group-hover:rotate-180 transition-transform duration-500 ease-out" 
              />
              <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300 opacity-0 group-hover:opacity-100"></div>
            </div>
            <span className="tracking-wide">Add Set</span>
          </div>
          
          {/* Hover glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 -z-10"></div>
        </Button>
      </div>
    </div>
  );
};
