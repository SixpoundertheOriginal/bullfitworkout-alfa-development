import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/navigation/PageHeader';
import { EnhancedExerciseCard } from '@/components/exercises/EnhancedExerciseCard';
import { ExerciseDialog } from '@/components/ExerciseDialog';
import { ExerciseDetailsModal } from '@/components/exercises/ExerciseDetailsModal';
import { EnhancedFilterSystem } from '@/components/exercises/EnhancedFilterSystem';
import { FilterPresets } from '@/components/exercises/FilterPresets';
import { FilterChips } from '@/components/exercises/FilterChips';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  componentPatterns,
  surfaceColors,
  effects,
  typography,
} from '@/utils/tokenUtils';
import { designTokens } from '@/designTokens';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Search,
  Plus,
  ChevronLeft,
  X,
  Grid3X3,
  List,
  Filter
} from 'lucide-react';
import { Exercise, MuscleGroup, EquipmentType, MovementPattern, Difficulty } from '@/types/exercise';
import { useExercises } from '@/hooks/useExercises';
import { useFavoriteExercises } from '@/hooks/useFavoriteExercises';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useExerciseSuggestions } from '@/hooks/useExerciseSuggestions';
import { useWorkoutHistory } from '@/hooks/useWorkoutHistory';
import { useDebounce } from '@/hooks/useDebounce';
import { filterExercises as searchFilterExercises } from '@/utils/exerciseSearch';
import { AppBackground } from '@/components/ui/AppBackground';

// Define filter state type
interface FilterState {
  muscleGroups: MuscleGroup[];
  equipment: EquipmentType[];
  difficulty: Difficulty[];
  movementPatterns: MovementPattern[];
  searchQuery: string;
}

interface AllExercisesPageProps {
  onAddExercise?: (exercise: Exercise, sourceTab: string) => void;
  standalone?: boolean;
  onBack?: () => void;
  trainingType?: string;
}

