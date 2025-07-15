import React from 'react';
import { Button } from '@/components/ui/button';
import { MuscleGroup, EquipmentType, Difficulty, MovementPattern } from '@/types/exercise';

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
      movementPatterns: ['isometric', 'rotation']
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
    <div className="mb-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">Quick Filters</h3>
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((preset) => (
          <Button
            key={preset.name}
            variant={isPresetActive(preset) ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetClick(preset)}
            className={`
              flex items-center gap-2 h-8 px-3 text-xs
              ${isPresetActive(preset) 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-background border-border hover:bg-accent'
              }
            `}
          >
            <span>{preset.icon}</span>
            {preset.name}
          </Button>
        ))}
      </div>
    </div>
  );
}