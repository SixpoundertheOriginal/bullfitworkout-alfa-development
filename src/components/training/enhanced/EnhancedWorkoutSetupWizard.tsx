import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrainingFocusSelector } from './TrainingFocusSelector';
import { TonnageGoalSelector } from './TonnageGoalSelector';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Trophy,
  Timer,
  Target,
  Zap,
  CheckCircle
} from 'lucide-react';
import { 
  TrainingFocus, 
  TrainingGoals, 
  EnhancedTrainingConfig,
  TRAINING_FOCUSES 
} from '@/types/training-setup';
import { toast } from 'sonner';

interface EnhancedWorkoutSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (config: EnhancedTrainingConfig) => void;
}

enum SetupStep {
  Focus = 0,
  Goals = 1,
  Review = 2
}

const STEP_TITLES = [
  'Training Focus',
  'Goals & Structure', 
  'Review & Start'
];

const STEP_DESCRIPTIONS = [
  'Choose your training split and focus area',
  'Set tonnage targets and workout structure',
  'Review your intelligent workout plan'
];

export function EnhancedWorkoutSetupWizard({ 
  open, 
  onOpenChange, 
  onComplete 
}: EnhancedWorkoutSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>(SetupStep.Focus);
  const [selectedFocus, setSelectedFocus] = useState<TrainingFocus | null>(null);
  const [selectedSubFocus, setSelectedSubFocus] = useState<string>('');
  const [goals, setGoals] = useState<TrainingGoals>({
    targetTonnage: 4000,
    tonnageLevel: 'Moderate',
    timeBudget: 45,
    structure: 'Straight Sets',
    repRange: 'Hypertrophy (8-12)',
    restStyle: 'Adaptive',
    includeIsometrics: false,
    includeUnilateral: false,
    includeCore: true
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const progress = ((currentStep + 1) / 3) * 100;

  useEffect(() => {
    if (open) {
      setCurrentStep(SetupStep.Focus);
      setSelectedFocus(null);
      setSelectedSubFocus('');
      setIsGenerating(false);
    }
  }, [open]);

  const handleFocusSelect = (focus: TrainingFocus, subFocus?: string) => {
    setSelectedFocus(focus);
    setSelectedSubFocus(subFocus || '');
    
    // Auto-advance to next step
    setTimeout(() => {
      setCurrentStep(SetupStep.Goals);
    }, 500);
  };

  const handleGoalsChange = (newGoals: Partial<TrainingGoals>) => {
    setGoals(prev => ({ ...prev, ...newGoals }));
  };

  const handleNext = () => {
    if (currentStep === SetupStep.Focus && !selectedFocus) {
      toast.error('Please select a training focus to continue');
      return;
    }

    if (currentStep < SetupStep.Review) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > SetupStep.Focus) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!selectedFocus) {
      toast.error('Training focus is required');
      return;
    }

    setIsGenerating(true);

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    const estimatedCalories = Math.round(goals.targetTonnage * 0.05);
    const estimatedXP = Math.round(goals.targetTonnage * 0.01 + goals.timeBudget * 2);

    const smartSuggestions = [
      `Based on your ${selectedFocus.category} focus, we recommend starting with compound movements`,
      `Your ${goals.tonnageLevel.toLowerCase()} tonnage target of ${goals.targetTonnage}kg is optimal for progression`,
      `${goals.structure} approach will maximize your ${goals.timeBudget}-minute time budget`,
      selectedSubFocus && `${selectedSubFocus} specialization will enhance your training results`
    ].filter(Boolean) as string[];

    const config: EnhancedTrainingConfig = {
      focus: selectedFocus,  // Changed from trainingFocus to focus
      goals,
      estimatedCalories,
      estimatedXP,
      smartSuggestions
    };

    onComplete(config);
    onOpenChange(false);
    setIsGenerating(false);
  };

  const canProceed = () => {
    switch (currentStep) {
      case SetupStep.Focus:
        return selectedFocus !== null;
      case SetupStep.Goals:
        return goals.targetTonnage > 0 && goals.timeBudget > 0;
      case SetupStep.Review:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case SetupStep.Focus:
        return (
          <TrainingFocusSelector
            selectedFocus={selectedFocus}
            onSelect={handleFocusSelect}
          />
        );
      
      case SetupStep.Goals:
        return (
          <TonnageGoalSelector
            goals={goals}
            onGoalsChange={handleGoalsChange}
            trainingFocus={selectedFocus}
          />
        );
      
      case SetupStep.Review:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span>Training Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Focus</span>
                    <div className="font-medium">{selectedFocus?.category}</div>
                    {selectedSubFocus && (
                      <Badge variant="secondary" className="mt-1">
                        {selectedSubFocus}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Target Tonnage</span>
                    <div className="font-medium">{goals.targetTonnage.toLocaleString()}kg</div>
                    <Badge variant="outline">{goals.tonnageLevel}</Badge>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Time Budget</span>
                    <div className="font-medium">{goals.timeBudget} minutes</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Structure</span>
                    <div className="font-medium">{goals.structure}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Estimated Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{Math.round(goals.targetTonnage * 0.05)}</div>
                    <div className="text-sm text-muted-foreground">Calories</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{Math.round(goals.targetTonnage * 0.01 + goals.timeBudget * 2)}</div>
                    <div className="text-sm text-muted-foreground">XP Points</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{Math.round(goals.targetTonnage / (70 * 10))}</div>
                    <div className="text-sm text-muted-foreground">Est. Sets</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isGenerating && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <span>Generating your intelligent workout plan...</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] rounded-t-xl border-0 bg-background/95 backdrop-blur-md"
      >
        <div className="flex flex-col h-full max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex-shrink-0 space-y-4 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Workout Setup</h1>
                <p className="text-muted-foreground">
                  {STEP_DESCRIPTIONS[currentStep]}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0">
                Step {currentStep + 1} of 3
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{STEP_TITLES[currentStep]}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto pb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-between gap-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === SetupStep.Focus}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-2">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    i <= currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || isGenerating}
              className="flex items-center space-x-2"
            >
              <span>
                {currentStep === SetupStep.Review 
                  ? (isGenerating ? 'Generating...' : 'Start Workout')
                  : 'Next'
                }
              </span>
              {currentStep === SetupStep.Review ? (
                isGenerating ? (
                  <Timer className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}