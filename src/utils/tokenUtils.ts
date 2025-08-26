import { designTokens } from '../designTokens';

// Brand color utilities
export const brandColors = {
  primary: () => `text-[${designTokens.colors.brand.primary}]`,
  secondary: () => `text-[${designTokens.colors.brand.secondary}]`,
  gradient: () => designTokens.colors.brand.gradient,
};

// Semantic color utilities
export const semanticColors = {
  success: () => `text-[${designTokens.colors.semantic.success}]`,
  warning: () => `text-[${designTokens.colors.semantic.warning}]`,
  error: () => `text-[${designTokens.colors.semantic.error}]`,
  info: () => `text-[${designTokens.colors.semantic.info}]`,
};

// Surface color utilities (for consistent card/modal backgrounds)
export const surfaceColors = {
  primary: () => `bg-[${designTokens.colors.neutral.surface.primary}]`,
  secondary: () => `bg-[${designTokens.colors.neutral.surface.secondary}]`,
  elevated: () => `bg-[${designTokens.colors.neutral.surface.elevated}]`,
};

// Typography utilities for consistent text styling
export const typography = {
  headingXl: () => 'text-headingXl',
  headingLg: () => 'text-headingLg',
  headingMd: () => 'text-headingMd',
  body: () => 'text-body',
  bodySmall: () => 'text-bodySmall',
  caption: () => 'text-caption',
  pageHeading: () => 'text-headingXl font-bold',
  sectionHeading: () => 'text-headingLg font-semibold',
  bodyText: () => 'text-body font-normal',
};

// Common component pattern utilities
export const componentPatterns = {
  card: {
    primary: () => `${surfaceColors.primary()} rounded-2xl p-4 border border-zinc-700/50`,
    secondary: () => `${surfaceColors.secondary()} rounded-lg p-3 border border-zinc-700/30`,
    elevated: () => `${surfaceColors.elevated()} rounded-2xl p-6 shadow-lg border border-zinc-600/30`,
  },
  button: {
    primary: () => `bg-gradient-to-r ${brandColors.gradient()} text-white font-semibold px-5 py-2 rounded-full hover:scale-105 transition-transform`,
    secondary: () => `${surfaceColors.secondary()} hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg transition-colors`,
    ghost: () => `hover:${surfaceColors.secondary()} text-zinc-400 hover:text-white px-3 py-1 rounded-md transition-colors`,
  },
  modal: {
    overlay: () => 'fixed inset-0 bg-black/80 flex items-center justify-center z-50',
    container: () => `${surfaceColors.primary()} rounded-2xl shadow-2xl border border-zinc-700 max-w-md w-full mx-4`,
    header: () => 'p-6 pb-4 border-b border-zinc-700/50',
    content: () => 'p-6',
    footer: () => 'p-6 pt-4 border-t border-zinc-700/50 flex gap-3 justify-end',
  },
};

// Responsive utilities using design tokens
export const responsive = {
  container: {
    mobile: () => 'px-4 py-6',
    tablet: () => 'px-6 py-8',
    desktop: () => 'px-8 py-10',
    full: () => 'px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10',
  },
  text: {
    adaptive: {
      heading: () => 'text-lg md:text-xl lg:text-2xl',
      body: () => 'text-sm md:text-base',
      caption: () => 'text-xs md:text-sm',
    },
  },
  spacing: {
    section: () => 'space-y-4 md:space-y-6 lg:space-y-8',
    component: () => 'gap-2 md:gap-3 lg:gap-4',
  },
};
