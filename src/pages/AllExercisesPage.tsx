
import React, { useState, useEffect } from "react";
import { useExercises } from "@/hooks/useExercises";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, X, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExerciseDialog } from "@/components/ExerciseDialog";
import { MuscleGroup, EquipmentType, MovementPattern, Difficulty, Exercise } from "@/types/exercise";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ExerciseFAB } from "@/components/ExerciseFAB";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/navigation/PageHeader";
import { COMMON_MUSCLE_GROUPS, COMMON_EQUIPMENT, MOVEMENT_PATTERNS, DIFFICULTY_LEVELS } from "@/types/exercise";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { CommonExerciseCard } from "@/components/exercises/CommonExerciseCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface AllExercisesPageProps {
  onSelectExercise?: (exercise: string | Exercise) => void;
  standalone?: boolean;
  onBack?: () => void;
}

export default function AllExercisesPage({ onSelectExercise, standalone = true, onBack }: AllExercisesPageProps) {
  const { exercises, isLoading, isError, createExercise, isPending } = useExercises();
  const { workouts } = useWorkoutHistory();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<string>("suggested");
  
  // For delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | "all">("all");
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | "all">("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "all">("all");
  const [selectedMovement, setSelectedMovement] = useState<MovementPattern | "all">("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const exercisesPerPage = 8;

  // For add/edit
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [exerciseToEdit, setExerciseToEdit] = useState<any | null>(null);

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
        const exercise = exercises.find(e => e.name === name);
        if (exercise && !exerciseMap.has(exercise.id)) {
          exerciseMap.set(exercise.id, exercise);
        }
      });
    });
    
    return Array.from(exerciseMap.values());
  }, [workouts, exercises]);

  // Filter exercises based on search query and filters
  const filterExercises = (exercisesList: Exercise[]) => {
    return exercisesList.filter(exercise => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Muscle group filter
      const matchesMuscleGroup = selectedMuscleGroup === "all" || 
        exercise.primary_muscle_groups.includes(selectedMuscleGroup as MuscleGroup) ||
        (exercise.secondary_muscle_groups && exercise.secondary_muscle_groups.includes(selectedMuscleGroup as MuscleGroup));

      // Equipment filter
      const matchesEquipment = selectedEquipment === "all" || 
        exercise.equipment_type.includes(selectedEquipment as EquipmentType);

      // Difficulty filter
      const matchesDifficulty = selectedDifficulty === "all" || 
        exercise.difficulty === selectedDifficulty;

      // Movement pattern filter
      const matchesMovement = selectedMovement === "all" || 
        exercise.movement_pattern === selectedMovement;

      return matchesSearch && matchesMuscleGroup && matchesEquipment && 
            matchesDifficulty && matchesMovement;
    });
  };

  const suggestedExercises = filterExercises(exercises.slice(0, 20)); // Limit suggested to top 20 for better performance
  const filteredRecent = filterExercises(recentExercises);
  const filteredAll = filterExercises(exercises);

  // Pagination logic
  const indexOfLastExercise = currentPage * exercisesPerPage;
  const indexOfFirstExercise = indexOfLastExercise - exercisesPerPage;
  const currentExercises = filteredAll.slice(indexOfFirstExercise, indexOfLastExercise);
  const totalPages = Math.ceil(filteredAll.length / exercisesPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedMuscleGroup, selectedEquipment, selectedDifficulty, selectedMovement]);

  const handleAdd = () => {
    setExerciseToEdit(null);
    setDialogMode("add");
    setShowDialog(true);
  };

  const handleEdit = (exercise: Exercise) => {
    setExerciseToEdit(exercise);
    setDialogMode("edit");
    setShowDialog(true);
  };
  
  const handleDelete = (exercise: Exercise) => {
    setExerciseToDelete(exercise);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!exerciseToDelete) return;
    
    // Here we would actually delete the exercise
    toast({
      title: "Exercise deleted",
      description: `${exerciseToDelete.name} has been removed from your library`,
    });
    
    setDeleteConfirmOpen(false);
    setExerciseToDelete(null);
  };
  
  const handleViewDetails = (exercise: Exercise) => {
    toast({
      title: "View Details",
      description: `This feature will be implemented soon!`,
    });
  };
  
  const handleDuplicate = (exercise: Exercise) => {
    toast({
      title: "Duplicate Exercise",
      description: `This feature will be implemented soon!`,
    });
  };

  const handleSelectExercise = (exercise: Exercise) => {
    if (onSelectExercise) {
      onSelectExercise(exercise);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedMuscleGroup("all");
    setSelectedEquipment("all");
    setSelectedDifficulty("all");
    setSelectedMovement("all");
  };

  // Add/Edit handler
  const handleDialogSubmit = async (exercise: {
    name: string;
    description: string;
    primary_muscle_groups: MuscleGroup[];
    secondary_muscle_groups: MuscleGroup[];
    equipment_type: EquipmentType[];
    movement_pattern: MovementPattern;
    difficulty: Difficulty;
    instructions?: Record<string, any>;
    is_compound?: boolean;
    tips?: string[];
    variations?: string[];
    metadata?: Record<string, any>;
  }) => {
    if (dialogMode === "add") {
      await new Promise(resolve => setTimeout(resolve, 350));
      await new Promise<void>((resolve, reject) => {
        createExercise(
          {
            ...exercise,
            user_id: "",
          },
          {
            onSuccess: () => resolve(),
            onError: err => reject(err),
          }
        );
      });
      toast({
        title: "Exercise added",
        description: `Added ${exercise.name} to your library`
      });
      setShowDialog(false);
    } else {
      toast({ title: "Edit not implemented", description: "Update exercise functionality will be implemented soon!" });
    }
  };

  const renderExerciseCard = (exercise: Exercise) => {
    const variant = standalone ? 'library-manage' : 'workout-add';
    
    return (
      <div key={exercise.id} className="mb-4">
        {standalone ? (
          <CommonExerciseCard
            exercise={exercise}
            variant={variant}
            onAdd={() => handleSelectExercise(exercise)}
            onEdit={() => handleEdit(exercise)}
            onDelete={() => handleDelete(exercise)}
            onViewDetails={() => handleViewDetails(exercise)}
            onDuplicate={() => handleDuplicate(exercise)}
          />
        ) : (
          <CommonExerciseCard
            exercise={exercise}
            variant={variant}
            onAdd={() => handleSelectExercise(exercise)}
          />
        )}
      </div>
    );
  };

  const renderExerciseList = (exercisesList: Exercise[], showPagination = false) => {
    if (exercisesList.length === 0) {
      return (
        <div className="text-center py-6 text-gray-400">
          No exercises found
        </div>
      );
    }

    const listToRender = showPagination ? currentExercises : exercisesList;

    return (
      <div className="space-y-2">
        {listToRender.map(renderExerciseCard)}
        
        {showPagination && totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => paginate(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {/* First page */}
              {currentPage > 2 && (
                <PaginationItem>
                  <PaginationLink onClick={() => paginate(1)}>1</PaginationLink>
                </PaginationItem>
              )}
              
              {/* Ellipsis */}
              {currentPage > 3 && (
                <PaginationItem>
                  <span className="px-2">...</span>
                </PaginationItem>
              )}
              
              {/* Previous page */}
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationLink onClick={() => paginate(currentPage - 1)}>
                    {currentPage - 1}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              {/* Current page */}
              <PaginationItem>
                <PaginationLink isActive>{currentPage}</PaginationLink>
              </PaginationItem>
              
              {/* Next page */}
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationLink onClick={() => paginate(currentPage + 1)}>
                    {currentPage + 1}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              {/* Ellipsis */}
              {currentPage < totalPages - 2 && (
                <PaginationItem>
                  <span className="px-2">...</span>
                </PaginationItem>
              )}
              
              {/* Last page */}
              {currentPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationLink onClick={() => paginate(totalPages)}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => paginate(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    );
  };

  return (
    <div className={`${standalone ? 'pt-16 pb-24' : ''} h-full overflow-hidden flex flex-col`}>
      {standalone && <PageHeader title="Exercise Library" />}
      
      {/* Main content container */}
      <div className={`flex-1 overflow-hidden flex flex-col mx-auto w-full max-w-4xl px-4 ${standalone ? 'py-4' : 'pt-0'}`}>
        <ExerciseDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          onSubmit={handleDialogSubmit}
          initialExercise={exerciseToEdit!}
          loading={isPending}
          mode={dialogMode}
        />
        
        {/* Delete confirmation */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{exerciseToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Header with back button if needed */}
        <div className="flex items-center justify-between mb-4">
          {onBack && (
            <Button 
              variant="ghost"
              size="sm" 
              onClick={onBack}
              className="flex items-center gap-2 -ml-2"
            >
              <ChevronLeft size={18} />
              Back
            </Button>
          )}
          
          <div className="flex-1 flex justify-center">
            <h1 className="text-xl font-semibold text-center">
              {standalone ? "Exercise Library" : "Browse Exercises"}
            </h1>
          </div>
          
          {standalone && (
            <Button 
              onClick={handleAdd}
              size="sm"
              variant="outline"
              className="h-9 px-3 rounded-full bg-purple-900/30 border-purple-500/30 hover:bg-purple-800/50"
            >
              <Plus size={16} className="mr-1" />
              New Exercise
            </Button>
          )}
        </div>
        
        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search exercises..."
            className="pl-9 bg-gray-800 border-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-2 top-1.5 h-7 w-7 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
                
        {/* Tabs for navigation */}
        <Tabs className="flex-1 overflow-hidden flex flex-col" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="suggested">Suggested</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="browse">Browse All</TabsTrigger>
          </TabsList>
          
          {/* Filters button - only show in browse tab */}
          {activeTab === 'browse' && (
            <div className="mb-4">
              <Button 
                variant="outline"
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center w-full justify-center ${showFilters ? 'bg-purple-900/50 border-purple-500' : ''}`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {(selectedMuscleGroup !== "all" || selectedEquipment !== "all" || 
                  selectedDifficulty !== "all" || selectedMovement !== "all") && (
                  <Badge variant="secondary" className="ml-2 bg-purple-600 text-xs">
                    {[
                      selectedMuscleGroup !== "all" ? 1 : 0,
                      selectedEquipment !== "all" ? 1 : 0,
                      selectedDifficulty !== "all" ? 1 : 0,
                      selectedMovement !== "all" ? 1 : 0
                    ].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </Button>
            </div>
          )}
          
          {/* Filter section */}
          {showFilters && activeTab === 'browse' && (
            <Card className="p-4 mb-4 bg-gray-800/50 border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Muscle Group</label>
                  <Select 
                    value={selectedMuscleGroup} 
                    onValueChange={(value) => setSelectedMuscleGroup(value as any)}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700">
                      <SelectValue placeholder="Select muscle group" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectGroup>
                        <SelectItem value="all">All Muscle Groups</SelectItem>
                        {COMMON_MUSCLE_GROUPS.map((muscle) => (
                          <SelectItem key={muscle} value={muscle}>{muscle}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Equipment</label>
                  <Select 
                    value={selectedEquipment} 
                    onValueChange={(value) => setSelectedEquipment(value as any)}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700">
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectGroup>
                        <SelectItem value="all">All Equipment</SelectItem>
                        {COMMON_EQUIPMENT.map((equipment) => (
                          <SelectItem key={equipment} value={equipment}>{equipment}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Difficulty</label>
                  <Select 
                    value={selectedDifficulty} 
                    onValueChange={(value) => setSelectedDifficulty(value as any)}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectGroup>
                        <SelectItem value="all">All Difficulties</SelectItem>
                        {DIFFICULTY_LEVELS.map((difficulty) => (
                          <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Movement Pattern</label>
                  <Select 
                    value={selectedMovement} 
                    onValueChange={(value) => setSelectedMovement(value as any)}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700">
                      <SelectValue placeholder="Select pattern" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectGroup>
                        <SelectItem value="all">All Patterns</SelectItem>
                        {MOVEMENT_PATTERNS.map((pattern) => (
                          <SelectItem key={pattern} value={pattern}>{pattern}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-between">
                <div className="text-sm text-gray-400">
                  {filteredAll.length} exercise{filteredAll.length !== 1 ? 's' : ''} found
                </div>
                
                <Button
                  variant="link"
                  size="sm"
                  onClick={clearFilters}
                  className="text-purple-400 hover:text-purple-300"
                >
                  Clear all filters
                </Button>
              </div>
            </Card>
          )}
          
          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {/* Loading state */}
            {isLoading && (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="bg-gray-900 border-gray-700 p-4">
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-6 w-3/4 bg-gray-800" />
                      <Skeleton className="h-4 w-5/6 bg-gray-800" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Error state */}
            {isError && (
              <div className="text-red-500 text-center py-8">
                Error loading exercises. Please try again later.
              </div>
            )}
            
            {/* Empty state */}
            {!isLoading && !isError && filteredAll.length === 0 && activeTab === 'browse' && (
              <div className="text-center py-12">
                <div className="bg-gray-800/50 rounded-lg py-10 px-6 max-w-md mx-auto">
                  {searchQuery || selectedMuscleGroup !== "all" || selectedEquipment !== "all" || 
                  selectedDifficulty !== "all" || selectedMovement !== "all" ? (
                    <>
                      <h3 className="text-xl font-medium mb-2">No matching exercises</h3>
                      <p className="text-gray-400 mb-6">Try adjusting your filters or search query</p>
                      <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-medium mb-2">No exercises found</h3>
                      <p className="text-gray-400 mb-6">Create your first exercise to get started</p>
                      <Button variant="gradient" onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Exercise
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Tab content */}
            <TabsContent value="suggested" className="mt-0 h-full">
              <div className="overflow-y-auto">
                {renderExerciseList(suggestedExercises)}
              </div>
            </TabsContent>
            
            <TabsContent value="recent" className="mt-0 h-full">
              <div className="overflow-y-auto">
                {renderExerciseList(filteredRecent)}
              </div>
            </TabsContent>
            
            <TabsContent value="browse" className="mt-0 h-full">
              <div className="overflow-y-auto">
                {renderExerciseList(filteredAll, true)}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
      
      {/* Mobile Add Button */}
      {standalone && isMobile && (
        <ExerciseFAB onClick={handleAdd} />
      )}
    </div>
  );
}
