import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { CircularGradientButton } from '@/components/CircularGradientButton';
import { cn } from '@/lib/utils';
import { useWorkoutStore } from '@/store/workoutStore';
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
  const { startWorkout, updateLastActiveRoute } = useWorkoutStore();
  const [isTouched, setIsTouched] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const handleStartClick = () => {
    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 30, 100]); // Strong, confident vibration pattern
    }
    
    if (onClick) {
      onClick();
      return;
    }
    
    // Set pressed state for animation
    setIsPressed(true);
    
    // Delay navigation to let animation play
    setTimeout(() => {
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
    }, 1500); // 1.5 second delay for animation
  };

  const handleTouchStart = () => {
    setIsTouched(true);
  };

  const handleTouchEnd = () => {
    setIsTouched(false);
  };
  
  return (
    <div className="py-8 px-6"> {/* Premium spacing container */}
      <style>{`@media (prefers-reduced-motion: reduce) { .ring-animate { animation: none !important; transition: none !important; } }`}</style>
      <div
        onClick={handleStartClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "relative flex items-center justify-center cursor-pointer group w-64 h-64 mx-auto my-8",
          className
        )}
      >
        {/* Background glow effect */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-full z-0 opacity-50 transition-all duration-700 group-active:duration-75 ring-animate",
            "group-hover:opacity-90 group-active:opacity-100",
            // Mobile touch states
            isTouched && "opacity-90"
          )}
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(236,72,153,0.3) 40%, transparent 70%)',
            filter: 'blur(25px)',
            transform: 'scale(1.2)',
            animation: 'pulse 4s ease-in-out infinite'
          }}
        />

        {/* Intense press glow burst */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-full z-0 opacity-0 transition-all duration-75",
            "group-active:opacity-100",
            // Mobile touch burst effect
            isTouched && "opacity-100"
          )}
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.8) 0%, rgba(236,72,153,0.6) 30%, rgba(249,115,22,0.4) 60%, transparent 80%)',
            filter: 'blur(35px)',
            transform: 'scale(1.5)'
          }}
        />
        
        {/* Outer progress ring with sophisticated gradient */}
        <div
          className={cn(
            "absolute inset-0 z-10 rounded-full p-3 transition-all duration-700 ease-out group-active:duration-100 ring-animate transform-gpu",
            "group-hover:rotate-12 group-active:rotate-6 group-hover:scale-[1.05] group-active:scale-[0.95]",
            // Mobile touch rotation and scale
            isTouched && "rotate-12 scale-[1.05]"
          )}
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%)',
            backgroundSize: '300% 300%',
            animation: 'gradient-shift 6s ease infinite',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 0 30px rgba(139, 92, 246, 0.3)',
            filter: 'drop-shadow(0 25px 50px rgba(139, 92, 246, 0.2)) drop-shadow(0 10px 20px rgba(0, 0, 0, 0.15))',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease-out, transform 0.1s ease-out'
          }}
        >
          {/* Inner glassmorphism container */}
          <div 
            className="w-full h-full rounded-full relative overflow-hidden transition-all duration-100 group-active:shadow-inner"
            style={{
              background: 'rgba(17, 24, 39, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: 'inset 0 0 0 1px rgba(139, 92, 246, 0.1)'
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
              <div className={cn(
                "text-center transform transition-all duration-75 ease-out",
                "group-active:scale-90 group-hover:scale-105",
                // Mobile touch scaling
                isTouched && "scale-105"
              )}>
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
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full z-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500"
          style={{
            background: 'conic-gradient(from 0deg, #8B5CF6, #EC4899, #F97316, #8B5CF6)',
            filter: 'blur(30px)',
            transform: 'scale(1.4)'
          }}
        />
      </div>

    </div>
  );
};
