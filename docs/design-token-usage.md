# BullFit Design Token Usage Guide

## Quick Start

### Using Brand Colors
```tsx
// OLD - Hardcoded approach
<button className="bg-gradient-to-r from-purple-700 to-pink-600">

// NEW - Token-based approach
<button className={componentPatterns.button.primary()}>
```

### Using Typography
```tsx
// OLD - Inconsistent sizing
<h2 className="text-2xl font-bold">

// NEW - Token-based typography
<h2 className={typography.pageHeading()}>
```

### Using Component Patterns
```tsx
// OLD - Repeated styling patterns
<div className="bg-zinc-800 rounded-2xl p-4 border border-zinc-700/50">

// NEW - Component pattern utility
<div className={componentPatterns.card.primary()}>
```

## Migration Examples
```tsx
// BEFORE - Workout Setup Modal Header
<div className="mb-4 flex justify-between items-start">
  <div>
    <h3 className="text-xl font-bold text-white flex items-center gap-2">
      Workout Setup
    </h3>
    <p className="text-sm text-zinc-400 mt-1">Choose your focus</p>
  </div>
</div>

// AFTER - Using Token Utilities
<div className={componentPatterns.modal.header()}>
  <div>
    <h3 className={`${typography.sectionHeading()} flex items-center gap-2`}>
      Workout Setup
    </h3>
    <p className={`${typography.caption()} text-zinc-400 mt-1`}>Choose your focus</p>
  </div>
</div>
```

## Developer Cheat Sheet
```ts
export const quickPatterns = {
  // Modals & Dialogs
  modal: componentPatterns.modal.container(),
  modalOverlay: componentPatterns.modal.overlay(),

  // Cards & Containers
  workoutCard: componentPatterns.card.primary(),
  statsCard: componentPatterns.card.elevated(),

  // Buttons & Actions
  primaryButton: componentPatterns.button.primary(),
  secondaryButton: componentPatterns.button.secondary(),

  // Typography
  pageTitle: typography.pageHeading(),
  sectionTitle: typography.sectionHeading(),
  bodyText: typography.bodyText(),

  // Colors
  brandGradient: brandColors.gradient(),
  cardBackground: surfaceColors.primary(),
  textPrimary: 'text-white',
  textSecondary: 'text-zinc-400'
}
```
