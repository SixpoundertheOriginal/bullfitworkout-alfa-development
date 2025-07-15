
import { Dumbbell, Weight, Heart, ArrowUpRight } from "lucide-react";
import React from "react";

export interface TrainingTypeObj {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
}

export const trainingTypes: TrainingTypeObj[] = [
  { 
    id: 'strength', 
    name: 'Strength', 
    color: '#6E59A5', 
    icon: React.createElement(Dumbbell, { size: 16 })
  },
  { 
    id: 'hypertrophy', 
    name: 'Hypertrophy', 
    color: '#F472B6', 
    icon: React.createElement(Weight, { size: 16 })
  },
  { 
    id: 'cardio', 
    name: 'Cardio', 
    color: '#EF4444', 
    icon: React.createElement(Heart, { size: 16 })
  },
  { 
    id: 'calisthenics', 
    name: 'Calisthenics', 
    color: '#3B82F6', 
    icon: React.createElement(ArrowUpRight, { size: 16 })
  },
  { 
    id: 'stretching', 
    name: 'Stretching', 
    color: '#14B8A6', 
    icon: React.createElement(ArrowUpRight, { size: 16 })
  },
  { 
    id: 'yoga', 
    name: 'Yoga', 
    color: '#22C55E', 
    icon: React.createElement(ArrowUpRight, { size: 16 })
  }
];
