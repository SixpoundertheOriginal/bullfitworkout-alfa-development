
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dumbbell, ChevronDown, ChevronRight } from "lucide-react";
import { TopExerciseStats } from "@/types/workout-metrics";
import { useWeightUnit } from "@/context/WeightUnitContext";
import { convertWeight } from "@/utils/unitConversion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TopExercisesTableProps {
  exercises: TopExerciseStats[];
  className?: string;
}

export function TopExercisesTable({ exercises, className = "" }: TopExercisesTableProps) {
  const { weightUnit } = useWeightUnit();
  const [selectedExercise, setSelectedExercise] = useState<TopExerciseStats | null>(null);
  
  if (exercises.length === 0) {
    return (
      <Card className={`bg-gray-900 border-gray-800 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Top Exercises</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-gray-500">
            <Dumbbell size={32} className="mb-2 text-gray-700" />
            <p>No exercise data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card className={`bg-gray-900 border-gray-800 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Top Exercises</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Exercise</TableHead>
                <TableHead className="text-gray-400 text-right">Sets</TableHead>
                <TableHead className="text-gray-400 text-right">Avg Weight</TableHead>
                <TableHead className="text-gray-400 text-right">Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exercises.map((exercise) => {
                const avgWeight = convertWeight(exercise.averageWeight, "lb", weightUnit);
                const volume = convertWeight(exercise.totalVolume, "lb", weightUnit);
                
                return (
                  <TableRow 
                    key={exercise.exerciseName} 
                    className="border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedExercise(exercise)}
                  >
                    <TableCell className="font-medium flex items-center gap-2">
                      <ChevronRight size={16} className="text-gray-500" />
                      {exercise.exerciseName}
                    </TableCell>
                    <TableCell className="text-right">{exercise.totalSets}</TableCell>
                    <TableCell className="text-right">
                      {Math.round(avgWeight * 10) / 10} {weightUnit}
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(volume)} {weightUnit}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>{selectedExercise?.exerciseName}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Total Sets</p>
                <p className="text-2xl font-semibold">{selectedExercise?.totalSets}</p>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Average Weight</p>
                <p className="text-2xl font-semibold">
                  {Math.round(convertWeight(selectedExercise?.averageWeight || 0, "lb", weightUnit) * 10) / 10} {weightUnit}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Total Volume</p>
              <p className="text-2xl font-semibold">
                {Math.round(convertWeight(selectedExercise?.totalVolume || 0, "lb", weightUnit))} {weightUnit}
              </p>
            </div>
            
            {selectedExercise?.trend && (
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Progress Trend</p>
                <p className={`text-lg font-medium ${
                  selectedExercise.trend === 'increasing' ? 'text-green-400' :
                  selectedExercise.trend === 'decreasing' ? 'text-red-400' :
                  'text-blue-400'
                }`}>
                  {selectedExercise.trend.charAt(0).toUpperCase() + selectedExercise.trend.slice(1)}
                  {selectedExercise.percentChange !== undefined && (
                    <span className="ml-2">
                      ({selectedExercise.percentChange > 0 ? '+' : ''}{Math.round(selectedExercise.percentChange)}%)
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
