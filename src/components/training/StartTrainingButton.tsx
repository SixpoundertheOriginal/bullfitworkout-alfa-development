import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { CircularGradientButton } from '@/components/CircularGradientButton';
import { cn } from '@/lib/utils';
import { useWorkoutState } from '@/hooks/useWorkoutState';
import { toast } from '@/hooks/use-toast';

interface StartTrainingButtonProps {
  trainingType?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link' | 'gradient' | 'icon-circle' | 'nav-action';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  label?: string;
  forceReset?: boolean;
  onClick?: () => void;
  workoutType?: string;
  duration?: number;
}

export const StartTrainingButton = ({
  trainingType = 'strength',
  className = '',
  label = 'Start Training',
  forceReset = true,
  onClick
}: StartTrainingButtonProps) => {
  const navigate = useNavigate();
  const { startWorkout, updateLastActiveRoute } = useWorkoutState();
  
  const handleStartClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    
    // If forceReset is true, we'll navigate with the reset parameter
    if (forceReset) {
      navigate(`/training-session?type=${trainingType}&reset=true`, {
        state: { trainingType }
      });
      return;
    }
    
    // Otherwise start workout normally
    startWorkout();
    updateLastActiveRoute('/training-session');
    
    navigate(`/training-session?type=${trainingType}`, {
      state: { trainingType }
    });
    
    toast({
      title: "Workout started!"
    });
  };
  
  return (
    <div className="py-8 px-6"> {/* Premium spacing container */}
      <div 
        onClick={handleStartClick}
        className={cn(
          "relative flex items-center justify-center cursor-pointer group",
          "w-64 h-64 mx-auto my-8", // Large size with vertical margins
          "transition-all duration-300 ease-out",
          "hover:scale-[1.02] active:scale-[0.95]", // Micro-interactions
          className
        )}
        style={{
          filter: 'drop-shadow(0 20px 40px rgba(139, 92, 246, 0.15)) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1))'
        }}
      >
        {/* Background glow effect */}
        <div 
          className="absolute inset-0 rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(236,72,153,0.2) 40%, transparent 70%)',
            filter: 'blur(20px)',
            transform: 'scale(1.2)'
          }}
        />
        
        {/* Outer progress ring with sophisticated gradient */}
        <div 
          className="absolute inset-0 rounded-full p-3 group-hover:rotate-12 transition-transform duration-700 ease-out"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%)',
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 8s ease infinite'
          }}
        >
          {/* Inner glassmorphism container */}
          <div 
            className="w-full h-full rounded-full relative overflow-hidden"
            style={{
              background: 'rgba(17, 24, 39, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Inner highlight gradient */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
                mixBlendMode: 'overlay'
              }}
            />
            
            {/* Inner shadow for depth */}
            <div 
              className="absolute inset-2 rounded-full"
              style={{
                boxShadow: 'inset 0 4px 20px rgba(0, 0, 0, 0.3), inset 0 -4px 10px rgba(139, 92, 246, 0.1)'
              }}
            />
            
            {/* Content container */}
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center transform group-active:scale-95 transition-transform duration-150">
                <div 
                  className="text-white font-bold mb-2 tracking-wide"
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    letterSpacing: '0.05em',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  {label}
                </div>
                {trainingType !== "Continue" && (
                  <div 
                    className="text-white/70 font-medium tracking-wider"
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: '500',
                      letterSpacing: '0.1em',
                      opacity: '0.8'
                    }}
                  >
                    {trainingType}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional outer glow for premium feel */}
        <div 
          className="absolute inset-0 rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-500"
          style={{
            background: 'conic-gradient(from 0deg, #8B5CF6, #EC4899, #F97316, #8B5CF6)',
            filter: 'blur(30px)',
            transform: 'scale(1.4)',
            zIndex: -1
          }}
        />
      </div>
      
    </div>
  );
};
