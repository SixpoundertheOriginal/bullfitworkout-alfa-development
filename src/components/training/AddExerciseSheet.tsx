
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Exercise } from "@/types/exercise";
import { useExerciseSuggestions } from "@/hooks/useExerciseSuggestions";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { useExercises } from "@/hooks/useExercises";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import AllExercisesPage from "@/pages/AllExercisesPage";

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
  trainingType = ""
}) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<string>("suggested");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { suggestedExercises } = useExerciseSuggestions(trainingType);
  const { workouts } = useWorkoutHistory();
  const { exercises: allExercises } = useExercises();
  const [showAllExercises, setShowAllExercises] = useState(false);

  // Extract recently used exercises from workout history
  const recentExercises = React.useMemo(() => {
    if (!workouts?.length) return [];
    
    const exerciseMap = new Map<string, Exercise>();
    
    // Get unique exercise names from recent workouts
    workouts.slice(0, 8).forEach(workout => {
      const exerciseNames = new Set<string>();
      
      workout.exerciseSets?.forEach(set => {
        exerciseNames.add(set.exercise_name);
      });
      
      exerciseNames.forEach(name => {
        const exercise = allExercises.find(e => e.name === name);
        if (exercise && !exerciseMap.has(exercise.id)) {
          exerciseMap.set(exercise.id, exercise);
        }
      });
    });
    
    return Array.from(exerciseMap.values());
  }, [workouts, allExercises]);

  // Filter exercises based on search query
  const filteredSuggested = React.useMemo(() => {
    return searchQuery
      ? suggestedExercises.filter(e => 
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.primary_muscle_groups.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : suggestedExercises;
  }, [suggestedExercises, searchQuery]);

  const filteredRecent = React.useMemo(() => {
    return searchQuery
      ? recentExercises.filter(e => 
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.primary_muscle_groups.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : recentExercises;
  }, [recentExercises, searchQuery]);

  const handleAddExercise = (exercise: Exercise | string) => {
    const exerciseName = typeof exercise === 'string' ? exercise : exercise.name;
    
    // Pass the full Exercise object to get enhanced display
    onSelectExercise(exercise);
    
    // Close the sheet immediately after selecting an exercise
    onOpenChange(false);
    
    // Enhanced success message
    const displayName = typeof exercise === 'string' 
      ? exercise 
      : exercise.primary_muscle_groups?.length > 0 
        ? `${exercise.name} • ${exercise.primary_muscle_groups[0]}`
        : exercise.name;
    
    toast({
      title: "Exercise added",
      description: `Added ${displayName} to your workout`
    });
  };

  const renderExerciseCard = (exercise: Exercise) => {
    const muscleGroups = exercise.primary_muscle_groups.slice(0, 2).join(', ');
    const hasVariants = exercise.variations?.length > 0;
    
    return (
      <div key={exercise.id} className="flex items-center justify-between p-3 mb-2 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-800/70 transition-colors">
        <div className="flex flex-col flex-1 mr-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white">{exercise.name}</span>
            {hasVariants && (
              <Badge variant="secondary" className="text-xs bg-purple-900/30 text-purple-300 border-purple-500/30">
                Enhanced
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="text-sm text-gray-400">{muscleGroups}</span>
            {exercise.equipment_type?.[0] && (
              <Badge variant="outline" className="text-xs bg-blue-900/30 text-blue-300 border-blue-500/30">
                {exercise.equipment_type[0]}
              </Badge>
            )}
          </div>
        </div>
        <Button
          onClick={() => handleAddExercise(exercise)}
          size="sm"
          variant="outline"
          className="h-9 px-3 rounded-full bg-purple-900/30 border-purple-500/30 hover:bg-purple-800/50"
        >
          <Plus size={16} className="mr-1" />
          Add
        </Button>
      </div>
    );
  };

  if (showAllExercises) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[90vh] rounded-t-xl border-t border-gray-700 bg-gray-900 p-0"
        >
          <AllExercisesPage 
            onSelectExercise={handleAddExercise}
            standalone={false}
            onBack={() => setShowAllExercises(false)}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[80vh] rounded-t-xl border-t border-gray-700 bg-gray-900 p-0"
      >
        <div className="flex flex-col h-full">
          {/* Handle for dragging */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-12 h-1.5 bg-gray-700 rounded-full"></div>
          </div>
          
          <div className="px-4 pb-2 h-full flex flex-col">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-xl font-bold text-center">Add an Exercise</SheetTitle>
            </SheetHeader>
            
            {/* Search bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search exercises..."
                className="pl-9 bg-gray-800 border-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Tabs */}
            <Tabs defaultValue="suggested" className="w-full flex-1 flex flex-col" onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="suggested">Suggested</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="browse" onClick={() => setShowAllExercises(true)}>Browse All</TabsTrigger>
              </TabsList>
              
              <TabsContent value="suggested" className="mt-0 flex-1 overflow-auto">
                <div className="overflow-y-auto max-h-[calc(80vh-170px)]">
                  {filteredSuggested.length > 0 ? (
                    filteredSuggested.map(renderExerciseCard)
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      No suggested exercises found
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="recent" className="mt-0 flex-1 overflow-auto">
                <div className="overflow-y-auto max-h-[calc(80vh-170px)]">
                  {filteredRecent.length > 0 ? (
                    filteredRecent.map(renderExerciseCard)
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      No recent exercises found
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
