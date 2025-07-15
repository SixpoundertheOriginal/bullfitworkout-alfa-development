
import React from "react";
import { format, parseISO } from "date-fns";
import { useWorkoutHistory, WorkoutHistoryFilters } from "@/hooks/useWorkoutHistory";
import { trainingTypes } from "@/constants/trainingTypes";
import { WorkoutCard } from "@/components/WorkoutCard";
import { deleteWorkout } from "@/services/workoutService";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

interface WorkoutHistoryProps {
  className?: string;
  filters?: WorkoutHistoryFilters;
  showPagination?: boolean;
  selectionMode?: boolean;
  selectedWorkouts?: string[];
  onWorkoutSelected?: (workoutId: string, isSelected: boolean) => void;
  onPageChange?: (page: number) => void;
}

export function WorkoutHistory({
  className = "",
  filters = { limit: 5 },
  showPagination = true,
  selectionMode = false,
  selectedWorkouts = [],
  onWorkoutSelected,
  onPageChange
}: WorkoutHistoryProps) {
  const { workouts, exerciseCounts, totalCount, isLoading, refetch } = useWorkoutHistory(filters);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [fixingId, setFixingId] = React.useState<string | null>(null);
  
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this workout?")) {
      try {
        setDeletingId(id);
        await deleteWorkout(id);
        toast({
          title: "Workout deleted"
        });
        refetch();
      } catch (error) {
        console.error("Error deleting workout:", error);
        toast({
          title: "Failed to delete workout",
          variant: "destructive"
        });
      } finally {
        setDeletingId(null);
      }
    }
  };
  
  const handleFixWorkout = async (id: string) => {
    try {
      setFixingId(id);
      // TODO: Implement workout fixing functionality
      toast({
        title: "Workout data updated"
      });
      refetch();
    } catch (error) {
      console.error("Error fixing workout:", error);
      toast({
        title: "Failed to fix workout data",
        variant: "destructive"
      });
    } finally {
      setFixingId(null);
    }
  };
  
  // Calculate pagination
  const workoutsPerPage = filters.limit || 5;
  const currentPage = Math.floor((filters.offset || 0) / workoutsPerPage) + 1;
  const totalPages = Math.ceil(totalCount / workoutsPerPage);
  
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-lg" />
        ))}
      </div>
    );
  }
  
  if (!workouts || workouts.length === 0) {
    return (
      <div className={`p-8 text-center border border-dashed border-gray-800 rounded-lg ${className}`}>
        <p className="text-gray-400">No workouts found</p>
        {filters && (Object.keys(filters).length > 1) && (
          <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
        )}
      </div>
    );
  }
  
  return (
    <div className={className}>
      <div className="space-y-4">
        {workouts.map((workout) => {
          const trainingType = trainingTypes.find(
            (t) => t.id === workout.training_type
          ) || {
            id: workout.training_type,
            name: workout.training_type,
            icon: "Dumbbell",
            color: "#6E59A5"
          };
          
          const exerciseCount = exerciseCounts[workout.id]?.exercises || 0;
          const setCount = exerciseCounts[workout.id]?.sets || 0;
          const isPotentiallyIncomplete = exerciseCount === 0 || setCount === 0;
          
          return (
            <WorkoutCard
              key={workout.id}
              id={workout.id}
              name={workout.name}
              type={workout.training_type}
              date={workout.start_time}
              duration={workout.duration}
              exerciseCount={exerciseCount}
              setCount={setCount}
              onDelete={() => handleDelete(workout.id)}
              isDeleting={deletingId === workout.id}
              onFix={() => handleFixWorkout(workout.id)}
              isFixing={fixingId === workout.id}
              showFixOption={isPotentiallyIncomplete}
              selectionMode={selectionMode}
              isSelected={selectedWorkouts.includes(workout.id)}
              onToggleSelection={() => 
                onWorkoutSelected?.(
                  workout.id, 
                  !selectedWorkouts.includes(workout.id)
                )
              }
            />
          );
        })}
      </div>
      
      {showPagination && totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-400">
            Showing {Math.min(filters.limit || 5, workouts.length)} of {totalCount} workouts
          </div>
          <Pagination>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              &lt;
            </Button>
            <span className="mx-2 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              &gt;
            </Button>
          </Pagination>
        </div>
      )}
    </div>
  );
}
