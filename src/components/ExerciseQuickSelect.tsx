
import React from "react";
import { Exercise } from "@/types/exercise";
import { Dumbbell, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { typography } from "@/lib/typography";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExerciseQuickSelectProps {
  onSelectExercise: (exercise: string | Exercise) => void;
  suggestedExercises?: Exercise[];
  recentExercises?: Exercise[];
  otherExercises?: Exercise[];
  matchData?: Record<string, { score: number; reasons: string[] }>;
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

export function ExerciseQuickSelect({
  onSelectExercise,
  suggestedExercises = [],
  recentExercises = [],
  otherExercises = [],
  matchData = {},
  className
}: ExerciseQuickSelectProps) {
  // Combine all exercises while prioritizing recent and suggested
  const allExercises = [...recentExercises.slice(0, 3)];
  
  // Add suggested exercises not already in the recent list
  suggestedExercises.forEach(exercise => {
    if (!allExercises.some(e => e.id === exercise.id)) {
      allExercises.push(exercise);
    }
  });
  
  // Add other exercises not already included
  otherExercises.forEach(exercise => {
    if (!allExercises.some(e => e.id === exercise.id)) {
      allExercises.push(exercise);
    }
  });
  
  // Limit to 12 exercises total
  const limitedExercises = allExercises.slice(0, 12);
  
  // Split exercises into two rows
  const firstRowExercises = limitedExercises.slice(0, Math.ceil(limitedExercises.length / 2));
  const secondRowExercises = limitedExercises.slice(Math.ceil(limitedExercises.length / 2));

  return (
    <div className={cn("space-y-3", className)}>
      <div className="w-full">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2">
            {firstRowExercises.map((exercise, idx) => (
              <CarouselItem key={exercise.id} className="pl-2 basis-1/3 md:basis-1/4 lg:basis-1/5">
                <ExerciseCircle 
                  exercise={exercise}
                  idx={idx} 
                  onSelectExercise={onSelectExercise}
                  matchData={matchData[exercise.id]}
                  isRecent={recentExercises.some(e => e.id === exercise.id)}
                  isRecommended={suggestedExercises.some(e => e.id === exercise.id)}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 text-white border-white/20 bg-black/30 hover:bg-black/50" />
          <CarouselNext className="right-0 text-white border-white/20 bg-black/30 hover:bg-black/50" />
        </Carousel>
      </div>

      {secondRowExercises.length > 0 && (
        <div className="w-full">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {secondRowExercises.map((exercise, idx) => (
                <CarouselItem key={exercise.id} className="pl-2 basis-1/3 md:basis-1/4 lg:basis-1/5">
                  <ExerciseCircle 
                    exercise={exercise}
                    idx={idx + firstRowExercises.length} 
                    onSelectExercise={onSelectExercise}
                    matchData={matchData[exercise.id]}
                    isRecent={recentExercises.some(e => e.id === exercise.id)}
                    isRecommended={suggestedExercises.some(e => e.id === exercise.id)}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 text-white border-white/20 bg-black/30 hover:bg-black/50" />
            <CarouselNext className="right-0 text-white border-white/20 bg-black/30 hover:bg-black/50" />
          </Carousel>
        </div>
      )}
    </div>
  );
}

interface ExerciseCircleProps {
  exercise: Exercise;
  idx: number;
  onSelectExercise: (exercise: string | Exercise) => void;
  matchData?: { score: number; reasons: string[] };
  isRecent?: boolean;
  isRecommended?: boolean;
}

function ExerciseCircle({ 
  exercise, 
  idx, 
  onSelectExercise, 
  matchData,
  isRecent,
  isRecommended 
}: ExerciseCircleProps) {
  const hasHighScore = matchData && matchData.score > 60;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onSelectExercise(exercise)}
            className={cn(
              "flex flex-col items-center justify-center rounded-full w-16 h-16 mx-auto",
              "border border-white/10 bg-gradient-to-br shadow-md",
              "transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/20",
              hasHighScore ? "ring-2 ring-green-500/50" : "",
              "animate-pulse-slow",
              CIRCLE_COLORS[idx % CIRCLE_COLORS.length]
            )}
            aria-label={exercise.name}
          >
            <Dumbbell className="w-5 h-5 mb-0.5 text-white" />
            <span className={cn(typography.text.primary, "text-xs font-medium text-center px-1 max-w-full truncate")}>
              {exercise.name}
            </span>
            {hasHighScore && (
              <Star size={10} className="absolute top-1 right-1 text-yellow-300 fill-yellow-300" />
            )}
          </button>
        </TooltipTrigger>
        
        {matchData && matchData.reasons.length > 0 && (
          <TooltipContent side="top" className="max-w-xs bg-gray-900 border border-gray-700">
            <div className="text-xs space-y-1">
              <p className="font-semibold text-blue-300">
                {isRecent ? "Recently used" : isRecommended ? "Recommended" : "Exercise"} 
                {matchData.score > 0 ? ` (Score: ${Math.round(matchData.score)})` : ""}
              </p>
              {matchData.reasons.length > 0 && (
                <>
                  <p className="font-medium text-gray-300">Reasons:</p>
                  <ul className="list-disc pl-4 text-gray-300">
                    {matchData.reasons.slice(0, 3).map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
