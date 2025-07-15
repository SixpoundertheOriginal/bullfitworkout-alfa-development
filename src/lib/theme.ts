
import { typography } from './typography';

/**
 * Theme constants for consistent styling across the application
 */

export const theme = {
  colors: {
    // Text colors - tokens for critical use within cards/components
    text: {
      light: "text-white",
      lightMuted: "text-white/80",
      lightSubtle: "text-white/60",
      // Adding high-contrast variations
      highContrast: "text-white font-medium",
      highContrastMuted: "text-purple-200",
      accent: "text-purple-400", // Use for icons and accent text throughout UI
    },
    // Background colors
    background: {
      dark: "bg-gray-900",
      darkGradient: "bg-gradient-to-br from-gray-900 via-gray-900/98 to-gray-900/95",
    },
    // Accent colors
    accent: {
      purple: "text-purple-400",
      green: "text-emerald-400",
      red: "text-red-400",
    }
  },
  
  // Reference typography system
  textStyles: typography
};

// Documentation: Use theme.colors.text.accent for all metric card icons and accent text. Use theme.textStyles.text.secondary for supporting muted text.

// Helper to combine theme classes with custom classes
export const withTheme = (baseClasses: string, customClasses?: string) => {
  return customClasses ? `${baseClasses} ${customClasses}` : baseClasses;
};

// Map to typography system
export const darkModeText = {
  heading: typography.headings.primary,
  sectionTitle: typography.sections.title,
  subheading: typography.text.secondary,
  body: typography.text.secondary,
  muted: typography.text.muted,
  highlight: typography.interactive.link,
  label: typography.sections.label,
};

// Helper function specifically for section headings in dark mode
export const getSectionHeadingClasses = (withIcon: boolean = false) => {
  return `flex ${withIcon ? 'items-center gap-2' : ''} ${typography.headings.h3}`;
};
