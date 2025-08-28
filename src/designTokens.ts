/**
 * Central design token definitions for BullFit
 * Enhanced brutalist aesthetic with premium industrial design
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
    brutal: {
      contrast: {
        extreme: '#FFFFFF',
        harsh: '#000000',
        medium: '#1A1A1A',
      },
      industrial: {
        steel: '#3A3A3A',
        concrete: '#2A2A2A',
        iron: '#404040',
        chrome: '#E5E7EB',
      },
      accent: {
        electric: '#00F5FF',
        neon: '#39FF14',
        warning: '#FF6B35',
        critical: '#FF073A',
      }
    },
    neutral: {
      surface: {
        primary: '#0B0B0F',
        secondary: '#1A1F2C',
        elevated: '#23263A',
        brutal: '#0A0A0A',
        industrial: '#141414',
      },
      text: {
        primary: 'rgba(255,255,255,0.95)',
        secondary: 'rgba(255,255,255,0.8)',
        muted: 'rgba(255,255,255,0.6)',
        disabled: 'rgba(255,255,255,0.3)',
        harsh: '#FFFFFF',
        technical: '#F0F0F0',
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
    brutal: {
      harsh: 'from-black via-zinc-900 to-black',
      industrial: 'from-zinc-800 via-zinc-700 to-zinc-800',
      electric: 'from-cyan-500 via-blue-500 to-purple-600',
      warning: 'from-orange-500 via-red-500 to-pink-500',
    },
  },
  effects: {
    glow: {
      subtle: '0 0 20px rgba(168, 85, 247, 0.15)',
      medium: '0 0 30px rgba(168, 85, 247, 0.25)', 
      strong: '0 0 40px rgba(168, 85, 247, 0.35)',
      purple: '0 0 20px rgba(139, 92, 246, 0.15)',
      aggressive: '0 0 50px rgba(168, 85, 247, 0.5)',
      industrial: '0 0 25px rgba(0, 245, 255, 0.3)',
    },
    elevation: {
      card: '0 4px 20px rgba(0, 0, 0, 0.1)',
      floating: '0 8px 30px rgba(0, 0, 0, 0.15)',
      modal: '0 20px 60px rgba(0, 0, 0, 0.3)',
      enhanced: '0 10px 20px rgba(139, 92, 246, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)',
      brutal: '0 8px 16px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      carved: 'inset 0 2px 4px rgba(0, 0, 0, 0.6), inset 0 -1px 0 rgba(255, 255, 255, 0.1)',
      stamped: '0 1px 3px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    },
    blur: {
      card: 'blur(12px)',
      overlay: 'blur(8px)',
      industrial: 'blur(16px)',
    },
    texture: {
      concrete: 'linear-gradient(45deg, rgba(255,255,255,0.02) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.02) 25%, transparent 25%)',
      steel: 'linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
    }
  },
  animations: {
    press: {
      scale: 'scale-[0.98]',
      duration: 'duration-150',
      easing: 'ease-out',
      brutal: 'scale-[0.95]',
    },
    hover: {
      scale: 'scale-[1.02]', 
      scaleStrong: 'scale-[1.05]',
      duration: 'duration-200',
      durationFast: 'duration-150',
      easing: 'ease-in-out',
      aggressive: 'scale-[1.08]',
    },
    pulse: {
      scale: 'animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]',
      glow: 'animate-[pulse_2.1s_ease-in-out_infinite]',
      aggressive: 'animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite]',
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
    brutal: {
      tight: '0.125rem',
      compact: '0.375rem',
      generous: '2.5rem',
      massive: '5rem',
    }
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    brutal: {
      sharp: '0',
      minimal: '0.25rem',
      industrial: '0.5rem',
    }
  },
  typography: {
    scale: {
      headingXl: '2.25rem',
      headingLg: '1.875rem',
      headingMd: '1.5rem',
      body: '1rem',
      bodySmall: '0.875rem',
      caption: '0.75rem',
      display: {
        massive: '3.5rem',
        large: '2.75rem',
        technical: '1.125rem',
      },
      mono: {
        technical: '0.875rem',
        data: '1rem',
        display: '1.25rem',
      }
    },
    weight: {
      normal: '400',
      semibold: '600',
      bold: '700',
      black: '900',
      extraBold: '800',
    },
    family: {
      display: 'Montserrat, sans-serif',
      body: 'Inter, sans-serif',
      mono: 'JetBrains Mono, Fira Code, monospace',
    }
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -4px rgba(0,0,0,0.1)',
    brutal: {
      harsh: '0 8px 16px rgba(0,0,0,0.8)',
      carved: 'inset 0 2px 4px rgba(0,0,0,0.6)',
      floating: '0 12px 24px rgba(0,0,0,0.6)',
    }
  },
};

export type DesignTokens = typeof designTokens;