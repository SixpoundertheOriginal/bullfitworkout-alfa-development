
// src/pages/workout/WorkoutDetailsPage.tsx

import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WorkoutDetailsLoading } from "@/components/workouts/WorkoutDetailsLoading";
import { WorkoutDetailsHeader } from "@/components/workouts/WorkoutDetailsHeader";
import { WorkoutDetailsEnhanced } from "@/components/workouts/WorkoutDetailsEnhanced";
import { useWorkoutDetails } from "@/hooks/useWorkoutDetails";
import { useExerciseManagement } from "@/hooks/useExerciseManagement";
import { processWorkoutMetrics, ProcessedWorkoutMetrics } from "@/utils/workoutMetricsProcessor";
import { useWeightUnit } from "@/context/WeightUnitContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WorkoutDensityChart } from "@/components/metrics/WorkoutDensityChart";
import { TimeOfDayChart } from "@/components/metrics/TimeOfDayChart";
import { MuscleGroupChart } from "@/components/metrics/MuscleGroupChart";
import { TopExercisesTable } from "@/components/metrics/TopExercisesTable";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { EditWorkoutModal } from "@/components/EditWorkoutModal";
import { EditExerciseSetModal } from "@/components/EditExerciseSetModal";
import { ExerciseDialog } from "@/components/ExerciseDialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useDeleteOperation } from "@/hooks/useAsyncOperation";
import { deleteWorkout } from "@/services/workoutService";
import { Loader2 } from "lucide-react";
import { WeightUnit } from "@/utils/unitConversion";

