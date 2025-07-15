import React from 'react';
import { useState, useEffect } from "react";
import { Plus, Dumbbell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Exercise } from "@/types/exercise";
import { useExercises } from "@/hooks/useExercises";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface SmartExerciseFABProps {
  onSelectExercise: (exercise: Exercise) => void;
  trainingType: string;
  tags: string[];
  visible?: boolean;
  className?: string;
}

export const SmartExerciseFAB = ({
  onSelectExercise,
  trainingType,
  tags,
  visible = true,
  className
}: SmartExerciseFABProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<Exercise[]>([]);
  const { exercises } = useExercises();

  useEffect(() => {
    if (!exercises?.length) return;

    const scoreExercise = (exercise: Exercise): number => {
      let score = 0;
      if (trainingType.toLowerCase().includes("strength") && exercise.is_compound) {
        score += 3;
      } else if (
        trainingType.toLowerCase().includes("cardio") &&
        (exercise.primary_muscle_groups.includes("cardio") ||
          exercise.equipment_type.includes("bodyweight"))
      ) {
        score += 3;
      }
      if (tags.some((tag) => tag.toLowerCase() === "push") && exercise.movement_pattern === "push") {
        score += 2;
      } else if (
        tags.some((tag) => tag.toLowerCase() === "pull") &&
        exercise.movement_pattern === "pull"
      ) {
        score += 2;
      }

      const muscleMatches = tags.filter((tag) =>
        exercise.primary_muscle_groups.some((muscle) => muscle.toLowerCase().includes(tag.toLowerCase()))
      );
      score += muscleMatches.length * 2;
      const secondaryMuscleMatches = tags.filter((tag) =>
        exercise.secondary_muscle_groups.some((muscle) => muscle.toLowerCase().includes(tag.toLowerCase()))
      );
      score += secondaryMuscleMatches.length;
      return score;
    };

    const scoredExercises = exercises
      .map((exercise) => ({ exercise, score: scoreExercise(exercise) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const topSuggestions = scoredExercises.slice(0, 5).map((item) => item.exercise);
    setSuggestions(topSuggestions);
  }, [exercises, trainingType, tags]);

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);

    if (!isExpanded && suggestions.length === 0) {
      toast.info("No suggestions available for current training configuration", {
        duration: 2000
      });
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    onSelectExercise(exercise);
    setIsExpanded(false);
    toast.success(`Added ${exercise.name} to your workout`, {
      style: {
        backgroundColor: "rgba(20, 20, 20, 0.9)",
        color: "white",
        border: "1px solid rgba(120, 120, 120, 0.3)"
      }
    });
  };

  return (
    <div
      className={cn(
        "fixed z-50 bottom-12 right-12",
        "transition-all duration-300",
        visible 
          ? "opacity-100 pointer-events-auto" 
          : "opacity-0 pointer-events-none",
        "overflow-visible",
        className
      )}
    >
      <AnimatePresence>
        {isExpanded && (
          <div className="absolute bottom-16 right-0 flex flex-col items-end" style={{zIndex: 100}} aria-label="Exercise Suggestions">
            <motion.button
              initial={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0, transition: { duration: 0.22 } }}
              exit={{ opacity: 0, translateY: 10, transition: { duration: 0.14 } }}
              className={cn(
                "mb-2 flex flex-row items-center px-3 py-1 rounded-xl bg-purple-900/85 border border-purple-700/30 backdrop-blur-sm",
                "shadow-md text-purple-100 text-[12px] gap-2 z-40 max-w-[150px]",
                "transition-all duration-200 hover:scale-105 hover:bg-purple-800/90",
                "cursor-pointer"
              )}
              style={{
                pointerEvents: "auto",
                minWidth: "90px",
                minHeight: "28px"
              }}
              aria-label="Browse All Exercises"
              tabIndex={0}
              onClick={() => setIsExpanded(false)}
            >
              <Search className="h-4 w-4 text-purple-300 mr-0.5" />
              <span className="truncate max-w-[110px]">Browse All</span>
            </motion.button>

            <div className="flex flex-row gap-3 pb-1 scroll-px-2 overflow-x-auto max-w-xs sm:max-w-md"
                 style={{ maxWidth: "calc(100vw - 96px)" }}>
              {suggestions.map((exercise, index) => (
                <motion.button
                  key={exercise.id}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { type: "spring", stiffness: 330, damping: 20, delay: index * 0.05 }
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.5,
                    transition: { duration: 0.12 }
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center bg-gray-900/90 hover:bg-gray-800/95",
                    "border border-purple-700/20 rounded-full shadow-lg shadow-purple-950/15",
                    "cursor-pointer select-none group transition-all duration-200",
                    "backdrop-blur-sm z-30 menu-compact-item",
                  )}
                  style={{
                    pointerEvents: "auto",
                    width: "60px",
                    height: "60px",
                    minWidth: "60px",
                    minHeight: "60px",
                    padding: "2.5px",
                  }}
                  onClick={() => handleSelectExercise(exercise)}
                  tabIndex={0}
                  aria-label={exercise.name}
                >
                  <Dumbbell className="h-4 w-4 text-purple-300 mb-1" />
                  <span
                    className="text-white text-[9px] font-medium w-full text-center item-label menu-item-text"
                    title={exercise.name}
                  >
                    {exercise.name}
                  </span>
                  <div className="flex justify-center w-full mt-0.5">
                    {exercise.primary_muscle_groups.slice(0, 1).map((muscle) => (
                      <Badge
                        key={muscle}
                        variant="outline"
                        className="text-[7px] px-1 py-0 h-3 bg-purple-900/45 border-purple-500/30"
                      >
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      <Button
        variant="gradient"
        size="icon-lg"
        shape="pill"
        onClick={handleToggleExpand}
        className={cn(
          "transform transition-all duration-300 ease-in-out",
          "bg-gradient-to-r from-purple-600 to-pink-500",
          "hover:from-purple-700 hover:to-pink-600",
          "shadow-lg hover:shadow-purple-500/25",
          "border border-purple-500/20",
          isExpanded ? "rotate-45" : "",
          "active:scale-95"
        )}
        aria-label={isExpanded ? "Close Suggestions" : "Show Exercise Suggestions"}
      >
        <Plus size={24} />
      </Button>

      <style>
        {`
          .menu-item-text, .item-label {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 54px;
            font-size: 9px;
          }
          .menu-compact-item {
            min-width: 0;
            min-height: 0;
          }
        `}
      </style>
    </div>
  );
};
