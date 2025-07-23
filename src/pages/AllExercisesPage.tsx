import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/navigation/PageHeader';
import { EnhancedExerciseCard } from '@/components/exercises/EnhancedExerciseCard';
import { ExerciseDialog } from '@/components/ExerciseDialog';
import { ExerciseDetailsModal } from '@/components/exercises/ExerciseDetailsModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ExerciseFAB } from '@/components/ExerciseFAB';
import { 
  Search, 
  Plus, 
  ChevronLeft,
  X
} from 'lucide-react';
import { Exercise, MuscleGroup, EquipmentType, MovementPattern, Difficulty } from '@/types/exercise';
import { useExercises } from '@/hooks/useExercises';
import { useFavoriteExercises } from '@/hooks/useFavoriteExercises';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { filterExercises as searchFilterExercises } from '@/utils/exerciseSearch';

interface AllExercisesPageProps {
  onSelectExercise?: (exercise: string | Exercise) => void;
  standalone?: boolean;
  onBack?: () => void;
}

export default function AllExercisesPage({ onSelectExercise, standalone = true, onBack }: AllExercisesPageProps) {
  const { exercises, isLoading, isError, createExercise, isPending } = useExercises();
  const { favorites, toggleFavorite, isFavorite } = useFavoriteExercises();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const isMobile = useIsMobile();
  
  // For delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);

  // Simple search state
  const [searchQuery, setSearchQuery] = useState('');

  // For add/edit
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [exerciseToEdit, setExerciseToEdit] = useState<any | null>(null);

  // Apply search filter to exercises
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return exercises; // Show all exercises when no search
    }
    
    return searchFilterExercises(exercises, searchQuery, {
      includeEquipment: true,
      includeMuscleGroups: true,
      includeMovementPattern: true,
      includeDifficulty: true,
      fuzzyMatch: true
    });
  }, [exercises, searchQuery]);

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

  const handleViewDetails = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowDetailsModal(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
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
    return (
      <div key={exercise.id} className="mb-4">
        <EnhancedExerciseCard
          exercise={exercise}
          onAddToWorkout={onSelectExercise ? () => handleSelectExercise(exercise) : undefined}
          onToggleFavorite={toggleFavorite}
          onViewDetails={handleViewDetails}
          isFavorite={isFavorite(exercise.id)}
          showAddToWorkout={!!onSelectExercise}
        />
      </div>
    );
  };

  const renderExerciseList = (exercisesList: Exercise[]) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center py-8 text-destructive">
          Failed to load exercises. Please try again.
        </div>
      );
    }

    if (exercisesList.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-2">
            {searchQuery ? `No exercises found for "${searchQuery}"` : "No exercises available"}
          </div>
          {searchQuery && (
            <Button variant="outline" size="sm" onClick={clearSearch}>
              Clear search
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {exercisesList.map(renderExerciseCard)}
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

        <ExerciseDetailsModal
          exercise={selectedExercise}
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          onAddToWorkout={onSelectExercise ? handleSelectExercise : undefined}
          onToggleFavorite={toggleFavorite}
          isFavorite={selectedExercise ? isFavorite(selectedExercise.id) : false}
          showActions={true}
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
        <div className="flex items-center justify-between mb-6">
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
              className="h-9 px-3 rounded-full"
            >
              <Plus size={16} className="mr-1" />
              New Exercise
            </Button>
          )}
        </div>
        
        {/* Search bar */}
        <div className="relative mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises by name, muscle group, equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-10 bg-card border-border"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-muted"
              >
                <X size={14} />
              </Button>
            )}
          </div>
          
          {/* Search results info */}
          {searchQuery && (
            <div className="mt-2 text-sm text-muted-foreground">
              {filteredExercises.length} result{filteredExercises.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
        
        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto">
          {renderExerciseList(filteredExercises)}
        </div>
        
        {/* Mobile FAB */}
        {isMobile && standalone && (
          <ExerciseFAB onClick={handleAdd} hideOnMobile={false} />
        )}
      </div>
    </div>
  );
}