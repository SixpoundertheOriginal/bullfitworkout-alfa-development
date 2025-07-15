
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Award, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { typography } from "@/lib/typography";

interface TrainingAchievementCardProps {
  show: boolean;
  trainingType: string;
  onClose: () => void;
}

const achievementVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      type: "spring",
      stiffness: 200,
      damping: 20
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    y: 20,
    transition: {
      duration: 0.3
    }
  }
};

export const TrainingAchievementCard = ({ 
  show, 
  trainingType,
  onClose 
}: TrainingAchievementCardProps) => {
  
  // Get achievement details based on training type
  const getAchievementDetails = () => {
    switch(trainingType) {
      case "Strength":
        return {
          title: "Power Unleashed",
          description: "You've unlocked the Strength training path",
          icon: <Trophy className="h-10 w-10 text-yellow-400" />,
          color: "from-purple-600 to-pink-600",
          reward: "+15 XP"
        };
      case "Cardio":
        return {
          title: "Endurance Master",
          description: "You've unlocked the Cardio training path",
          icon: <Star className="h-10 w-10 text-red-400" />,
          color: "from-red-600 to-orange-600",
          reward: "+15 XP"
        };
      case "Yoga":
        return {
          title: "Mind-Body Harmony",
          description: "You've unlocked the Yoga training path",
          icon: <Award className="h-10 w-10 text-green-400" />,
          color: "from-green-600 to-teal-600",
          reward: "+15 XP"
        };
      case "Calisthenics":
        return {
          title: "Body Control",
          description: "You've unlocked the Calisthenics training path",
          icon: <Medal className="h-10 w-10 text-blue-400" />,
          color: "from-blue-600 to-indigo-600",
          reward: "+15 XP"
        };
      default:
        return {
          title: "New Path Unlocked",
          description: `You've unlocked the ${trainingType} training path`,
          icon: <Trophy className="h-10 w-10 text-yellow-400" />,
          color: "from-purple-600 to-pink-600",
          reward: "+15 XP"
        };
    }
  };
  
  const details = getAchievementDetails();
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className={cn(
              "bg-gradient-to-br rounded-xl p-6 shadow-lg",
              "max-w-xs w-full text-center",
              "backdrop-blur-sm border border-white/20",
              "pointer-events-auto",
              `bg-gradient-to-br ${details.color}`
            )}
            variants={achievementVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden rounded-xl">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -Math.random() * 30 - 10],
                    opacity: [0, 0.5, 0],
                    scale: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </div>
            
            <div className="relative z-10">
              {/* Icon with glow */}
              <motion.div
                className="mx-auto mb-4 relative"
                animate={{ 
                  y: [0, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                <div className="absolute inset-0 opacity-50 blur-lg">
                  {details.icon}
                </div>
                {details.icon}
              </motion.div>
              
              {/* Title with special styling */}
              <motion.h3
                className={cn(typography.headings.primary, "text-xl mb-2")}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {details.title}
              </motion.h3>
              
              {/* Description */}
              <motion.p
                className={cn(typography.text.secondary, "mb-4")}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {details.description}
              </motion.p>
              
              {/* Reward */}
              <motion.div
                className="inline-block px-4 py-2 bg-black/30 rounded-full mb-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                <span className={cn(typography.text.primary, "font-mono")}>
                  {details.reward}
                </span>
              </motion.div>
              
              {/* Close button */}
              <motion.button
                className={cn(
                  "block w-full py-2 px-4 rounded-lg",
                  "bg-white/10 hover:bg-white/20",
                  "transition-colors duration-200",
                  "backdrop-blur-sm",
                  typography.text.primary
                )}
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
