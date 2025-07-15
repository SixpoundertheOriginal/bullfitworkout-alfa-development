
import React from 'react';
import { cn } from "@/lib/utils";

export type TrainingType = 'Strength' | 'Hypertrophy' | 'Cardio' | 'Calisthenics' | 'Stretching' | 'Yoga';

interface TrainingTypeTagProps {
  type: TrainingType;
  className?: string;
  size?: 'sm' | 'default';
  variant?: 'default' | 'large';
}

const typeStyles: Record<TrainingType, string> = {
  'Strength': 'bg-purple-500/20 text-purple-200 border-purple-500/30 hover:bg-purple-500/30',
  'Hypertrophy': 'bg-pink-500/20 text-pink-200 border-pink-500/30 hover:bg-pink-500/30',
  'Cardio': 'bg-red-500/20 text-red-200 border-red-500/30 hover:bg-red-500/30',
  'Calisthenics': 'bg-blue-500/20 text-blue-200 border-blue-500/30 hover:bg-blue-500/30',
  'Stretching': 'bg-teal-500/20 text-teal-200 border-teal-500/30 hover:bg-teal-500/30',
  'Yoga': 'bg-green-500/20 text-green-200 border-green-500/30 hover:bg-green-500/30'
};

export const TrainingTypeTag = ({ type, className, size = 'default', variant = 'default' }: TrainingTypeTagProps) => {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border transition-colors",
      size === 'sm' ? "px-2 py-0.5 text-xs font-medium" : 
      variant === 'default' ? "px-2.5 py-0.5 text-xs font-medium" : "px-4 py-2 text-sm font-semibold",
      typeStyles[type],
      className
    )}>
      {type}
    </span>
  );
};

export const trainingTypes: TrainingType[] = [
  'Strength',
  'Hypertrophy',
  'Cardio',
  'Calisthenics',
  'Stretching',
  'Yoga'
];

export function isValidTrainingType(type: string): type is TrainingType {
  return trainingTypes.includes(type as TrainingType);
}
