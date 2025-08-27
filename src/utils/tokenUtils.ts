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

// Enhanced typography utilities for consistent text styling
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
  
  // Enhanced typography patterns for metrics and dashboard
  metricNumber: () => 'text-xl sm:text-2xl font-semibold tabular-nums text-white',
  metricNumberLarge: () => 'text-4xl font-bold tracking-tight',
  metricUnit: () => 'text-sm text-white/80 ml-1',
  cardTitle: () => 'text-sm text-white/90 truncate',
  cardSubtitle: () => 'text-xs text-white/70',
  navigationLabel: () => 'text-xs font-medium',
  statusBadge: () => 'text-xs font-bold uppercase tracking-wide',
  comparison: () => 'text-xs text-white/70 leading-snug',
  encouragement: () => 'text-xs text-purple-400',
  
  // Gradient text effects
  brandGradient: () => `bg-gradient-to-r ${gradients.brand.primary()} bg-clip-text text-transparent`,
  
  // Chat-specific typography
  chatMessage: () => `${typography.body()} leading-relaxed`,
  chatTimestamp: () => `text-xs text-zinc-500 font-medium`,
  chatPlaceholder: () => `${typography.body()} text-zinc-400`,
  chatHeader: () => `${typography.sectionHeading()} text-center`,
};

// Enhanced gradients from design tokens
export const gradients = {
  brand: {
    primary: () => designTokens.gradients.brand.primary,
    secondary: () => designTokens.gradients.brand.secondary,
    subtle: () => designTokens.gradients.brand.subtle,
    card: () => designTokens.gradients.brand.card,
  }
};

// Enhanced effects from design tokens
export const effects = {
  glow: {
    subtle: () => `shadow-[${designTokens.effects.glow.subtle}]`,
    medium: () => `shadow-[${designTokens.effects.glow.medium}]`,
    strong: () => `shadow-[${designTokens.effects.glow.strong}]`,
    purple: () => `shadow-[${designTokens.effects.glow.purple}]`,
  },
  elevation: {
    card: () => `shadow-[${designTokens.effects.elevation.card}]`,
    floating: () => `shadow-[${designTokens.effects.elevation.floating}]`,
    enhanced: () => `shadow-[${designTokens.effects.elevation.enhanced}]`,
  },
  blur: {
    card: () => `backdrop-blur-[12px]`,
    overlay: () => `backdrop-blur-[8px]`,
  }
};

// Enhanced component pattern utilities
const cardPatterns = {
  primary: () => `${surfaceColors.primary()} rounded-2xl p-4 border border-zinc-700/50`,
  secondary: () => `${surfaceColors.secondary()} rounded-lg p-3 border border-zinc-700/30`,
  elevated: () => `${surfaceColors.elevated()} rounded-2xl p-6 shadow-lg border border-zinc-600/30`,

  // Enhanced patterns matching Start button aesthetics
  metric: () => `
    relative p-3 sm:p-4 rounded-xl
    bg-gradient-to-br ${gradients.brand.card()}
    ${effects.blur.card()} ${effects.elevation.enhanced()}
    border border-white/15
    before:absolute before:inset-0 before:rounded-xl
    before:bg-gradient-to-br before:from-white/5 before:to-transparent
    before:mix-blend-overlay before:pointer-events-none
    hover:${designTokens.animations.hover.scale} active:${designTokens.animations.press.scale}
    transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}
    cursor-pointer group overflow-hidden
  `,

  progress: () => `
    relative p-4 rounded-xl
    bg-gradient-to-br ${gradients.brand.card()}
    ${effects.blur.card()} ${effects.elevation.enhanced()}
    border border-white/15
    before:absolute before:inset-0 before:rounded-xl
    before:bg-gradient-to-br before:from-white/5 before:to-transparent
    before:mix-blend-overlay before:pointer-events-none
    overflow-hidden
  `,

  stats: () => `
    relative p-4 rounded-xl
    bg-zinc-900/50 border border-zinc-800
    hover:${designTokens.animations.hover.scale}
    transition-all ${designTokens.animations.hover.duration}
  `,
};

