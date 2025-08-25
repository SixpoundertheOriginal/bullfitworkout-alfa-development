import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { TrainingFocusSelector } from './TrainingFocusSelector';
import { Sparkles } from 'lucide-react';
import {
  TrainingFocus,
  TrainingGoals,
  EnhancedTrainingConfig,
} from '@/types/training-setup';

interface EnhancedWorkoutSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (config: EnhancedTrainingConfig) => void;
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
}: EnhancedWorkoutSetupWizardProps) {
  const [selectedFocus, setSelectedFocus] = useState<TrainingFocus | null>(null);
  const [selectedSubFocus, setSelectedSubFocus] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedFocus(null);
      setSelectedSubFocus('');
      setIsGenerating(false);
    }
  }, [open]);

  const handleFocusSelect = async (focus: TrainingFocus, subFocus?: string) => {
    setSelectedFocus(focus);
    setSelectedSubFocus(subFocus || '');
    setIsGenerating(true);

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

    onComplete(config);
    onOpenChange(false);
    setIsGenerating(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] rounded-t-xl border-0 bg-background/95 backdrop-blur-md"
      >
        <div className="flex flex-col h-full max-w-2xl mx-auto">
          <div className="flex-shrink-0 space-y-4 pt-6 pb-4">
            <div>
              <h1 className="text-2xl font-bold">Workout Setup</h1>
              <p className="text-muted-foreground">
                Choose your training focus to get started
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-4">
            <TrainingFocusSelector
              selectedFocus={selectedFocus}
              onSelect={handleFocusSelect}
            />

            {isGenerating && (
              <Card className="mt-6 bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-center space-x-3">
                  <div className="animate-spin">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <span>Generating your intelligent workout plan...</span>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex-shrink-0 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

