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
