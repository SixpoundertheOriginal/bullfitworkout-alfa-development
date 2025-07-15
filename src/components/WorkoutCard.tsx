import React from 'react';
import { Dumbbell, Clock, Trash2, Edit, Check, Loader2, Wrench, Eye, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { trainingTypes } from '@/constants/trainingTypes';
import { cn } from '@/lib/utils';
import { typography } from '@/lib/typography';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { WorkoutSummaryPreview } from './workouts/WorkoutSummaryPreview';
import { useQuery } from '@tanstack/react-query';
import { getWorkoutWithExercises } from '@/services/workoutService';
import { useWeightUnit } from '@/context/WeightUnitContext';
import { processWorkoutMetrics } from '@/utils/workoutMetricsProcessor';

interface WorkoutCardProps {
  id: string;
  name: string;
  type: string;
  date: string;
  duration: number;
  exerciseCount: number;
  setCount: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onFix?: () => void;
  isDeleting?: boolean;
  isFixing?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  showFixOption?: boolean;
}

export const WorkoutCard = ({
  id,
  name,
  type,
  date,
  duration,
  exerciseCount,
  setCount,
  onEdit,
  onDelete,
  onFix,
  isDeleting = false,
  isFixing = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelection,
  showFixOption = false
}: WorkoutCardProps) => {
  const navigate = useNavigate();
  const { weightUnit } = useWeightUnit();
  const trainingType = trainingTypes.find(t => t.id === type) || trainingTypes[0];
  const formattedDate = format(parseISO(date), 'MMM d, yyyy');
  const formattedTime = format(parseISO(date), 'h:mm a');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate completion percentage (using central metrics processor logic)
  const completionPercentage = Math.min(100, Math.max(0, (setCount > 0 ? setCount / (setCount + 1) : 0) * 100));
  
  // Identify potentially incomplete workouts (no exercises or sets)
  const isPotentiallyIncomplete = exerciseCount === 0 || setCount === 0;
  
  // Load detailed exercise data when expanded
  const { data: workoutDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['workout-details', id, isExpanded],
    queryFn: () => isExpanded ? getWorkoutWithExercises(id) : null,
    enabled: isExpanded,
    staleTime: 30000, // Consider data stale after 30 seconds to facilitate refreshes
  });
  
  const handleCardClick = () => {
    if (!selectionMode) {
      navigate(`/workout-details/${id}`);
    } else if (onToggleSelection) {
      onToggleSelection();
    }
  };
  
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/workout-details/${id}`);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Future implementation: Share workout functionality
    console.log("Share workout:", id);
  };
  
  return (
    <div 
      className={cn(
        "relative bg-gray-900 rounded-lg p-4 border transition-colors",
        isPotentiallyIncomplete && !selectionMode ? "border-yellow-700/50" : "border-gray-800 hover:border-gray-700",
        selectionMode && isSelected && "border-purple-500",
        "hover:shadow-lg hover:shadow-purple-900/10 transition-all duration-300"
      )}
    >
      {selectionMode ? (
        <div 
          onClick={onToggleSelection}
          className="absolute top-0 left-0 w-full h-full bg-black/20 rounded-lg flex items-center justify-center cursor-pointer"
        >
          <div className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center",
            isSelected ? "bg-purple-600 border-purple-400" : "border-white/40"
          )}>
            {isSelected && <Check size={14} className="text-white" />}
          </div>
        </div>
      ) : (
        <div 
          className="absolute top-4 right-4 z-10"
          onClick={(e) => e.stopPropagation()} // Prevent navigation when clicking dropdown
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
              >
                <span className="sr-only">Open menu</span>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                >
                  <path
                    d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
              <DropdownMenuItem onClick={handlePreview} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                <span>View Details</span>
              </DropdownMenuItem>
              
              {onEdit && (
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit Workout</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                <Share2 className="mr-2 h-4 w-4" />
                <span>Share</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-gray-800" />
              
              {showFixOption && onFix && (
                <DropdownMenuItem 
                  onClick={onFix}
                  disabled={isFixing}
                  className="cursor-pointer text-yellow-500 focus:text-yellow-400 focus:bg-yellow-900/20"
                >
                  {isFixing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wrench className="mr-2 h-4 w-4" />
                  )}
                  <span>{isFixing ? 'Fixing...' : 'Fix Issues'}</span>
                </DropdownMenuItem>
              )}
              
              {onDelete && (
                <DropdownMenuItem 
                  onClick={onDelete}
                  disabled={isDeleting} 
                  className="cursor-pointer text-red-500 focus:text-red-400 focus:bg-red-900/20"
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      <div 
        className="relative z-0 cursor-pointer" 
        onClick={selectionMode ? onToggleSelection : handleCardClick}
      >
        {/* Progress indicator */}
        <div className="absolute -top-4 -left-4 -right-4 flex justify-center">
          <div className={cn(
            "h-1 w-3/4 rounded-full overflow-hidden",
            isPotentiallyIncomplete ? "bg-yellow-900/30" : "bg-gray-800"
          )}>
            <div 
              className={cn(
                "h-full", 
                isPotentiallyIncomplete ? "bg-yellow-600" : "bg-purple-600"
              )}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-start mt-1">
          <div>
            <div className="flex items-center">
              <h3 className={typography.headings.h3}>{name}</h3>
              {isPotentiallyIncomplete && (
                <div className="ml-2 p-1 rounded-full bg-yellow-900/30">
                  <svg className="h-3 w-3 text-yellow-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 9V14M12 16V16.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="flex items-center text-gray-400 text-sm mt-1">
              <span 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ 
                  backgroundColor: trainingType.color
                }} 
              />
              <span className="mr-3">{trainingType.name}</span>
              <span>{formattedDate} • {formattedTime}</span>
            </div>
          </div>
        </div>
        
        <div className="flex mt-3 justify-between">
          <div className="flex items-center text-sm">
            <Dumbbell size={14} className="mr-1 text-gray-500" />
            <span>{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}, {setCount} set{setCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center text-sm">
            <Clock size={14} className="mr-1 text-gray-500" />
            <span>{duration} min</span>
          </div>
        </div>
        
        {isPotentiallyIncomplete && !selectionMode && (
          <div className="mt-2 pt-2 border-t border-yellow-800/30 flex items-center text-yellow-500 text-xs">
            <svg className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V14M12 16V16.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Incomplete data
          </div>
        )}

        {/* Expandable section */}
        <div className="mt-2 flex justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "w-full h-6 text-xs text-gray-500 hover:text-white transition-colors",
              isExpanded && "text-gray-300"
            )}
            onClick={handleToggleExpand}
          >
            {isExpanded ? (
              <><ChevronUp className="h-3 w-3 mr-1" /> Show less</>
            ) : (
              <><ChevronDown className="h-3 w-3 mr-1" /> Show more</>
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className={cn(
            "mt-2 pt-3 border-t border-gray-800 animate-fade-in",
            isExpanded ? "opacity-100" : "opacity-0"
          )}>
            {/* Enhanced Summary Component */}
            <WorkoutSummaryPreview
              workoutId={id}
              exerciseCount={exerciseCount}
              setCount={setCount}
              exerciseData={workoutDetails?.exerciseSets ? 
                // Transform exerciseSets into the format expected by WorkoutSummaryPreview
                workoutDetails.exerciseSets.reduce((acc: Record<string, any[]>, set: any) => {
                  if (!acc[set.exercise_name]) {
                    acc[set.exercise_name] = [];
                  }
                  acc[set.exercise_name].push(set);
                  return acc;
                }, {}) : 
                {}
              }
              duration={duration}
              weightUnit={weightUnit}
              isLoading={isLoadingDetails}
            />

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-gray-800 hover:bg-gray-700 border-gray-700"
                onClick={handlePreview}
              >
                <Eye className="mr-1 h-4 w-4" />
                View Details
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-gray-800 hover:bg-gray-700 border-gray-700"
                onClick={handleShare}
              >
                <Share2 className="mr-1 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