export default function AllExercisesPage({ onAddExercise, standalone = true, onBack, trainingType = "" }: AllExercisesPageProps) {
  const { exercises, isLoading, isError, createExercise, isPending } = useExercises();
  const { toggleFavorite, isFavorite } = useFavoriteExercises();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const { suggestedExercises } = useExerciseSuggestions(trainingType);
  const { workouts } = useWorkoutHistory();
  const [activeTab, setActiveTab] = useState<'suggested' | 'recent' | 'all'>('suggested');
  const isMobile = useIsMobile();
  
  // For delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);

  // Enhanced filtering state
  const [filters, setFilters] = useState<FilterState>({
    muscleGroups: [],
    equipment: [],
    difficulty: [],
    movementPatterns: [],
    searchQuery: ''
  });

  const debouncedSearch = useDebounce(filters.searchQuery, 300);

  // View mode state
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);

  // For add/edit
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [exerciseToEdit, setExerciseToEdit] = useState<any | null>(null);
  // AUDIT: removed virtualization scroll tracking

  const recentExercises = useMemo(() => {
    if (!workouts?.length) return [];

    const exerciseMap = new Map<string, Exercise>();

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

  const currentList = useMemo(() => {
    switch (activeTab) {
      case 'suggested':
        return suggestedExercises;
      case 'recent':
        return recentExercises;
      default:
        return exercises;
    }
  }, [activeTab, suggestedExercises, recentExercises, exercises]);

  // Apply comprehensive filtering to exercises
  const filteredExercises = useMemo(() => {
    let filtered = currentList;

    // Apply search filter first
    if (debouncedSearch.trim()) {
      filtered = searchFilterExercises(filtered, debouncedSearch, {
        includeEquipment: true,
        includeMuscleGroups: true,
        includeMovementPattern: true,
        includeDifficulty: true,
        fuzzyMatch: true
      });
    }

    // Apply category filters
    if (filters.muscleGroups.length > 0) {
      filtered = filtered.filter(exercise =>
        filters.muscleGroups.some(mg =>
          exercise.primary_muscle_groups.includes(mg) ||
          exercise.secondary_muscle_groups?.includes(mg)
        )
      );
    }

    if (filters.equipment.length > 0) {
      filtered = filtered.filter(exercise =>
        filters.equipment.some(eq => exercise.equipment_type.includes(eq))
      );
    }

    if (filters.difficulty.length > 0) {
      filtered = filtered.filter(exercise =>
        filters.difficulty.includes(exercise.difficulty)
      );
    }

    if (filters.movementPatterns.length > 0) {
      filtered = filtered.filter(exercise =>
        filters.movementPatterns.includes(exercise.movement_pattern)
      );
    }

    return filtered;
  }, [currentList, filters, debouncedSearch]);

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

  const handleExerciseAdd = (exercise: Exercise) => {
    if (onAddExercise) {
      const source = debouncedSearch.trim() ? 'search' : activeTab;
      onAddExercise(exercise, source);
    }
  };

  const handleViewDetails = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowDetailsModal(true);
  };

  // Filter management functions
  const handleFiltersChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRemoveFilter = (category: keyof FilterState, value: string) => {
    if (category === 'searchQuery') {
      setFilters(prev => ({ ...prev, searchQuery: '' }));
    } else {
      setFilters(prev => ({
        ...prev,
        [category]: (prev[category] as string[]).filter(item => item !== value)
      }));
    }
  };

  const handleClearAllFilters = () => {
    setFilters({
      muscleGroups: [],
      equipment: [],
      difficulty: [],
      movementPatterns: [],
      searchQuery: ''
    });
  };

  const getActiveFilterCount = () => {
    return filters.muscleGroups.length + 
           filters.equipment.length + 
           filters.difficulty.length + 
           filters.movementPatterns.length + 
           (filters.searchQuery ? 1 : 0);
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

  const renderExerciseCard = (exercise: Exercise) => (
    <EnhancedExerciseCard
      key={exercise.id}
      exercise={exercise}
      onAddToWorkout={() => handleExerciseAdd(exercise)}
      onToggleFavorite={toggleFavorite}
      onViewDetails={handleViewDetails}
      isFavorite={isFavorite(exercise.id)}
      showAddToWorkout={!!onAddExercise}
    />
  );

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
      const hasActiveFilters = getActiveFilterCount() > 0;
      return (
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-2">
            {hasActiveFilters ? "No exercises match your filters" : "No exercises available"}
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClearAllFilters}>
              Clear all filters
            </Button>
          )}
        </div>
      );
    }

    // AUDIT: remove manual virtualization in favor of simple scrollable containers
    if (viewMode === 'grid') {
      return (
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercisesList.map(renderExerciseCard)}
        </div>
      );
    }

    return (
      <div className="space-y-4 overflow-y-auto h-full">
        {exercisesList.map(renderExerciseCard)}
      </div>
    );
  };

  return (
    <AppBackground variant="primary" className={!standalone ? 'h-full' : undefined} noMinHeight={!standalone}>
      <div className={`${standalone ? 'pt-16 pb-24' : ''} h-full flex flex-col min-h-0`}>
      {standalone && <PageHeader title="Exercise Library" />}
      
      {/* Main content container */}
      <div className={`flex-1 flex flex-col min-h-0 mx-auto w-full max-w-4xl px-4 ${standalone ? 'py-4' : 'pt-0'}`}>
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
          onAddToWorkout={onAddExercise ? () => selectedExercise && handleExerciseAdd(selectedExercise) : undefined}
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
        
        {/* Header with controls */}
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
              className="h-9 px-3 rounded-full"
            >
              <Plus size={16} className="mr-1" />
              New Exercise
            </Button>
          )}
        </div>

        {/* Search and filter controls */}
        <div
          className={cn(
            `sticky top-0 z-40 mb-[${designTokens.spacing.lg}] pb-[${designTokens.spacing.lg}]`,
            componentPatterns.card.secondary(),
            effects.blur.card()
          )}
        >
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-4">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger
                value="suggested"
                className={cn(
                  componentPatterns.navigation.item(),
                  typography.caption(),
                  'w-full text-zinc-400 hover:text-white',
                  `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`,
                  `hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`,
                  `data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:${effects.glow.purple()}`
                )}
              >
                Suggested
              </TabsTrigger>
              <TabsTrigger
                value="recent"
                className={cn(
                  componentPatterns.navigation.item(),
                  typography.caption(),
                  'w-full text-zinc-400 hover:text-white',
                  `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`,
                  `hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`,
                  `data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:${effects.glow.purple()}`
                )}
              >
                Recent
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className={cn(
                  componentPatterns.navigation.item(),
                  typography.caption(),
                  'w-full text-zinc-400 hover:text-white',
                  `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`,
                  `hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`,
                  `data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:${effects.glow.purple()}`
                )}
              >
                All
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {/* Search bar */}
          <div className={`relative mb-[${designTokens.spacing.lg}]`}>
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises by name, muscle group, equipment..."
              value={filters.searchQuery}
              onChange={(e) => handleFiltersChange({ searchQuery: e.target.value })}
              className={cn(
                'pl-9 pr-9 h-10 rounded-md',
                surfaceColors.secondary(),
                effects.blur.card(),
                'border border-white/15',
                `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`,
                `focus-visible:ring-2 focus-visible:ring-[${designTokens.colors.brand.primary}]`
              )}
            />
            {filters.searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFiltersChange({ searchQuery: '' })}
                className={cn(
                  componentPatterns.button.ghost(),
                  'absolute right-1 top-1 h-8 w-8 p-0 rounded-md',
                  `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`,
                  `hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`
                )}
              >
                <X size={14} />
              </Button>
            )}
          </div>

          {/* Filter controls bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  componentPatterns.button.secondary(),
                  'h-9',
                  `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`,
                  `hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`,
                  showFilters && `bg-gradient-to-r from-purple-600 to-pink-500 text-white ${effects.glow.purple()}`
                )}
              >
                <Filter size={16} className="mr-1" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'ml-2 h-5 px-1.5',
                      typography.caption()
                    )}
                  >
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
              </span>
              <div className="flex border border-white/15 rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    componentPatterns.button.secondary(),
                    'h-8 px-3 rounded-none rounded-l-md',
                    `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`,
                    `hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`,
                    viewMode === 'list' && `bg-gradient-to-r from-purple-600 to-pink-500 text-white ${effects.glow.purple()}`
                  )}
                >
                  <List size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    componentPatterns.button.secondary(),
                    'h-8 px-3 rounded-none rounded-r-md',
                    `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`,
                    `hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`,
                    viewMode === 'grid' && `bg-gradient-to-r from-purple-600 to-pink-500 text-white ${effects.glow.purple()}`
                  )}
                >
                  <Grid3X3 size={14} />
                </Button>
              </div>
            </div>
          </div>

          {/* Filter presets */}
          {showFilters && (
            <div className="mt-4 space-y-4">
              <FilterPresets 
                onApplyFilter={handleFiltersChange}
                activeFilters={filters}
              />
            </div>
          )}

          {/* Active filter chips */}
          <FilterChips
            filters={filters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
          />
        </div>
        
        {/* Exercise list */}
        {renderExerciseList(filteredExercises)}
      </div>
      </div>
    </AppBackground>
  );
}