import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { FilterState } from './FilterPresets';

interface FilterChipsProps {
  filters: FilterState;
  onRemoveFilter: (category: keyof FilterState, value: string) => void;
  onClearAll: () => void;
}

export function FilterChips({ filters, onRemoveFilter, onClearAll }: FilterChipsProps) {
  const hasActiveFilters = 
    filters.muscleGroups.length > 0 ||
    filters.equipment.length > 0 ||
    filters.difficulty.length > 0 ||
    filters.movementPatterns.length > 0 ||
    filters.searchQuery.length > 0;

  if (!hasActiveFilters) {
    return null;
  }

  const totalActiveFilters = 
    filters.muscleGroups.length +
    filters.equipment.length +
    filters.difficulty.length +
    filters.movementPatterns.length +
    (filters.searchQuery ? 1 : 0);

  return (
    <div className="mb-4 p-3 bg-accent/50 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          Active Filters ({totalActiveFilters})
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear All
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-1">
        {filters.searchQuery && (
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            Search: "{filters.searchQuery}"
            <button
              onClick={() => onRemoveFilter('searchQuery', filters.searchQuery)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        {filters.muscleGroups.map((muscle) => (
          <Badge key={`muscle-${muscle}`} variant="secondary" className="flex items-center gap-1 text-xs">
            💪 {muscle}
            <button
              onClick={() => onRemoveFilter('muscleGroups', muscle)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        
        {filters.equipment.map((eq) => (
          <Badge key={`equipment-${eq}`} variant="secondary" className="flex items-center gap-1 text-xs">
            🏋️ {eq}
            <button
              onClick={() => onRemoveFilter('equipment', eq)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        
        {filters.difficulty.map((diff) => (
          <Badge key={`difficulty-${diff}`} variant="secondary" className="flex items-center gap-1 text-xs">
            📊 {diff}
            <button
              onClick={() => onRemoveFilter('difficulty', diff)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        
        {filters.movementPatterns.map((pattern) => (
          <Badge key={`pattern-${pattern}`} variant="secondary" className="flex items-center gap-1 text-xs">
            🔄 {pattern}
            <button
              onClick={() => onRemoveFilter('movementPatterns', pattern)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}