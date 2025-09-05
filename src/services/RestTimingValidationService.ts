export interface RestTimingValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedValue?: number;
}

export const RestTimingValidationService = {
  validateRestTime(
    exerciseId: string,
    setIndex: number,
    durationMs: number,
    existingRestMs?: number
  ): RestTimingValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (durationMs < 0) {
      errors.push('Rest time cannot be negative');
    }
    if (durationMs > 30 * 60 * 1000) {
      warnings.push('Rest time unusually long (>30 minutes)');
    }
    if (durationMs < 10 * 1000) {
      warnings.push('Rest time unusually short (<10 seconds)');
    }

    if (existingRestMs && existingRestMs > 0) {
      const difference = Math.abs(durationMs - existingRestMs);
      const threshold = Math.max(5000, existingRestMs * 0.1);
      if (difference > threshold) {
        errors.push(
          `Attempting to overwrite rest time: ${existingRestMs}ms -> ${durationMs}ms`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: Math.max(0, Math.min(durationMs, 30 * 60 * 1000)),
    };
  },
};
