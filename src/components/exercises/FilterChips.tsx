import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { FilterState } from './FilterPresets';
import { cn } from '@/lib/utils';
import { componentPatterns, typography, surfaceColors } from '@/utils/tokenUtils';
import { designTokens } from '@/designTokens';

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
    <div
      className={cn(
        `mb-[${designTokens.spacing.lg}] p-[${designTokens.spacing.md}]`,
        surfaceColors.secondary(),
        'rounded-lg border border-white/15'
      )}
    >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <span className={typography.bodySmall()}>Active Filters</span>
            <span className={typography.metricNumber()}>{totalActiveFilters}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className={cn(
              componentPatterns.button.ghost(),
            typography.caption(),
            'h-6 px-2',
            `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`,
            `hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`
          )}
        >
          Clear All
        </Button>
      </div>

      <div className={`flex flex-wrap gap-[${designTokens.spacing.xs}]`}>
        {filters.searchQuery && (
          <Badge
            variant="secondary"
            className={cn(
              componentPatterns.button.secondary(),
              typography.caption(),
              'flex items-center gap-1 h-6 px-2 rounded-full',
              `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`
            )}
          >
            Search: "{filters.searchQuery}"
            <button
              onClick={() => onRemoveFilter('searchQuery', filters.searchQuery)}
              className={cn(
                'ml-1',
                `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`,
                `hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`,
                'hover:text-destructive'
              )}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {filters.muscleGroups.map((muscle) => (
          <Badge
            key={`muscle-${muscle}`}
            variant="secondary"
            className={cn(
              componentPatterns.button.secondary(),
              typography.caption(),
              'flex items-center gap-1 h-6 px-2 rounded-full',
              `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`
            )}
          >
            💪 {muscle}
            <button
              onClick={() => onRemoveFilter('muscleGroups', muscle)}
              className={cn(
                'ml-1',
                `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`,
                `hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`,
                'hover:text-destructive'
              )}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {filters.equipment.map((eq) => (
          <Badge
            key={`equipment-${eq}`}
            variant="secondary"
            className={cn(
              componentPatterns.button.secondary(),
              typography.caption(),
              'flex items-center gap-1 h-6 px-2 rounded-full',
              `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`
            )}
          >
            🏋️ {eq}
            <button
              onClick={() => onRemoveFilter('equipment', eq)}
              className={cn(
                'ml-1',
                `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`,
                `hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`,
                'hover:text-destructive'
              )}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {filters.difficulty.map((diff) => (
          <Badge
            key={`difficulty-${diff}`}
            variant="secondary"
            className={cn(
              componentPatterns.button.secondary(),
              typography.caption(),
              'flex items-center gap-1 h-6 px-2 rounded-full',
              `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`
            )}
          >
            📊 {diff}
            <button
              onClick={() => onRemoveFilter('difficulty', diff)}
              className={cn(
                'ml-1',
                `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`,
                `hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`,
                'hover:text-destructive'
              )}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {filters.movementPatterns.map((pattern) => (
          <Badge
            key={`pattern-${pattern}`}
            variant="secondary"
            className={cn(
              componentPatterns.button.secondary(),
              typography.caption(),
              'flex items-center gap-1 h-6 px-2 rounded-full',
              `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`
            )}
          >
            🔄 {pattern}
            <button
              onClick={() => onRemoveFilter('movementPatterns', pattern)}
              className={cn(
                'ml-1',
                `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`,
                `hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`,
                'hover:text-destructive'
              )}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}