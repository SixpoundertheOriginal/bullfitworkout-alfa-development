import React, { useState, useEffect, useRef } from 'react';
import { TrainingFocusSelector } from './TrainingFocusSelector';
import {
  ArrowUp,
  ArrowDown,
  Dumbbell,
  Zap,
  Target,
  Heart,
  Shield,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  componentPatterns,
  typography,
  effects,
  gradients,
  brandColors,
  surfaceColors,
} from '@/utils/tokenUtils';
import WizardProgress from './WizardProgress';
import { useWorkoutSetupContext } from '@/context/WorkoutSetupContext';
import { SETUP_CHOOSE_EXERCISES_ENABLED } from '@/constants/featureFlags';
import {
  TrainingFocus,
  TrainingGoals,
  EnhancedTrainingConfig,
} from '@/types/training-setup';
import { BackButton } from '@/components/ui/BackButton';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

// Dev-only feature flag exposure
if (typeof window !== 'undefined') {
  (window as any).__DEBUG_FLAGS__ = { SETUP_CHOOSE_EXERCISES_ENABLED };
}

interface EnhancedWorkoutSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (config: EnhancedTrainingConfig) => void;
  onChooseExercises?: (focus: TrainingFocus, subFocus?: string) => void;
}

const DEFAULT_TRAINING_GOALS: TrainingGoals = {
  targetTonnage: 4000,
  tonnageLevel: 'Moderate',
  timeBudget: 45,
  structure: 'Straight Sets',
  repRange: 'Hypertrophy (8-12)',
  restStyle: 'Adaptive',
  includeIsometrics: false,
  includeUnilateral: false,
  includeCore: false,
};

const FOCUS_ICONS: Record<TrainingFocus['category'], React.ReactNode> = {
  Push: <ArrowUp className="h-5 w-5" />,
  Pull: <ArrowDown className="h-5 w-5" />,
  Legs: <Dumbbell className="h-5 w-5" />,
  'Full Body': <Zap className="h-5 w-5" />,
  Arms: <Target className="h-5 w-5" />,
  Core: <Heart className="h-5 w-5" />,
  'Deload / Rehab': <Shield className="h-5 w-5" />,
};

const StepTransition = ({
  step,
  children,
}: {
  step: number;
  children: React.ReactNode;
}) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={step}
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col flex-1"
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

