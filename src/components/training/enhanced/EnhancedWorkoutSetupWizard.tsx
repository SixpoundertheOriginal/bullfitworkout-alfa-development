import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { TrainingFocusSelector } from './TrainingFocusSelector';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { componentPatterns, typography } from '@/utils/tokenUtils';
import WizardProgress from './WizardProgress';
import { useWorkoutSetupContext } from '@/context/WorkoutSetupContext';
import { SETUP_CHOOSE_EXERCISES_ENABLED } from '@/constants/featureFlags';
import {
  TrainingFocus,
  TrainingGoals,
  EnhancedTrainingConfig,
} from '@/types/training-setup';

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] rounded-t-xl border-0 bg-background/95 backdrop-blur-md"
      >
        <div className="flex flex-col h-full max-w-2xl mx-auto">
          <WizardProgress
            currentStep={step - 1}
            totalSteps={2}
            steps={[
              { title: 'Focus', completed: step > 1 },
              { title: 'Start', completed: false },
            ]}
          />
          {step === 1 ? (
            <>
              <div className="flex-shrink-0 pt-6 pb-4">
                <div className={componentPatterns.modal.header()}>
                  <h2 className={typography.sectionHeading()}>Workout Setup</h2>
                  <p className={`${typography.bodyText()} text-zinc-400`}>
                    Choose your training focus to get started
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pb-4">
                <TrainingFocusSelector
                  selectedFocus={selectedFocus}
                  onSelect={handleFocusSelect}
                />
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
              <div className="flex-shrink-0 pt-6 pb-4">
                <div className={componentPatterns.modal.header()}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBackToStep1}
                      className={componentPatterns.button.ghost() + ' p-2'}
                      aria-label="Back to focus selection"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                      <h2 className={typography.sectionHeading()}>How would you like to start?</h2>
                      <p className={`${typography.bodyText()} text-zinc-400`}>
                        We can auto-build a proven plan, or you can pick exercises.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pb-4">
                {selectedFocus && (
                  <Card className="mb-6 bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Selected Focus</div>
                      <div className="font-medium">{selectedFocus.category}</div>
                      {selectedSubFocus && (
                        <div className="text-sm text-muted-foreground">{selectedSubFocus}</div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  <button
                    onClick={handleGenerateSmartProgram}
                    disabled={isSubmitting}
                    className={`${componentPatterns.button.primary()} h-14 w-full relative`}
                    aria-label="Generate Smart Program - auto-build a proven workout plan"
                  >
                    {isGenerating && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <span className={isGenerating ? 'opacity-0' : ''}>
                      Generate Smart Program
                    </span>
                  </button>

                  <button
                    onClick={handleChooseExercises}
                    disabled={isSubmitting}
                    className={`${componentPatterns.button.secondary()} w-full h-14`}
                    aria-label="Choose Exercises - manually select exercises from library"
                  >
                    Choose Exercises
                  </button>
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
        </div>
      </SheetContent>
    </Sheet>
  );
}

