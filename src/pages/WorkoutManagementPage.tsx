
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { deleteWorkout } from "@/services/workoutService";
import { useEnhancedWorkoutHistory } from "@/hooks/useEnhancedWorkoutHistory";
import { WorkoutManagementHeader } from "@/components/workouts/WorkoutManagementHeader";
import { EnhancedWorkoutCard } from "@/components/workouts/EnhancedWorkoutCard";
import { WorkoutManagementFilters } from "@/types/workout-enhanced";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trash2, Copy, BarChart3, Plus, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { ManualWorkoutLogger } from "@/components/workouts/ManualWorkoutLogger";

export const WorkoutManagementPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [filters, setFilters] = useState<WorkoutManagementFilters>({
    dateRange: { 
      from: undefined, 
      to: undefined,
      start: new Date(),
      end: new Date()
    },
    trainingTypes: [],
    qualityLevels: [],
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [manualLoggingMode, setManualLoggingMode] = useState(false);

  // Data fetching
  const { workouts, totalCount, isLoading, refetch } = useEnhancedWorkoutHistory(filters);

  // Handlers
  const handleCreateWorkout = () => {
    navigate('/training-session');
  };

  const handleLogPastWorkout = () => {
    setManualLoggingMode(true);
  };

  const handleViewWorkout = (id: string) => {
    navigate(`/workout-details/${id}`);
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this workout?")) return;
    
    try {
      setDeletingIds(prev => [...prev, id]);
      await deleteWorkout(id);
      toast({ title: "Workout deleted successfully" });
      refetch();
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast({ 
        title: "Failed to delete workout", 
        variant: "destructive" 
      });
    } finally {
      setDeletingIds(prev => prev.filter(deletingId => deletingId !== id));
    }
  };

  const handleDuplicateWorkout = (id: string) => {
    // TODO: Implement workout duplication
    toast({ title: "Workout duplication coming soon!" });
  };

  const handleCompareWorkout = (id: string) => {
    // TODO: Implement workout comparison
    toast({ title: "Workout comparison coming soon!" });
  };

  const handleWorkoutSelect = (id: string, selected: boolean) => {
    setSelectedWorkouts(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    const selectedArray = Array.from(selectedWorkouts);
    if (!window.confirm(`Delete ${selectedArray.length} selected workouts?`)) return;
    
    try {
      setDeletingIds(selectedArray);
      await Promise.all(selectedArray.map(id => deleteWorkout(id)));
      toast({ title: `${selectedArray.length} workouts deleted` });
      setSelectedWorkouts(new Set());
      setSelectionMode(false);
      refetch();
    } catch (error) {
      toast({ 
        title: "Failed to delete some workouts", 
        variant: "destructive" 
      });
    } finally {
      setDeletingIds([]);
    }
  };

  const handleSelectionModeToggle = () => {
    setSelectionMode(!selectionMode);
    setSelectedWorkouts(new Set());
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <WorkoutManagementHeader
          filters={filters}
          onFiltersChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectionMode={selectionMode}
          onSelectionModeToggle={handleSelectionModeToggle}
          selectedCount={selectedWorkouts.size}
          onCreateWorkout={handleCreateWorkout}
          onLogPastWorkout={handleLogPastWorkout}
        />
        
        <div className="p-4">
          <div className={cn(
            "grid gap-4",
            viewMode === 'grid' 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-1"
          )}>
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      <WorkoutManagementHeader
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectionMode={selectionMode}
        onSelectionModeToggle={handleSelectionModeToggle}
        selectedCount={selectedWorkouts.size}
        onCreateWorkout={handleCreateWorkout}
        onLogPastWorkout={handleLogPastWorkout}
      />

      {/* Manual Workout Logger */}
      {manualLoggingMode && (
        <ManualWorkoutLogger
          isOpen={manualLoggingMode}
          onClose={() => setManualLoggingMode(false)}
          onSuccess={() => {
            setManualLoggingMode(false);
            refetch();
          }}
        />
      )}

      {/* Bulk Actions Bar */}
      {selectionMode && selectedWorkouts.size > 0 && (
        <div className="sticky top-32 z-10 bg-purple-900/20 border-y border-purple-500/20 p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-purple-300">
              {selectedWorkouts.size} workout{selectedWorkouts.size !== 1 ? 's' : ''} selected
            </span>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="bg-gray-800 border-gray-700"
                onClick={() => handleDuplicateWorkout(Array.from(selectedWorkouts)[0])}
                disabled={selectedWorkouts.size !== 1}
              >
                <Copy className="mr-1 h-4 w-4" />
                Duplicate
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                className="bg-gray-800 border-gray-700"
                onClick={() => handleCompareWorkout(Array.from(selectedWorkouts)[0])}
                disabled={selectedWorkouts.size !== 2}
              >
                <BarChart3 className="mr-1 h-4 w-4" />
                Compare
              </Button>
              
              <Button 
                size="sm" 
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={deletingIds.length > 0}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete ({selectedWorkouts.size})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-4">
        {workouts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-900 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2">No workouts found</h3>
              <p className="text-gray-400 mb-4">
                {filters.searchQuery || filters.trainingTypes.length > 0 || filters.qualityLevels.length > 0
                  ? "Try adjusting your filters to see more results."
                  : "Start your fitness journey by creating your first workout!"
                }
              </p>
              <Button onClick={handleCreateWorkout}>
                Create Your First Workout
              </Button>
            </div>
          </div>
        ) : (
          <div className={cn(
            "grid gap-4",
            viewMode === 'grid' 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1 max-w-4xl mx-auto"
          )}>
            {workouts.map((workout) => (
              <EnhancedWorkoutCard
                key={workout.id}
                workout={workout}
                onView={handleViewWorkout}
                onDuplicate={handleDuplicateWorkout}
                onDelete={handleDeleteWorkout}
                onCompare={handleCompareWorkout}
                isSelected={selectedWorkouts.has(workout.id)}
                onSelect={selectionMode ? handleWorkoutSelect : undefined}
                compact={viewMode === 'list'}
              />
            ))}
          </div>
        )}

        {/* Load More / Pagination could go here */}
        {workouts.length > 0 && (
          <div className="text-center mt-8 text-gray-400 text-sm">
            Showing {workouts.length} of {totalCount} workouts
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkoutManagementPage;
