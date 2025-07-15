
import React, { useState } from 'react';
import { BarChart3, CheckSquare, X, Filter, Calendar as CalendarIcon } from "lucide-react";
import { WorkoutHistory } from "@/components/WorkoutHistory";
import { Button } from "@/components/ui/button";
import { QuickActionBar } from './QuickActionBar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { WorkoutHistoryFilters } from '@/hooks/useWorkoutHistory';

interface WorkoutLogSectionProps {
  showWorkouts: boolean;
  onToggle: () => void;
}

export const WorkoutLogSection = ({ showWorkouts, onToggle }: WorkoutLogSectionProps) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);
  const [filters, setFilters] = useState<WorkoutHistoryFilters>({
    limit: 5,
    offset: 0,
    startDate: null,
    endDate: null,
    trainingTypes: []
  });
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedWorkouts([]);
  };

  const handleWorkoutSelected = (workoutId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedWorkouts(prev => [...prev, workoutId]);
    } else {
      setSelectedWorkouts(prev => prev.filter(id => id !== workoutId));
    }
  };

  const handleActionComplete = () => {
    setIsSelectionMode(false);
    setSelectedWorkouts([]);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      offset: (page - 1) * (prev.limit || 5)
    }));
  };

  const handleLimitChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      limit: parseInt(value),
      offset: 0 // Reset to first page when changing limit
    }));
  };

  const handleTrainingTypeChange = (value: string) => {
    if (value === "all") {
      setFilters(prev => ({
        ...prev,
        trainingTypes: []
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        trainingTypes: [value]
      }));
    }
  };

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range);
    setFilters(prev => ({
      ...prev,
      startDate: range.from ? format(range.from, 'yyyy-MM-dd') : null,
      endDate: range.to ? format(range.to, 'yyyy-MM-dd') : null,
      offset: 0 // Reset to first page when changing date range
    }));
  };

  const clearFilters = () => {
    setFilters({
      limit: 5,
      offset: 0,
      startDate: null,
      endDate: null,
      trainingTypes: []
    });
    setDateRange({ from: undefined, to: undefined });
  };

  return (
    <section className="animate-fade-in" style={{ animationDelay: '500ms' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-primary" />
          <h2 className="text-lg font-semibold">Recent Workouts</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {!isSelectionMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleSelectionMode}
              className="text-sm"
            >
              <CheckSquare className="mr-1 h-4 w-4" />
              Select
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`text-sm ${showFilters ? 'bg-gray-800' : ''}`}
          >
            <Filter className="mr-1 h-4 w-4" />
            Filter
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggle}
            className="text-sm"
          >
            {showWorkouts ? 'Hide' : 'Show'}
          </Button>
        </div>
      </div>
      
      {showFilters && showWorkouts && (
        <div className="mb-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-gray-400 mb-1">Training Type</label>
              <Select 
                onValueChange={handleTrainingTypeChange}
                value={filters.trainingTypes?.length ? filters.trainingTypes[0] : "all"}
              >
                <SelectTrigger className="w-[150px] h-8">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Strength">Strength</SelectItem>
                  <SelectItem value="Cardio">Cardio</SelectItem>
                  <SelectItem value="Yoga">Yoga</SelectItem>
                  <SelectItem value="Calisthenics">Calisthenics</SelectItem>
                  <SelectItem value="HIIT">HIIT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col">
              <label className="text-xs text-gray-400 mb-1">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-gray-700 bg-gray-800 hover:bg-gray-700"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-800" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleDateRangeChange}
                    initialFocus
                    className="bg-gray-900"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex flex-col">
              <label className="text-xs text-gray-400 mb-1">Workouts per page</label>
              <Select 
                onValueChange={handleLimitChange}
                value={filters.limit?.toString() || "5"}
              >
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue placeholder="5" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <div className="flex gap-2">
              {filters.trainingTypes?.length ? (
                <Badge variant="outline" className="bg-gray-800">
                  Type: {filters.trainingTypes[0]}
                </Badge>
              ) : null}
              
              {filters.startDate && (
                <Badge variant="outline" className="bg-gray-800">
                  From: {format(new Date(filters.startDate), "MMM d, yyyy")}
                </Badge>
              )}
              
              {filters.endDate && (
                <Badge variant="outline" className="bg-gray-800">
                  To: {format(new Date(filters.endDate), "MMM d, yyyy")}
                </Badge>
              )}
            </div>
            
            {(filters.trainingTypes?.length || filters.startDate || filters.endDate) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="text-xs h-7"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}
      
      {isSelectionMode && selectedWorkouts.length > 0 && (
        <div className="mb-4">
          <QuickActionBar 
            selectedWorkoutIds={selectedWorkouts}
            onClearSelection={() => setSelectedWorkouts([])}
            onActionComplete={handleActionComplete}
          />
        </div>
      )}
      
      {showWorkouts && (
        <WorkoutHistory 
          filters={filters}
          onPageChange={handlePageChange}
          className="mt-2"
          selectionMode={isSelectionMode}
          selectedWorkouts={selectedWorkouts}
          onWorkoutSelected={handleWorkoutSelected} 
        />
      )}
      
      {isSelectionMode && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleSelectionMode}
            className="text-sm"
          >
            <X className="mr-1 h-4 w-4" />
            Exit Selection Mode
          </Button>
        </div>
      )}
    </section>
  );
};
