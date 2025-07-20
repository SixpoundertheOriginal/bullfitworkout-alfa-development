
import React from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Grid3X3, 
  List,
  ArrowUpDown,
  Calendar,
  CheckSquare,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { WorkoutManagementFilters } from '@/types/workout-enhanced';
import { trainingTypes } from '@/constants/trainingTypes';

interface WorkoutManagementHeaderProps {
  filters: WorkoutManagementFilters;
  onFiltersChange: (filters: WorkoutManagementFilters) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  selectionMode: boolean;
  onSelectionModeToggle: () => void;
  selectedCount: number;
  onCreateWorkout: () => void;
}

export const WorkoutManagementHeader: React.FC<WorkoutManagementHeaderProps> = ({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  selectionMode,
  onSelectionModeToggle,
  selectedCount,
  onCreateWorkout,
}) => {
  const activeFiltersCount = [
    ...filters.trainingTypes,
    ...filters.qualityLevels,
    filters.dateRange.from ? 'dateRange' : null,
    filters.searchQuery ? 'search' : null,
  ].filter(Boolean).length;

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value });
  };

  const handleTrainingTypeToggle = (typeId: string) => {
    const updated = filters.trainingTypes.includes(typeId)
      ? filters.trainingTypes.filter(id => id !== typeId)
      : [...filters.trainingTypes, typeId];
    
    onFiltersChange({ ...filters, trainingTypes: updated });
  };

  const handleQualityLevelToggle = (level: string) => {
    const updated = filters.qualityLevels.includes(level)
      ? filters.qualityLevels.filter(l => l !== level)
      : [...filters.qualityLevels, level];
    
    onFiltersChange({ ...filters, qualityLevels: updated });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [typeof filters.sortBy, typeof filters.sortOrder];
    onFiltersChange({ ...filters, sortBy, sortOrder });
  };

  const clearAllFilters = () => {
    onFiltersChange({
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
  };

  return (
    <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800 p-4 space-y-4">
      {/* Title and Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {selectionMode ? `${selectedCount} Selected` : 'Workout Management'}
          </h1>
          <p className="text-sm text-gray-400">
            Manage and analyze your workout history
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectionMode ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onSelectionModeToggle}
            >
              <X className="mr-1 h-4 w-4" />
              Cancel
            </Button>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onSelectionModeToggle}
              >
                <CheckSquare className="mr-1 h-4 w-4" />
                Select
              </Button>
              
              <Button 
                onClick={onCreateWorkout}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Workout
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search workouts, exercises..."
            className="w-full bg-gray-900 border-gray-800 pl-10"
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        
        {/* Filters Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={`shrink-0 ${activeFiltersCount > 0 ? 'bg-purple-900/50 border-purple-500' : ''}`}
            >
              <Filter className="mr-1 h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-gray-900 border-gray-800">
            <div className="p-2">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Training Types</h4>
              {trainingTypes.map(type => (
                <DropdownMenuCheckboxItem
                  key={type.id}
                  checked={filters.trainingTypes.includes(type.id)}
                  onCheckedChange={() => handleTrainingTypeToggle(type.id)}
                >
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: type.color }}
                  />
                  {type.name}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator className="bg-gray-800 my-2" />
              
              <h4 className="text-sm font-medium text-gray-300 mb-2">Quality Levels</h4>
              {['excellent', 'good', 'average', 'poor'].map(level => (
                <DropdownMenuCheckboxItem
                  key={level}
                  checked={filters.qualityLevels.includes(level)}
                  onCheckedChange={() => handleQualityLevelToggle(level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
              
              {activeFiltersCount > 0 && (
                <>
                  <DropdownMenuSeparator className="bg-gray-800 my-2" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllFilters}
                    className="w-full justify-start h-8"
                  >
                    Clear All Filters
                  </Button>
                </>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0">
              <ArrowUpDown className="mr-1 h-4 w-4" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
            <DropdownMenuItem onClick={() => handleSortChange('date-desc')}>
              <Calendar className="mr-2 h-4 w-4" />
              Newest First
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange('date-asc')}>
              <Calendar className="mr-2 h-4 w-4" />
              Oldest First
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange('volume-desc')}>
              Volume (High to Low)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange('quality-desc')}>
              Quality (High to Low)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange('duration-desc')}>
              Duration (Long to Short)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Mode Toggle */}
        <div className="flex border border-gray-700 rounded-md overflow-hidden">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="rounded-none px-3"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="rounded-none px-3"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.trainingTypes.map(typeId => {
            const type = trainingTypes.find(t => t.id === typeId);
            return type ? (
              <Badge 
                key={typeId} 
                variant="outline"
                className="bg-gray-800 text-gray-300"
              >
                <div 
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: type.color }}
                />
                {type.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1 hover:bg-gray-700"
                  onClick={() => handleTrainingTypeToggle(typeId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ) : null;
          })}
          
          {filters.qualityLevels.map(level => (
            <Badge 
              key={level} 
              variant="outline"
              className="bg-gray-800 text-gray-300"
            >
              Quality: {level}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-gray-700"
                onClick={() => handleQualityLevelToggle(level)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
