
/**
 * Typography System
 * 
 * A comprehensive typography system for consistent text styling across the application.
 * Use these tokens instead of direct Tailwind classes to maintain consistency.
 */

// Define the core typography tokens
export const typography = {
  // Main text styles
  text: {
    primary: "text-white font-normal text-base",
    secondary: "text-white/80 text-base",
    muted: "text-white/60 text-sm",
    small: "text-white/70 text-xs",
    numeric: "text-sky-200 font-mono font-medium",
    positive: "text-emerald-300 font-bold font-mono",
    negative: "text-red-400 font-bold font-mono",
  },

  // Heading hierarchy
  headings: {
    h1: "text-white font-bold text-3xl sm:text-4xl leading-tight",
    h2: "text-white font-bold text-2xl sm:text-3xl leading-snug",
    h3: "text-white font-semibold text-xl sm:text-2xl",
    h4: "text-white font-semibold text-lg",
    h5: "text-white font-medium text-base",
    h6: "text-white/90 font-medium text-sm",
    
    // Semantic heading styles
    primary: "text-white font-bold text-2xl leading-tight",
    section: "text-white font-semibold text-lg",
    collapsible: "text-white font-medium text-base"
  },

  // Interactive elements
  interactive: {
    button: "text-white hover:text-white/90 font-medium",
    link: "text-purple-400 hover:text-purple-300 font-medium",
    tab: "text-gray-300 hover:text-white data-[state=active]:text-white",
    label: "text-white/80 text-sm font-medium",
  },

  // Sections & labels
  sections: {
    title: "text-white font-bold text-xl",
    subtitle: "text-white/80 text-lg",
    label: "text-white/70 text-xs font-medium tracking-wide",
  },

  // Specialized text types
  special: {
    gradient: "bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent",
    accent: "text-purple-400",
    error: "text-red-400",
    success: "text-emerald-400",
    warning: "text-amber-400",
    info: "text-sky-400",
  }
};

/**
 * Helper function to combine typography classes
 * @param classes Array of typography classes to combine
 * @returns Combined class string
 */
export const combineTypography = (...classes: string[]) => {
  return classes.filter(Boolean).join(" ");
};

/**
 * Get full typography class based on token path
 * @param path Path to typography token (e.g., "headings.h1")
 * @returns Typography class string or empty string if not found
 */
export const getTypographyClass = (path: string): string => {
  const parts = path.split('.');
  let result: any = typography;
  
  for (const part of parts) {
    if (result[part] === undefined) {
      console.warn(`Typography path "${path}" not found`);
      return '';
    }
    result = result[part];
  }
  
  return typeof result === 'string' ? result : '';
};
