import { gradients, effects } from '@/utils/tokenUtils';
import { designTokens } from '@/designTokens';

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
          <div className="relative flex items-center justify-center">
            {index === currentStep && (
              <span
                aria-hidden="true"
                className={`absolute -inset-1 rounded-full bg-gradient-to-r ${gradients.brand.primary()} opacity-75 ${effects.glow.subtle()} ${designTokens.animations.pulse.glow}`}
              />
            )}
            <div
              className={`relative w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all transform ${
                index <= currentStep
                  ? `bg-gradient-to-r ${gradients.brand.primary()} text-white ${effects.glow.subtle()}`
                  : 'bg-zinc-700 text-zinc-400'
              } ${index === currentStep ? `${designTokens.animations.pulse.scale} scale-105` : ''}`}
              aria-current={index === currentStep ? 'step' : undefined}
            >
              {index + 1}
            </div>
          </div>
          {index < totalSteps - 1 && (
            <div className="relative w-12 h-0.5 mx-2 rounded-full bg-zinc-700 overflow-hidden">
              <div
                className={`absolute inset-0 transition-all duration-300 ${
                  index < currentStep
                    ? `bg-gradient-to-r ${gradients.brand.primary()}`
                    : 'bg-zinc-700'
                } ${index < currentStep ? 'w-full' : 'w-0'}`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default WizardProgress;