export const componentPatterns = {
  card: cardPatterns,
  cards: cardPatterns,
  
  cta: {
    primary: () => `
      bg-gradient-to-r ${gradients.brand.primary()} 
      text-white font-bold px-8 py-4 rounded-full
      ${effects.glow.subtle()} hover:${designTokens.animations.hover.scaleStrong} active:${designTokens.animations.press.scale}
      transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}
    `,
    
    circular: () => `
      relative flex flex-col items-center justify-center group
      bg-gradient-to-r ${gradients.brand.primary()} ${effects.glow.medium()}
      text-white font-semibold rounded-full border border-purple-500/30 overflow-hidden
      hover:${designTokens.animations.hover.scaleStrong} active:${designTokens.animations.press.scale}
      transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing}
      focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400
    `
  },

  button: {
    primary: () => `bg-gradient-to-r ${gradients.brand.primary()} text-white font-semibold px-5 py-2 rounded-full hover:${designTokens.animations.hover.scaleStrong} transition-transform`,
    secondary: () => `${surfaceColors.secondary()} hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg transition-colors`,
    ghost: () => `hover:${surfaceColors.secondary()} text-zinc-400 hover:text-white px-3 py-1 rounded-md transition-colors`,
  },
  
  progress: {
    bar: () => `
      relative h-2 bg-zinc-800 rounded-full overflow-hidden
    `,
    
    fill: () => `
      absolute h-full bg-gradient-to-r ${gradients.brand.primary()} rounded-full 
      transition-all duration-500
      before:absolute before:inset-0 before:bg-white/20 
      before:animate-pulse before:rounded-full
    `,
    
    indicator: () => `
      text-xs font-medium transition-colors duration-200
    `,
  },
  
  navigation: {
    item: () => `
      relative flex flex-col items-center gap-1 py-2 px-3 rounded-lg
      transition-all ${designTokens.animations.hover.duration}
    `,
    
    activeIndicator: () => `
      absolute -bottom-1 left-1/2 transform -translate-x-1/2 
      w-8 h-1 bg-gradient-to-r ${gradients.brand.primary()} rounded-full
      ${effects.glow.subtle()}
    `,
    
    iconContainer: () => `
      p-2 rounded-lg transition-all ${designTokens.animations.hover.duration}
    `,
  },

  chat: {
    // AI message bubbles - premium card styling
    aiMessage: () => `
      relative max-w-[85%] mr-auto mb-4
      ${cardPatterns.metric()}
      animate-in slide-in-from-left-4 fade-in-0 duration-300
    `,
    
    // User message bubbles - brand gradient styling
    userMessage: () => `
      relative max-w-[85%] ml-auto mb-4
      ${cardPatterns.secondary()}
      bg-gradient-to-r ${gradients.brand.primary()}
      text-white border-purple-400/30
      animate-in slide-in-from-right-4 fade-in-0 duration-300
    `,
    
    // Chat input container
    inputContainer: () => `
      ${cardPatterns.secondary()}
      p-3 flex items-end gap-3 min-h-[56px] max-h-32
      border border-zinc-700/50 backdrop-blur-sm
    `,
    
    // Text input field
    inputField: () => `
      flex-1 bg-transparent resize-none outline-none
      ${typography.body()} text-white placeholder-zinc-400
      min-h-[2rem] max-h-20 py-2
    `,
    
    // Enhanced send button
    sendButton: () => `
      w-12 h-12 rounded-full flex-shrink-0
      bg-gradient-to-r ${gradients.brand.primary()}
      ${effects.glow.subtle()} hover:${effects.glow.medium()}
      flex items-center justify-center transition-all duration-200
      hover:scale-110 active:scale-95 disabled:opacity-50
      focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400
    `,
    
    // Message timestamp
    timestamp: () => `
      ${typography.caption()} text-zinc-500 mt-1
      select-none pointer-events-none
    `,
    
    // Typing indicator
    typingIndicator: () => `
      ${cardPatterns.secondary()}
      px-4 py-3 max-w-[85%] mr-auto mb-4
      flex items-center gap-2
    `,
  },
  
  // Chat layout patterns for mobile web
  chatLayout: {
    container: () => `
      h-screen flex flex-col bg-zinc-900
      pb-[env(safe-area-inset-bottom,0px)]
    `,
    
    header: () => `
      ${effects.blur.card()} border-b border-zinc-700/50
      sticky top-0 z-20 backdrop-blur-lg bg-zinc-900/90 p-4
    `,
    
    messageArea: () => `
      flex-1 overflow-y-auto px-4 py-4
      pb-[max(1rem,env(keyboard-inset-height,0px))]
      scroll-behavior-smooth
    `,
    
    inputArea: () => `
      p-4 border-t border-zinc-700/30 ${effects.blur.card()}
      pb-[calc(1rem+env(safe-area-inset-bottom,0px))]
      sticky bottom-0 backdrop-blur-lg bg-zinc-900/80
    `,
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
