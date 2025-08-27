import React from 'react';
import { Button } from '@/components/ui/button';
import { MuscleGroup, EquipmentType, Difficulty, MovementPattern } from '@/types/exercise';
import { cn } from '@/lib/utils';
import { componentPatterns, typography, effects } from '@/utils/tokenUtils';
import { designTokens } from '@/designTokens';

export interface FilterState {
  muscleGroups: MuscleGroup[];
  equipment: EquipmentType[];
  difficulty: Difficulty[];
  movementPatterns: MovementPattern[];
  searchQuery: string;
}

export interface QuickFilter {
  name: string;
  icon: string;
  filters: Partial<FilterState>;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    name: "Upper Body",
    icon: "💪",
    filters: { 
      muscleGroups: ['chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps'],
      difficulty: ['intermediate', 'advanced']
    }
  },
  {
    name: "Home Workout",
    icon: "🏠", 
    filters: {
      equipment: ['bodyweight', 'dumbbell'],
      muscleGroups: ['full body']
    }
  },
  {
    name: "Quick Cardio",
    icon: "❤️",
    filters: {
      muscleGroups: ['cardio'],
      equipment: ['bodyweight'],
      difficulty: ['beginner', 'intermediate']
    }
  },
  {
    name: "Core Focus",
    icon: "⚡",
    filters: {
      muscleGroups: ['core', 'abs', 'obliques'],
      movementPatterns: ['isometric', 'core']
    }
  },
  {
    name: "Lower Body",
    icon: "🦵",
    filters: {
      muscleGroups: ['legs', 'glutes', 'hamstrings', 'quads', 'calves'],
      movementPatterns: ['squat', 'hinge', 'lunge']
    }
  },
  {
    name: "Strength",
    icon: "🏋️",
    filters: {
      equipment: ['barbell', 'dumbbell', 'kettlebell'],
      difficulty: ['intermediate', 'advanced'],
      movementPatterns: ['push', 'pull', 'squat', 'hinge']
    }
  }
];

interface FilterPresetsProps {
  onApplyFilter: (filters: Partial<FilterState>) => void;
  activeFilters: FilterState;
}

export function FilterPresets({ onApplyFilter, activeFilters }: FilterPresetsProps) {
  const handlePresetClick = (preset: QuickFilter) => {
    onApplyFilter(preset.filters);
  };

  const isPresetActive = (preset: QuickFilter): boolean => {
    const { filters } = preset;
    
    // Check if any of the preset's filter categories match the active filters
    let matches = 0;
    let total = 0;
    
    if (filters.muscleGroups) {
      total++;
      const hasMatch = filters.muscleGroups.some(mg => activeFilters.muscleGroups.includes(mg));
      if (hasMatch) matches++;
    }
    
    if (filters.equipment) {
      total++;
      const hasMatch = filters.equipment.some(eq => activeFilters.equipment.includes(eq));
      if (hasMatch) matches++;
    }
    
    if (filters.difficulty) {
      total++;
      const hasMatch = filters.difficulty.some(diff => activeFilters.difficulty.includes(diff));
      if (hasMatch) matches++;
    }
    
    if (filters.movementPatterns) {
      total++;
      const hasMatch = filters.movementPatterns.some(mp => activeFilters.movementPatterns.includes(mp));
      if (hasMatch) matches++;
    }
    
    // Consider preset active if at least 50% of its filters match
    return total > 0 && (matches / total) >= 0.5;
  };

  return (
      <div className={`mb-[${designTokens.spacing.lg}]`}>
        <h3
          className={cn(
            typography.sectionHeading(),
            `mb-[${designTokens.spacing.sm}]`
          )}
        >
          Quick Filters
        </h3>
        <div className={`flex flex-wrap gap-[${designTokens.spacing.sm}]`}>
          {QUICK_FILTERS.map((preset) => (
            <Button
              key={preset.name}
              variant="ghost"
              size="sm"
              onClick={() => handlePresetClick(preset)}
              className={cn(
                componentPatterns.button.secondary(),
                typography.bodySmall(),
                'flex items-center gap-2 h-8 px-3',
                `transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}`,
                `hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}`,
                isPresetActive(preset) && `bg-gradient-to-r from-purple-600 to-pink-500 text-white ${effects.glow.purple()}`
              )}
            >
              <span>{preset.icon}</span>
              {preset.name}
            </Button>
          ))}
      </div>
    </div>
  );
}