export function EnhancedWorkoutSetupWizard({
  open,
  onOpenChange,
  onComplete,
  onChooseExercises,
}: EnhancedWorkoutSetupWizardProps) {
  const { state, actions } = useWorkoutSetupContext();
  const { currentStep: step, selectedFocus, selectedSubFocus } = state;
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      setHeaderHeight(headerRef.current?.offsetHeight ?? 0);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [step, open]);

  useEffect(() => {
    if (open) {
      console.info('[DEBUG] Wizard opened, flags:', { SETUP_CHOOSE_EXERCISES_ENABLED });
      actions.reset();
      setIsGenerating(false);
      setIsSubmitting(false);
    }
  }, [open]);

  const runSmartPlan = async (focus: TrainingFocus, subFocus?: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setIsGenerating(true);

    try {
      console.info('[DEBUG] Generating smart plan for:', focus.category);
      
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const estimatedCalories = Math.round(
        DEFAULT_TRAINING_GOALS.targetTonnage * 0.05,
      );
      const estimatedXP = Math.round(
        DEFAULT_TRAINING_GOALS.targetTonnage * 0.01 +
          DEFAULT_TRAINING_GOALS.timeBudget * 2,
      );

      const smartSuggestions = [
        `Based on your ${focus.category} focus, we recommend starting with compound movements`,
        `${DEFAULT_TRAINING_GOALS.tonnageLevel} tonnage target of ${DEFAULT_TRAINING_GOALS.targetTonnage}kg is optimal for progression`,
        `${DEFAULT_TRAINING_GOALS.structure} approach will maximize your ${DEFAULT_TRAINING_GOALS.timeBudget}-minute time budget`,
        subFocus && `${subFocus} specialization will enhance your training results`,
      ].filter(Boolean) as string[];

      const config: EnhancedTrainingConfig = {
        focus,
        goals: DEFAULT_TRAINING_GOALS,
        estimatedCalories,
        estimatedXP,
        smartSuggestions,
      };

      // Telemetry
      console.log('setup_mode_selected', { focus: focus.category, mode: 'smart' });

      onComplete(config);
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating smart plan:', error);
      // Keep wizard open but reset state
    } finally {
      setIsGenerating(false);
      setIsSubmitting(false);
    }
  };

  const handleFocusSelect = (focus: TrainingFocus, subFocus?: string) => {
    console.log('setup_focus_selected', { focus: focus.category });
    console.info('[DEBUG] onFocusChosen:', focus.category, subFocus);
    
    actions.setSelectedFocus(focus);
    if (subFocus) actions.setSelectedSubFocus(subFocus);

    if (SETUP_CHOOSE_EXERCISES_ENABLED) {
      actions.nextStep();
    } else {
      // Legacy: immediately run smart plan
      runSmartPlan(focus, subFocus);
    }
  };

  const handleGenerateSmartProgram = () => {
    if (!selectedFocus || isSubmitting) return;
    console.info('[DEBUG] Step 2: Generate Smart Program clicked');
    runSmartPlan(selectedFocus, selectedSubFocus);
  };

  const handleChooseExercises = () => {
    if (!selectedFocus || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      console.log('setup_mode_selected', { focus: selectedFocus.category, mode: 'choose_exercises' });
      console.info('[DEBUG] Step 2: Choose Exercises clicked');
      
      // Close wizard first, then open sheet to avoid overlay stacking
      onOpenChange(false);
      
      setTimeout(() => {
        onChooseExercises?.(selectedFocus, selectedSubFocus);
      }, 0);
    } catch (error) {
      console.error('Error opening exercise selection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToStep1 = () => {
    console.info('[DEBUG] Back to Step 1');
    actions.previousStep();
    actions.setSelectedFocus(null);
    actions.setSelectedSubFocus('');
  };

  if (!open) return null;

  return (
    <div
      className={`${componentPatterns.modal.overlay()} ${effects.blur.overlay()}`}
      onClick={() => onOpenChange(false)}
    >
      <div
        className={`
          ${componentPatterns.modal.container()}
          relative max-w-2xl w-full max-h-[90vh] overflow-hidden
          bg-gradient-to-br ${gradients.brand.card()}
          ${effects.elevation.enhanced()} border border-white/15
          before:absolute before:inset-0 before:rounded-2xl
          before:bg-gradient-to-br before:from-white/5 before:to-transparent
          before:mix-blend-overlay before:pointer-events-none
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          <WizardProgress
            currentStep={step - 1}
            totalSteps={2}
            steps={[
              { title: 'Focus', completed: step > 1 },
              { title: 'Start', completed: false },
            ]}
          />
          <StepTransition step={step}>
            {step === 1 ? (
              <>
                <div className="relative flex-1">
                  <div
                    ref={headerRef}
                    className={`${componentPatterns.modal.header()} absolute top-0 left-0 right-0 ${surfaceColors.primary()} z-10`}
                  >
                    <h2 className={typography.sectionHeading()}>Workout Setup</h2>
                    <p className={`${typography.bodyText()} text-zinc-400`}>
                      Choose your training focus to get started
                    </p>
                  </div>
                  <div
                    className="h-full overflow-y-auto pb-4"
                    style={{ paddingTop: headerHeight }}
                  >
                    <TrainingFocusSelector
                      selectedFocus={selectedFocus}
                      onSelect={handleFocusSelect}
                    />
                  </div>
                </div>

                <div className="flex-shrink-0 pt-4 border-t">
                  <button
                    className={`${componentPatterns.button.secondary()} w-full`}
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="relative flex-1">
                  <div
                    ref={headerRef}
                    className={`${componentPatterns.modal.header()} absolute top-0 left-0 right-0 ${surfaceColors.primary()} z-10`}
                  >
                    <div className="flex items-center gap-3">
                      <BackButton
                        onClick={handleBackToStep1}
                        aria-label="Back to focus selection"
                      />
                      <div>
                        <h2 className={typography.sectionHeading()}>How would you like to start?</h2>
                        <p className={`${typography.bodyText()} text-zinc-400`}>
                          We can auto-build a proven plan, or you can pick exercises.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="h-full overflow-y-auto pb-4"
                    style={{ paddingTop: headerHeight }}
                  >
                    {selectedFocus && (
                      <div
                        className={`${componentPatterns.cards.metric()} mb-6 flex items-center gap-3`}
                      >
                        <div
                          className={`w-12 h-12 rounded-lg bg-gradient-to-r ${brandColors.gradient()} flex items-center justify-center`}
                        >
                          {FOCUS_ICONS[selectedFocus.category]}
                        </div>
                        <div>
                          <div className="text-sm text-white/80">Selected Focus</div>
                          <div className="font-medium text-white">{selectedFocus.category}</div>
                          {selectedSubFocus && (
                            <div className="text-xs text-white/70">{selectedSubFocus}</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <button
                        onClick={handleGenerateSmartProgram}
                        disabled={isSubmitting}
                        className={`${componentPatterns.cta.primary()} w-full h-14 relative overflow-hidden group flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Generate Smart Program - auto-build a proven workout plan"
                      >
                        <span className="relative z-10">Generate Smart Program</span>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>

                      <button
                        onClick={handleChooseExercises}
                        disabled={isSubmitting}
                        className={`${componentPatterns.cta.primary()} bg-none !bg-white/10 text-white/90 backdrop-blur-sm border border-white/15 w-full h-14 relative overflow-hidden group flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label="Choose Exercises - manually select exercises from library"
                      >
                        <span className="relative z-10">Choose Exercises</span>
                        <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 pt-4 border-t">
                  <button
                    className={`${componentPatterns.button.secondary()} w-full`}
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </StepTransition>
          {isGenerating && <LoadingOverlay />}
        </div>
      </div>
    </div>
  );
}