const WorkoutDetailsPage: React.FC = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const { weightUnit } = useWeightUnit();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    workoutDetails,
    exerciseSets,
    loading: loadingDetails,
    setWorkoutDetails,
    setExerciseSets
  } = useWorkoutDetails(workoutId);

  const {
    editModalOpen,
    setEditModalOpen,
    exerciseSetModalOpen,
    setExerciseSetModalOpen,
    currentExercise,
    exerciseSetsToEdit,
    deleteAlertOpen,
    setDeleteAlertOpen,
    exerciseToDelete,
    showAddDialog,
    setShowAddDialog,
    handleSaveWorkoutEdit,
    handleEditExercise,
    handleSaveExerciseSets,
    handleAddExercise,
    handleDeleteExercise
  } = useExerciseManagement(workoutId, setExerciseSets);

  const deleteWorkoutOperation = useDeleteOperation(deleteWorkout, {
    successMessage: "Workout deleted successfully",
    errorMessage: "Failed to delete workout",
    redirectPath: "/training?tab=history",
    navigate
  });

  // Initialize metrics with safe defaults outside the conditional rendering
  const groupedExercises = useMemo(() => {
    const map: Record<string, any[]> = {};
    if (workoutDetails && exerciseSets) {
      if (Array.isArray(exerciseSets)) {
        exerciseSets.forEach(set => {
          const name = set.exercise_name || "Unknown";
          if (!map[name]) map[name] = [];
          map[name].push(set);
        });
      } else if (typeof exerciseSets === "object" && exerciseSets !== null) {
        Object.assign(map, exerciseSets);
      }
    }
    return map;
  }, [exerciseSets]);

  // Calculate metrics safely - ensure this runs unconditionally
  const metrics = useMemo(() => {
    if (!workoutDetails) {
      // Return default/empty metrics when workoutDetails isn't available
      return {
        duration: 0,
        totalVolume: 0,
        adjustedVolume: 0,
        density: 0,
        exerciseCount: 0,
        setCount: { 
          total: 0, 
          completed: 0,
          failed: 0
        },
        densityMetrics: {
          setsPerMinute: 0,
          volumePerMinute: 0,
          overallDensity: 0,
          activeOnlyDensity: 0,
          formattedOverallDensity: "0.0 kg/min",
          formattedActiveOnlyDensity: "0.0 kg/min"
        },
        intensityMetrics: {
          averageRpe: 0,
          peakLoad: 0,
          averageLoad: 0
        },
        intensity: 0,
        efficiency: 0,
        muscleFocus: {},
        estimatedEnergyExpenditure: 0,
        movementPatterns: {},
        timeDistribution: { 
          activeTime: 0, 
          restTime: 0, 
          activeTimePercentage: 0, 
          restTimePercentage: 0 
        },
        composition: {
          compound: { count: 0, percentage: 0 },
          isolation: { count: 0, percentage: 0 },
          bodyweight: { count: 0, percentage: 0 },
          isometric: { count: 0, percentage: 0 },
          totalExercises: 0
        },
        durationByTimeOfDay: {
          morning: 0,
          afternoon: 0,
          evening: 0,
          night: 0
        }
      } as ProcessedWorkoutMetrics;
    }

    // Pass optional workout object with start_time property to enable time-of-day feature 
    const workoutWithTiming = workoutDetails ? {
      start_time: workoutDetails.start_time,
      duration: workoutDetails.duration || 0
    } : undefined;

    return processWorkoutMetrics(
      groupedExercises,
      workoutDetails.duration || 0,
      weightUnit as WeightUnit,
      undefined, // userBodyInfo
      workoutWithTiming // Pass the workout timing data
    );
  }, [groupedExercises, workoutDetails, weightUnit]);

  if (loadingDetails || !workoutDetails) {
    return <WorkoutDetailsLoading />;
  }

  // Use type assertion and add null checks for accessing properties
  const metricValues = metrics as ProcessedWorkoutMetrics;
  
  // Calculate max load and session max for new summary card
  const sessionMax = metricValues.intensityMetrics?.peakLoad || 0;
  
  // Destructure with safe defaults - updating property names to match ProcessedWorkoutMetrics
  const totalVolume = metricValues.totalVolume || 0;
  
  // These properties are in the timeDistribution object in ProcessedWorkoutMetrics
  const activeTime = metricValues.timeDistribution?.activeTime || 0;
  const restTime = metricValues.timeDistribution?.restTime || 0;
  
  // These properties are in densityMetrics in ProcessedWorkoutMetrics
  const overallDensity = metricValues.densityMetrics?.overallDensity || 0;
  const activeOnlyDensity = metricValues.densityMetrics?.activeOnlyDensity || 0;
  
  // For time patterns chart - use the durationByTimeOfDay data from metrics
  const durationByTimeOfDay = metricValues.durationByTimeOfDay || {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0
  };
  
  // Get intensity and efficiency values for display
  const intensity = metricValues.intensity || 0;
  const efficiency = metricValues.timeDistribution?.activeTimePercentage || 0;
  
  // For exercise volume history chart - create from muscle focus data
  const exerciseVolumeHistory = metricValues.muscleFocus ? 
    Object.entries(metricValues.muscleFocus).map(([name, value]) => ({
      exercise_name: name,
      trend: 'stable' as 'increasing' | 'decreasing' | 'stable' | 'fluctuating',
      percentChange: 0
    })) : [];

  // Helper function to check if any time of day data is available
  const hasTimeOfDayData = Object.values(durationByTimeOfDay).some(value => value > 0);

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-black text-white">
        <main className="flex-1 overflow-auto px-4 py-6 pb-24 mt-16">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/training?tab=history">Workouts</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>{workoutDetails.name || "Workout Details"}</BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header card */}
          <WorkoutDetailsHeader
            workoutDetails={workoutDetails}
            onEditClick={() => setEditModalOpen(true)}
            onDeleteClick={() => setDeleteDialogOpen(true)}
          />

          {/* Summary row - Added Max Load card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            {[
              { label: "Date", value: new Date(workoutDetails.start_time).toLocaleDateString(), colSpan: "md:col-span-1" },
              { label: "Duration", value: `${workoutDetails.duration} min`, colSpan: "md:col-span-1" },
              { label: "Exercises", value: metricValues.exerciseCount, colSpan: "md:col-span-1" },
              { label: "Sets", value: metricValues.setCount.total, colSpan: "md:col-span-1" },
              { label: "Volume", value: `${Math.round(totalVolume).toLocaleString()} ${weightUnit}`, colSpan: "md:col-span-1" },
              { label: "Max Load", value: `${Math.round(sessionMax)} ${weightUnit}`, colSpan: "md:col-span-1" },
            ].map((item, idx) => (
              <Card key={idx} className={`bg-gray-900 border-gray-800 ${item.colSpan}`}>
                <CardHeader className="py-3"><CardTitle className="text-sm">{item.label}</CardTitle></CardHeader>
                <CardContent className="py-1">
                  <div className="text-lg">{item.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Workout Density & Time Distribution */}
          <Card className="bg-gray-900 border-gray-800 mb-6">
            <CardHeader><CardTitle>Workout Density Analysis</CardTitle></CardHeader>
            <CardContent>
              <div className="h-60 mb-4" aria-label="Workout density analysis chart">
                <WorkoutDensityChart
                  totalTime={metricValues.duration || 0}
                  activeTime={activeTime}
                  restTime={restTime}
                  totalVolume={totalVolume}
                  weightUnit={weightUnit}
                  overallDensity={overallDensity}
                  activeOnlyDensity={activeOnlyDensity}
                  height={220}
                />
              </div>
              
              {/* Intensity & Efficiency metrics */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="p-4 rounded-md bg-gray-800/50 border border-gray-700">
                  <div className="text-sm text-gray-400 mb-1">Intensity</div>
                  <div className="text-lg font-medium">{intensity.toFixed(1)}%</div>
                </div>
                <div className="p-4 rounded-md bg-gray-800/50 border border-gray-700">
                  <div className="text-sm text-gray-400 mb-1">Efficiency</div>
                  <div className="text-lg font-medium">{efficiency.toFixed(1)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time of Day and Workout Composition side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Time of Day Chart */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader><CardTitle>Time of Day</CardTitle></CardHeader>
              <CardContent className="h-60">
                {hasTimeOfDayData ? (
                  <div aria-label="Time of Day distribution chart">
                    <TimeOfDayChart
                      durationByTimeOfDay={durationByTimeOfDay}
                      height={200}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No time-of-day data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Workout Composition Card - FIX HERE */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader><CardTitle>Workout Composition</CardTitle></CardHeader>
              <CardContent className="h-60">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(metricValues.composition || {})
                    .filter(([key]) => key !== 'totalExercises')
                    .map(([type, data]) => {
                      // Check if data is an object with count and percentage properties
                      const count = typeof data === 'object' && data !== null ? data.count || 0 : 0;
                      const percentage = typeof data === 'object' && data !== null ? data.percentage || 0 : 0;
                      
                      return (
                        <div key={type} className="flex flex-col p-3 rounded-md bg-gray-800/50 border border-gray-700">
                          <div className="text-sm text-gray-400 mb-1 capitalize">{type}</div>
                          <div className="text-lg font-medium">
                            {count} <span className="text-sm text-gray-400">({Math.round(percentage)}%)</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Muscle Focus */}
          <Card className="bg-gray-900 border-gray-800 mb-6">
            <CardHeader><CardTitle>Muscle Group Focus</CardTitle></CardHeader>
            <CardContent className="h-60" aria-label="Muscle Group Focus chart">
              <MuscleGroupChart muscleFocus={metricValues.muscleFocus || {}} height={200} />
            </CardContent>
          </Card>

          {/* Top Exercises */}
          <Card className="bg-gray-900 border-gray-800 mb-6">
            <CardHeader><CardTitle>Top Exercises</CardTitle></CardHeader>
            <CardContent>
              <TopExercisesTable exerciseVolumeHistory={exerciseVolumeHistory} />
            </CardContent>
          </Card>

          {/* Raw exercise list & editing */}
          <WorkoutDetailsEnhanced
            workout={workoutDetails}
            exercises={exerciseSets}
            onEditClick={() => setEditModalOpen(true)}
            onEditExercise={handleEditExercise}
          />
        </main>

        {/* Modals & dialogs */}
        <EditWorkoutModal
          workout={workoutDetails}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSave={async updated => {
            const saved = await handleSaveWorkoutEdit(updated);
            if (saved) setWorkoutDetails(saved);
          }}
        />
        <EditExerciseSetModal
          sets={exerciseSetsToEdit}
          exerciseName={currentExercise}
          open={exerciseSetModalOpen}
          onOpenChange={setExerciseSetModalOpen}
          onSave={handleSaveExerciseSets}
        />
        <ExerciseDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSubmit={async ex => ex.name && handleAddExercise(ex.name)}
          mode="add"
        />
        <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
          <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {currentExercise}? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteExercise}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Workout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this workout? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteWorkoutOperation.execute(workoutId!)}
                disabled={deleteWorkoutOperation.isLoading}
              >
                {deleteWorkoutOperation.isLoading
                  ? <><Loader2 className="animate-spin mr-2 h-4 w-4"/>Deleting...</>
                  : "Delete Workout"
                }
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundary>
  );
};

export default WorkoutDetailsPage;
