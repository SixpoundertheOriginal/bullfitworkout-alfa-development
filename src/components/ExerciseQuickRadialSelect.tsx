
import React from "react";
import { Exercise } from "@/types/exercise";
import { cn } from "@/lib/utils";
import { Dumbbell } from "lucide-react";
import { typography } from "@/lib/typography";

interface ExerciseQuickRadialSelectProps {
  exercises: Exercise[];
  onSelectExercise: (exercise: string | Exercise) => void;
  className?: string;
}

const CIRCLE_COLORS = [
  "from-purple-500 via-purple-400 to-pink-400",
  "from-blue-500 via-blue-400 to-cyan-400",
  "from-pink-500 via-pink-400 to-orange-400",
  "from-green-500 via-green-400 to-teal-400",
  "from-yellow-400 via-yellow-300 to-orange-300",
  "from-teal-500 via-teal-400 to-cyan-400",
  "from-red-500 via-pink-400 to-purple-400",
  "from-orange-500 via-yellow-400 to-pink-400",
  "from-lime-500 via-green-400 to-blue-400",
  "from-sky-500 via-blue-400 to-indigo-400",
];

export function ExerciseQuickRadialSelect({
  exercises,
  onSelectExercise,
  className
}: ExerciseQuickRadialSelectProps) {
  const count = exercises.length;
  const RADIUS = 104; // Distance from center
  const CENTER = 112; // px center coordinate based on container size (224px)
  const CIRCLE_SIZE = 58;

  return (
    <div className={cn("relative mx-auto my-5", className)} style={{ width: 224, height: 224 }}>
      {exercises.map((exercise, idx) => {
        // Place the first in the center if odd number, else don't.
        let style = {};
        if (count === 1) {
          style = {
            left: CENTER - CIRCLE_SIZE/2,
            top: CENTER - CIRCLE_SIZE/2
          };
        } else {
          const angle = ((idx) * (360 / count) - 90) * (Math.PI / 180);
          const x = Math.cos(angle) * RADIUS + CENTER - CIRCLE_SIZE/2;
          const y = Math.sin(angle) * RADIUS + CENTER - CIRCLE_SIZE/2;
          style = { left: x, top: y };
        }
        return (
          <button
            key={exercise.id}
            className={cn(
              "absolute flex flex-col items-center justify-center rounded-full shadow-lg transition transform hover:scale-110",
              "w-[58px] h-[58px] focus:outline-none border-2 border-white/10",
              "animate-pulse-slow", 
              `bg-gradient-to-br ${CIRCLE_COLORS[idx % CIRCLE_COLORS.length]}`
            )}
            style={style}
            aria-label={exercise.name}
            onClick={() => onSelectExercise(exercise)}
          >
            <Dumbbell className="w-4 h-4 mb-1 text-white drop-shadow" />
            <span className={cn(typography.text.primary, "text-[11px] leading-tight px-1.5 whitespace-nowrap")}>
              {exercise.name}
            </span>
          </button>
        );
      })}
      {/* Center faded dumbbell for design */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
        <Dumbbell size={38} className="text-purple-300"/>
      </div>
    </div>
  );
}
