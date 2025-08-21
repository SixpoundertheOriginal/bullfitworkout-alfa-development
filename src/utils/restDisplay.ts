// Utilities for rest time display and labeling across the app
// Centralizes the rule: first set shows "Start" instead of a time value

import { formatTime } from '@/utils/formatTime';

export type RestDisplay = { type: 'start' } | { type: 'time'; seconds: number };

/**
 * Returns a display label for a set's rest based on its index.
 * - index 0 (first set) => { type: 'start' }
 * - otherwise => { type: 'time', seconds }
 */
export function getDisplayRestLabelByIndex(seconds: number | undefined, indexZeroBased: number): RestDisplay {
  if (indexZeroBased === 0) return { type: 'start' };
  return { type: 'time', seconds: Math.max(0, Math.floor(seconds ?? 0)) };
}

/**
 * Formats a RestDisplay into a human-readable string.
 * - start => "Start"
 * - time  => mm:ss
 */
export function formatRestForDisplay(label: RestDisplay): string {
  if (label.type === 'start') return 'Start';
  return formatTime(label.seconds || 0);
}

/**
 * Debug helper to validate rest time displays
 */
export function validateRestTimeDisplay(restTime: number | undefined, setIndex: number): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (setIndex === 0 && restTime && restTime > 0) {
    issues.push('First set should not have rest time');
  }
  
  if (setIndex > 0 && (!restTime || restTime <= 0)) {
    issues.push('Non-first sets should have rest time');
  }
  
  if (restTime && restTime > 900) { // 15 minutes
    issues.push('Rest time unusually high (>15min)');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}
