/**
 * Central design token definitions for BullFit
 * Provides brand, semantic, and neutral color scales along with
 * spacing, radius, typography, and shadow tokens.
 */

export const designTokens = {
  colors: {
    brand: {
      primary: '#8B5CF6', // purple-600
      secondary: '#EC4899', // pink-500/600
      gradient: 'from-purple-700 to-pink-600',
    },
    semantic: {
      success: '#16A34A', // green-600
      warning: '#F59E0B', // amber-500
      error: '#DC2626',   // red-600
      info: '#3B82F6',    // blue-500
    },
    neutral: {
      surface: {
        primary: '#0B0B0F',
        secondary: '#1A1F2C',
        elevated: '#23263A',
      },
      text: {
        primary: 'rgba(255,255,255,0.9)',
        secondary: 'rgba(255,255,255,0.7)',
        muted: 'rgba(255,255,255,0.5)',
        disabled: 'rgba(255,255,255,0.3)',
      },
    },
  },
  gradients: {
    brand: {
      primary: 'from-purple-600 to-pink-500',
      secondary: 'from-purple-600 to-purple-800',
      subtle: 'from-purple-700/20 to-pink-600/20',
      card: 'from-purple-600/12 to-pink-500/12',
    },
  },
  effects: {
    glow: {
      subtle: '0 0 20px rgba(168, 85, 247, 0.15)',
      medium: '0 0 30px rgba(168, 85, 247, 0.25)', 
      strong: '0 0 40px rgba(168, 85, 247, 0.35)',
      purple: '0 0 20px rgba(139, 92, 246, 0.15)',
    },
    elevation: {
      card: '0 4px 20px rgba(0, 0, 0, 0.1)',
      floating: '0 8px 30px rgba(0, 0, 0, 0.15)',
      modal: '0 20px 60px rgba(0, 0, 0, 0.3)',
      enhanced: '0 10px 20px rgba(139, 92, 246, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)',
    },
    blur: {
      card: 'blur(12px)',
      overlay: 'blur(8px)',
    },
  },
  animations: {
    press: {
      scale: 'scale-[0.98]',
      duration: 'duration-150',
      easing: 'ease-out'
    },
    hover: {
      scale: 'scale-[1.02]', 
      scaleStrong: 'scale-[1.05]',
      duration: 'duration-200',
      durationFast: 'duration-150',
      easing: 'ease-in-out'
    },
    pulse: {
      scale: 'animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]',
      glow: 'animate-[pulse_2.1s_ease-in-out_infinite]',
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '3rem',
    '4xl': '4rem',
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
  },
  typography: {
    scale: {
      headingXl: '2.25rem',
      headingLg: '1.875rem',
      headingMd: '1.5rem',
      body: '1rem',
      bodySmall: '0.875rem',
      caption: '0.75rem',
    },
    weight: {
      normal: '400',
      semibold: '600',
      bold: '700',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -4px rgba(0,0,0,0.1)',
  },
};

export type DesignTokens = typeof designTokens;
