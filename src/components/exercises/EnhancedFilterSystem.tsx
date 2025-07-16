import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Filter, RotateCcw } from 'lucide-react';
import { COMMON_MUSCLE_GROUPS, COMMON_EQUIPMENT, DIFFICULTY_LEVELS, MOVEMENT_PATTERNS } from '@/types/exercise';
import type { MuscleGroup, EquipmentType, Difficulty, MovementPattern } from '@/types/exercise';

interface FilterState {
  muscleGroups: MuscleGroup[];
  equipment: EquipmentType[];
  difficulty: Difficulty[];
  movementPattern: MovementPattern[];
  isCompound: boolean | null;
  searchTerm: string;
}

interface EnhancedFilterSystemProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export function EnhancedFilterSystem({ filters, onFiltersChange }: EnhancedFilterSystemProps) {
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayFilter = (
    key: 'muscleGroups' | 'equipment' | 'difficulty' | 'movementPattern',
    item: string
  ) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    updateFilter(key, newArray as any);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      muscleGroups: [],
      equipment: [],
      difficulty: [],
      movementPattern: [],
      isCompound: null,
      searchTerm: ''
    });
  };

  const getActiveFilterCount = () => {
    return (
      filters.muscleGroups.length +
      filters.equipment.length +
      filters.difficulty.length +
      filters.movementPattern.length +
      (filters.isCompound !== null ? 1 : 0) +
      (filters.searchTerm ? 1 : 0)
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Exercise Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFilterCount()}
              </Badge>
            )}
          </CardTitle>
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Term */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Search Exercises
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or description..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {filters.searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilter('searchTerm', '')}
                className="absolute right-1 top-1 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Muscle Groups */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            Target Muscle Groups
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_MUSCLE_GROUPS.map((muscle) => (
              <Badge
                key={muscle}
                variant={filters.muscleGroups.includes(muscle) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80 transition-colors"
                onClick={() => toggleArrayFilter('muscleGroups', muscle)}
              >
                {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                {filters.muscleGroups.includes(muscle) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            Equipment Type
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_EQUIPMENT.map((equipment) => (
              <Badge
                key={equipment}
                variant={filters.equipment.includes(equipment) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80 transition-colors"
                onClick={() => toggleArrayFilter('equipment', equipment)}
              >
                {equipment.charAt(0).toUpperCase() + equipment.slice(1)}
                {filters.equipment.includes(equipment) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            Difficulty Level
          </label>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTY_LEVELS.map((difficulty) => (
              <Badge
                key={difficulty}
                variant={filters.difficulty.includes(difficulty) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80 transition-colors"
                onClick={() => toggleArrayFilter('difficulty', difficulty)}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                {filters.difficulty.includes(difficulty) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Movement Pattern */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            Movement Pattern
          </label>
          <div className="flex flex-wrap gap-2">
            {MOVEMENT_PATTERNS.map((pattern) => (
              <Badge
                key={pattern}
                variant={filters.movementPattern.includes(pattern) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80 transition-colors"
                onClick={() => toggleArrayFilter('movementPattern', pattern)}
              >
                {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                {filters.movementPattern.includes(pattern) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Exercise Type */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            Exercise Type
          </label>
          <div className="flex gap-2">
            <Badge
              variant={filters.isCompound === true ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/80 transition-colors"
              onClick={() => updateFilter('isCompound', filters.isCompound === true ? null : true)}
            >
              Compound
              {filters.isCompound === true && <X className="h-3 w-3 ml-1" />}
            </Badge>
            <Badge
              variant={filters.isCompound === false ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/80 transition-colors"
              onClick={() => updateFilter('isCompound', filters.isCompound === false ? null : false)}
            >
              Isolation
              {filters.isCompound === false && <X className="h-3 w-3 ml-1" />}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}