/**
 * BullFit Design System Tokens
 * Centralized design tokens for consistent styling across the application
 */

export const designTokens = {
  // Color System
  colors: {
    // Primary palette with semantic naming
    primary: {
      50: 'hsl(253, 87%, 95%)',
      100: 'hsl(253, 87%, 90%)',
      200: 'hsl(253, 87%, 85%)',
      300: 'hsl(253, 87%, 80%)',
      400: 'hsl(253, 87%, 76%)', // Main primary
      500: 'hsl(253, 87%, 70%)',
      600: 'hsl(253, 87%, 60%)',
      700: 'hsl(253, 87%, 50%)',
      800: 'hsl(253, 87%, 40%)',
      900: 'hsl(253, 87%, 30%)',
    },
    
    // Text colors with opacity variants
    text: {
      primary: 'rgba(255, 255, 255, 0.9)',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.6)',
      muted: 'rgba(255, 255, 255, 0.5)',
      disabled: 'rgba(255, 255, 255, 0.3)',
    },

    // Background system
    background: {
      primary: 'hsl(240, 10%, 3.9%)',
      secondary: 'hsl(240, 10%, 5%)',
      tertiary: 'hsl(240, 10%, 7%)',
      card: 'rgba(139, 92, 246, 0.12)',
      overlay: 'rgba(0, 0, 0, 0.8)',
    },

    // Status colors
    status: {
      success: 'hsl(142, 76%, 36%)',
      warning: 'hsl(38, 92%, 50%)',
      error: 'hsl(0, 84%, 60%)',
      info: 'hsl(217, 91%, 60%)',
    },

    // Accent colors for metrics and highlights
    accent: {
      purple: 'hsl(253, 87%, 76%)',
      blue: 'hsl(217, 91%, 60%)',
      green: 'hsl(142, 76%, 36%)',
      orange: 'hsl(38, 92%, 50%)',
      pink: 'hsl(336, 84%, 57%)',
    }
  },

  // Visual Effects
  effects: {
    // Backdrop blur levels
    blur: {
      sm: 'blur(4px)',
      md: 'blur(8px)',
      lg: 'blur(12px)',
      xl: 'blur(16px)',
    },

    // Drop shadows with brand colors
    shadow: {
      sm: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.1))',
      md: 'drop-shadow(0 4px 8px rgba(139, 92, 246, 0.1)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
      lg: 'drop-shadow(0 8px 16px rgba(139, 92, 246, 0.15)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
      xl: 'drop-shadow(0 12px 24px rgba(139, 92, 246, 0.2)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15))',
    },

    // Gradient definitions
    gradient: {
      primary: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(236,72,153,0.12) 100%)',
      subtle: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(236,72,153,0.08) 100%)',
      premium: 'linear-gradient(135deg, rgba(139,92,246,0.16) 0%, rgba(236,72,153,0.16) 100%)',
      glow: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(236,72,153,0.15) 100%)',
      background: 'linear-gradient(135deg, hsl(240, 10%, 3.9%) 0%, hsl(240, 10%, 3.5%) 50%, hsl(240, 10%, 3.2%) 100%)',
    },

    // Inner highlights
    highlight: {
      subtle: 'linear-gradient(45deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
      medium: 'linear-gradient(45deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
      strong: 'linear-gradient(45deg, rgba(255,255,255,0.08) 0%, transparent 50%)',
    }
  },

  // Spacing System
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    '3xl': '3rem',    // 48px
    '4xl': '4rem',    // 64px
  },

  // Border Radius
  radius: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
  },

  // Typography
  typography: {
    // Font sizes
    size: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },

    // Line heights
    leading: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },

    // Font weights
    weight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    }
  },

  // Animation
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  }
};

// Helper functions for accessing tokens
export const getColor = (path: string) => {
  const keys = path.split('.');
  let value: any = designTokens.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || '';
};

export const getEffect = (path: string) => {
  const keys = path.split('.');
  let value: any = designTokens.effects;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || '';
};

export const getSpacing = (size: keyof typeof designTokens.spacing) => {
  return designTokens.spacing[size] || designTokens.spacing.md;
};

export const getRadius = (size: keyof typeof designTokens.radius) => {
  return designTokens.radius[size] || designTokens.radius.md;
};

// CSS-in-JS style helpers
export const glassStyle = (intensity: 'subtle' | 'medium' | 'premium' = 'medium') => {
  const intensityMap = {
    subtle: {
      background: designTokens.effects.gradient.subtle,
      backdropFilter: designTokens.effects.blur.md,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      filter: designTokens.effects.shadow.sm
    },
    medium: {
      background: designTokens.effects.gradient.primary,
      backdropFilter: designTokens.effects.blur.lg,
      border: '1px solid rgba(255, 255, 255, 0.15)',
      filter: designTokens.effects.shadow.md
    },
    premium: {
      background: designTokens.effects.gradient.premium,
      backdropFilter: designTokens.effects.blur.xl,
      border: '1px solid rgba(255, 255, 255, 0.2)',
      filter: designTokens.effects.shadow.lg
    }
  };

  return intensityMap[intensity];
};