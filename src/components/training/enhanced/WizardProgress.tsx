import { brandColors, componentPatterns } from '@/utils/tokenUtils';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: { title: string; completed: boolean }[];
}

export const WizardProgress = ({ currentStep, totalSteps, steps }: WizardProgressProps) => {
  return (
    <div className="flex items-center justify-center mb-6 px-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              index <= currentStep
                ? `bg-gradient-to-r ${brandColors.gradient()} text-white`
                : 'bg-zinc-700 text-zinc-400'
            }`}
          >
            {index + 1}
          </div>
          {index < totalSteps - 1 && (
            <div
              className={`w-12 h-0.5 mx-2 ${index < currentStep ? 'bg-purple-600' : 'bg-zinc-700'}`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default WizardProgress;
