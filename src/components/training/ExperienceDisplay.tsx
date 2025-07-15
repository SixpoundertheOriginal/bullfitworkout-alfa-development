
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CircularProgress } from '@/components/ui/circular-progress';
import { typography } from '@/lib/typography';
import { Trophy, Star, TrendingUp, Award } from 'lucide-react';

interface ExperienceDisplayProps {
  level: number;
  xp: number;
  progress: number;
  trainingType?: string;
  className?: string;
}

const typeColors = {
  "Strength": {
    bg: "bg-purple-500",
    text: "text-purple-100",
    border: "border-purple-400",
    progress: "from-purple-600 to-pink-500",
  },
  "Cardio": {
    bg: "bg-red-500",
    text: "text-red-100",
    border: "border-red-400",
    progress: "from-red-600 to-orange-500",
  },
  "Yoga": {
    bg: "bg-green-500",
    text: "text-green-100",
    border: "border-green-400",
    progress: "from-green-600 to-emerald-500",
  },
  "Calisthenics": {
    bg: "bg-blue-500",
    text: "text-blue-100",
    border: "border-blue-400",
    progress: "from-blue-600 to-indigo-500",
  },
  "default": {
    bg: "bg-secondary",
    text: "text-white",
    border: "border-blue-400",
    progress: "from-secondary to-accent",
  }
};

export function ExperienceDisplay({ 
  level, 
  xp, 
  progress, 
  trainingType = "default",
  className 
}: ExperienceDisplayProps) {
  const colors = typeColors[trainingType as keyof typeof typeColors] || typeColors.default;
  
  return (
    <div className={cn(
      "flex flex-col items-center p-4 rounded-lg",
      "bg-gray-900/80 border border-white/10",
      className
    )}>
      <div className="flex items-center justify-center mb-3">
        <Star className="w-4 h-4 mr-1.5 text-yellow-400" />
        <span className={cn(typography.text.primary, "text-lg font-bold")}>Level {level}</span>
      </div>
      
      <motion.div 
        className="relative mb-4"
        initial={{ scale: 0.9, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <CircularProgress 
          value={progress} 
          size={100} 
          strokeWidth={4} 
          animated 
          className={`[&>svg>circle:nth-child(2)]:${colors.bg}`} 
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(typography.text.primary, "font-mono text-sm font-bold")}>
            {Math.round(progress)}%
          </span>
          <span className="text-xs text-white/60">Next Level</span>
        </div>
      </motion.div>
      
      <div className="flex items-center space-x-2 text-white/80">
        <Trophy className="h-4 w-4 text-yellow-500" />
        <span className={cn(typography.text.secondary, "font-mono")}>
          {xp.toLocaleString()} XP
        </span>
      </div>
      
      <div className="w-full mt-4 pt-3 border-t border-gray-800">
        <div className="flex items-center justify-center space-x-1">
          <TrendingUp className="h-3.5 w-3.5 text-white/60" />
          <span className="text-xs text-white/60">
            +{level * 5} XP per workout
          </span>
        </div>
      </div>

      {level >= 5 && (
        <div className="mt-3 flex items-center justify-center">
          <Award className="h-4 w-4 text-amber-500 mr-1" />
          <span className="text-xs text-amber-500/90 font-medium">Achievement Unlocked</span>
        </div>
      )}
    </div>
  );
}
