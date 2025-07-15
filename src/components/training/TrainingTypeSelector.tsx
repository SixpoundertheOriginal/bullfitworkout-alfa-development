
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Dumbbell, Bike, Heart, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { typography } from '@/lib/typography';
import { useIsMobile } from "@/hooks/use-mobile";
import { CircularProgress } from "@/components/ui/circular-progress";

interface TrainingTypeSelectorProps {
  selectedType: string;
  onSelect: (type: string) => void;
}

type TrainingType = {
  name: string;
  icon: React.ReactNode;
  color: string;
  activeColor: string;
  description: string;
  level: number;
  xp: number;
};

const TRAINING_TYPES: TrainingType[] = [
  {
    name: "Strength",
    icon: <Dumbbell className="h-6 w-6" />,
    color: "bg-purple-500/80",
    activeColor: "bg-purple-500",
    description: "Build muscle & increase power",
    level: 2,
    xp: 65,
  },
  {
    name: "Cardio",
    icon: <Bike className="h-6 w-6" />,
    color: "bg-red-500/80",
    activeColor: "bg-red-500",
    description: "Boost endurance & heart health",
    level: 1,
    xp: 30,
  },
  {
    name: "Yoga",
    icon: <Heart className="h-6 w-6" />,
    color: "bg-green-500/80",
    activeColor: "bg-green-500",
    description: "Flow & mindfulness",
    level: 3,
    xp: 85,
  },
  {
    name: "Calisthenics",
    icon: <Activity className="h-6 w-6" />,
    color: "bg-blue-500/80",
    activeColor: "bg-blue-500",
    description: "Master bodyweight skills",
    level: 1,
    xp: 45,
  },
];

// Map of color gradients for each training type
const TYPE_GRADIENTS = {
  "Strength": "from-purple-600/15 via-purple-500/10 to-purple-400/5",
  "Cardio": "from-red-600/15 via-red-500/10 to-red-400/5",
  "Yoga": "from-green-600/15 via-green-500/10 to-green-400/5",
  "Calisthenics": "from-blue-600/15 via-blue-500/10 to-blue-400/5"
};

const TYPE_ACCENT_COLORS = {
  "Strength": "border-purple-500/30",
  "Cardio": "border-red-500/30",
  "Yoga": "border-green-500/30",
  "Calisthenics": "border-blue-500/30"
};

const TYPE_TEXT_COLORS = {
  "Strength": "text-purple-200",
  "Cardio": "text-red-200",
  "Yoga": "text-green-200",
  "Calisthenics": "text-blue-200"
};

export function TrainingTypeSelector({ selectedType, onSelect }: TrainingTypeSelectorProps) {
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const selectedTrainingTypeData = TRAINING_TYPES.find(
    (type) => type.name === selectedType
  ) || TRAINING_TYPES[0];

  const displayedType =
    hoveredType
      ? TRAINING_TYPES.find((type) => type.name === hoveredType)
      : selectedTrainingTypeData;

  // Decreased radius slightly to ensure icons fit within the containing view
  // Changed from 102 to 98 to prevent bottom icon from being cut off
  const BUTTON_RADIUS = 98; 

  // Calculate XP progress as a percentage (assumed max level is 100 XP)
  const xpProgress = displayedType ? Math.min(displayedType.xp, 100) : 0;

  return (
    <div
      className={cn(
        "relative w-full max-w-[340px] mx-auto aspect-square flex items-center justify-center",
        // Added overflow-visible to ensure buttons don't get clipped
        "overflow-visible mb-6" // Added bottom margin to provide more space
      )}
      style={{
        // Make sure mobile allows vertical overflow (for scroll) and radial for desktop
        minHeight: isMobile ? 300 : 0, // Increased from 280 to 300
      }}
    >
      <div className={cn(
        "absolute w-40 h-40 rounded-full",
        "bg-gray-800/90 border border-white/10",
        "flex flex-col items-center justify-center z-20 overflow-visible",
        "transition-all duration-300",
        displayedType && TYPE_ACCENT_COLORS[displayedType.name],
        "shadow-lg"
      )}>
        {/* Circle gradient background */}
        <div className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-b opacity-50",
          displayedType && TYPE_GRADIENTS[displayedType.name]
        )} />
        
        {/* XP Progress Ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <CircularProgress 
            value={xpProgress} 
            size={160} 
            strokeWidth={3} 
            className="text-gray-700 [&>svg>circle:nth-child(2)]:text-purple-500/70"
          />
        </div>
        
        {/* Animated pulse effect */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-0"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "loop"
          }}
        />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={displayedType?.name}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.23 }}
            className="flex flex-col items-center text-center px-5"
          >
            {/* Training type icon */}
            <div className={cn(
              "flex items-center justify-center mb-1.5",
              "text-white/90"
            )}>
              {displayedType && React.cloneElement(displayedType.icon as React.ReactElement, { 
                className: "h-5 w-5" 
              })}
            </div>
            
            {/* Training type name */}
            <span className={cn(
              "text-xl font-medium text-white mb-1",
              displayedType && TYPE_TEXT_COLORS[displayedType.name]
            )}>
              {displayedType?.name}
            </span>
            
            {/* Level indicator */}
            <div className="flex items-center space-x-1 mb-1.5">
              <span className="text-white/70 text-xs">Lvl</span>
              <span className="text-white font-medium text-sm">
                {displayedType?.level || 1}
              </span>
            </div>
            
            {/* XP display */}
            <div className="text-xs text-white/60">
              <span className="font-mono">{displayedType?.xp || 0}</span> XP
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {TRAINING_TYPES.map((type, index) => {
        const totalTypes = TRAINING_TYPES.length;
        // Adjust angle calculation to position buttons better
        const angle = ((index * (360 / totalTypes)) - 90) * (Math.PI / 180);

        const x = Math.cos(angle) * BUTTON_RADIUS;
        const y = Math.sin(angle) * BUTTON_RADIUS;

        const isSelected = selectedType === type.name;
        const isHovered = hoveredType === type.name;

        return (
          <motion.button
            key={type.name}
            onClick={() => onSelect(type.name)}
            onMouseEnter={() => setHoveredType(type.name)}
            onMouseLeave={() => setHoveredType(null)}
            // Enhanced transition/scale effect on hover
            className={cn(
              "absolute w-14 h-14 rounded-full flex items-center justify-center",
              "transition-all duration-200 z-30 overflow-visible",
              isSelected || isHovered
                ? [
                    type.activeColor,
                    "ring-2 ring-white/20 ring-offset-2 ring-offset-gray-900"
                  ]
                : [
                    type.color,
                    "hover:ring-2 hover:ring-white/10 hover:ring-offset-2 hover:ring-offset-gray-900"
                  ]
            )}
            style={{
              left: `calc(50% + ${x}px - 28px)`,
              top: `calc(50% + ${y}px - 28px)`,
              transform: isHovered
                ? 'scale(1.13)'
                : isSelected
                  ? 'scale(1.08)'
                  : 'scale(1)',
            }}
            whileHover={{ scale: 1.13 }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: "spring", stiffness: 320, damping: 25 }}
          >
            {type.icon}
          </motion.button>
        );
      })}
    </div>
  );
}
