import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QuickStatsSection } from "@/components/metrics/QuickStatsSection";
import { WeeklySummaryStats } from "@/components/WeeklySummaryStats";
import { EnhancedWorkoutSetupWizard } from "@/components/training/enhanced/EnhancedWorkoutSetupWizard";
import { SmartTemplateService } from "@/services/SmartTemplateService";
import { useAuth } from "@/context/AuthContext";
import { useWorkoutStats } from "@/hooks/useWorkoutStats";
import { ExploreSection } from "@/components/ExploreSection";
import { toast } from "@/hooks/use-toast";
import { StartTrainingButton } from "@/components/training/StartTrainingButton";
import { motion } from "framer-motion";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { useWorkoutStore } from "@/store/workoutStore";
import { DateRangeProvider } from "@/context/DateRangeContext";

const Index = () => {
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const { stats } = useWorkoutStats();
  const { isActive, lastActiveRoute } = useWorkoutStore();
  const { user } = useAuth();
  
  // Replace useElementVisibility with native IntersectionObserver
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSectionVisible(entry.isIntersecting);
      },
      { threshold: 0.5, rootMargin: "-100px" }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.disconnect();
      }
    };
  }, []);
  
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Check for active workout to show continue option
  useEffect(() => {
    if (isActive) {
      toast({
        title: "Workout in progress",
        description: "You have an active workout. Click the banner to return.",
      });
    }
  }, [isActive]);

  const handleEnhancedWorkoutComplete = async (config: any) => {
    try {
      if (!user) {
        toast.error("Please log in to create personalized workouts");
        return;
      }

      // Validate required data before attempting smart template generation
      if (!config?.focus || !config?.goals) {
        console.error('Missing required config data:', { focus: !!config?.focus, goals: !!config?.goals });
        toast.error("Incomplete workout configuration. Please try again.");
        return;
      }

      // Generate smart template with AI recommendations
      const smartTemplate = await SmartTemplateService.generateSmartTemplate(
        config.focus,
        config.goals,
        user.id
      );

      toast({
        title: "Smart Workout Generated!",
        description: 
          <div className="flex flex-col">
            <span>{`${config.focus.category} workout with ${smartTemplate.exercises.length} exercises`}</span>
            <div className="flex items-center mt-1 text-xs">
              <div className="h-1.5 w-1.5 bg-green-400 rounded-full mr-1.5"></div>
              <span className="text-green-400">Estimated: {smartTemplate.estimatedTonnage}kg tonnage, {smartTemplate.estimatedDuration}min</span>
            </div>
          </div>,
      });
      
      const isFirstWorkoutToday = !stats?.lastWorkoutDate || 
        new Date(stats.lastWorkoutDate).toDateString() !== new Date().toDateString();
        
      if (isFirstWorkoutToday) {
        setShowLevelUp(true);
        
        setTimeout(() => {
          setShowLevelUp(false);
          navigateToTraining(config, smartTemplate);
        }, 2500);
      } else {
        navigateToTraining(config, smartTemplate);
      }
    } catch (error) {
      console.error('Error generating smart workout:', error);
      toast.error("Failed to generate workout. Please try again.");
    }
  };

  const navigateToTraining = (config: any, smartTemplate: any) => {
    navigate('/training-session', { 
      state: { 
        trainingConfig: {
          trainingType: config.focus.category,
          tags: config.focus.subFocus || [],
          duration: config.goals.timeBudget,
          smartTemplate: smartTemplate,
          enhancedConfig: config
        }
      } 
    });
  };

  const handleContinueWorkout = () => {
    if (isActive && lastActiveRoute) {
      navigate(lastActiveRoute);
    }
  };

  const recommendedWorkoutType = stats?.recommendedType || "Strength";
  const recommendedDuration = stats?.recommendedDuration || 45;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-900/98 to-gray-900/95">
      <main className="flex-1 overflow-auto px-4 py-6 space-y-6 mt-12 pb-20">

        {/* <DateRangeProvider>
          <QuickStatsSection />
        </DateRangeProvider> */}

        <section ref={sectionRef} className="mb-40 text-center relative z-10">
          <div style={{ height: "12rem" }} className="relative">
            <div className={cn(
              "absolute left-1/2 transform -translate-x-1/2 transition-all duration-300",
              isSectionVisible ? "scale-100 opacity-100" : "scale-95 opacity-90"
            )}>
              {isActive ? (
                <div className="flex flex-col items-center space-y-4">
                  <StartTrainingButton
                    onClick={handleContinueWorkout}
                    trainingType="Continue"
                    label="Resume"
                  />
                  <button 
                    onClick={() => setWizardOpen(true)}
                    className="text-sm text-white/70 hover:text-white/90 underline"
                  >
                    Start a new workout
                  </button>
                </div>
              ) : (
                <StartTrainingButton
                  onClick={() => setWizardOpen(true)}
                  trainingType={recommendedWorkoutType}
                  label="Start"
                />
              )}
            </div>
          </div>
        </section>

        <div className="mt-32">
          <DateRangeProvider>
            <WeeklySummaryStats />
          </DateRangeProvider>
        </div>

        <ExploreSection />
      </main>

      <EnhancedWorkoutSetupWizard 
        open={wizardOpen} 
        onOpenChange={setWizardOpen} 
        onComplete={handleEnhancedWorkoutComplete} 
      />
      
      <AnimatedLevelUp show={showLevelUp} />
    </div>
  );
};

const AnimatedLevelUp = ({ show }: { show: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm ${!show && 'pointer-events-none'}`}
    >
      {show && (
        <motion.div
          className="flex flex-col items-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <motion.div
            className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4"
            animate={{ 
              scale: [1, 1.2, 1],
              boxShadow: [
                "0 0 20px 0px rgba(168, 85, 247, 0.5)",
                "0 0 30px 5px rgba(168, 85, 247, 0.8)",
                "0 0 20px 0px rgba(168, 85, 247, 0.5)"
              ]
            }}
            transition={{ duration: 2, repeat: 1 }}
          >
            <span className="text-white font-bold text-4xl">
              +1
            </span>
          </motion.div>
          
          <motion.h2
            className="text-white text-3xl font-bold mb-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Level Up!
          </motion.h2>
          
          <motion.p
            className="text-white/80 text-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            First workout of the day
          </motion.p>
          
          <motion.div
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm text-white">
              +50 XP Bonus
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Index;
