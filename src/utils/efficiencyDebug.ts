// Development-only utility for efficiency metrics debugging
export const debugEfficiencyMetrics = (
  metrics: {
    totalVolume: number;
    setsPerMinute?: number;
    volumePerHour?: number;
    workToRestRatio?: number;
    workMs?: number;
    restMs?: number;
    elapsedActiveMs?: number;
  },
  context: string = 'Unknown'
) => {
  if (process.env.NODE_ENV !== 'development') return;

  const warnings: string[] = [];

  // Check for NaN values
  if (isNaN(metrics.totalVolume)) warnings.push('totalVolume is NaN');
  if (metrics.setsPerMinute !== undefined && isNaN(metrics.setsPerMinute)) {
    warnings.push('setsPerMinute is NaN');
  }
  if (metrics.volumePerHour !== undefined && isNaN(metrics.volumePerHour)) {
    warnings.push('volumePerHour is NaN');
  }
  if (metrics.workToRestRatio !== undefined && isNaN(metrics.workToRestRatio)) {
    warnings.push('workToRestRatio is NaN');
  }

  // Check timing consistency (if work/rest breakdown is available)
  if (metrics.workMs !== undefined && metrics.restMs !== undefined && metrics.elapsedActiveMs !== undefined) {
    const calculatedTotal = metrics.workMs + metrics.restMs;
    const diff = Math.abs(calculatedTotal - metrics.elapsedActiveMs);
    
    if (diff > 1000) { // More than 1 second difference
      warnings.push(`Timing mismatch: work(${metrics.workMs}ms) + rest(${metrics.restMs}ms) = ${calculatedTotal}ms, but elapsed is ${metrics.elapsedActiveMs}ms (diff: ${diff}ms)`);
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn(`🔧 [Efficiency Debug - ${context}] Issues detected:`, warnings);
  }

  // Log sample calculation for verification
  if (metrics.totalVolume > 0 && metrics.volumePerHour !== undefined) {
    console.log(`📊 [Efficiency Debug - ${context}] Sample metrics:`, {
      totalVolume: `${metrics.totalVolume.toFixed(1)} kg`,
      volumePerHour: `${metrics.volumePerHour.toFixed(1)} kg/hr`,
      setsPerMinute: metrics.setsPerMinute?.toFixed(3),
      workToRestRatio: metrics.workToRestRatio?.toFixed(2)
    });
  }
};

// Format time helpers for consistency
export const formatTimeForDebug = {
  secondsToMinSec: (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
  
  msToMinSec: (ms: number): string => {
    return formatTimeForDebug.secondsToMinSec(Math.floor(ms / 1000));
  }
};

// Validation helpers
export const validateEfficiencyInputs = (
  totalVolumeKg: number,
  elapsedSeconds: number,
  completedSets: number
): { isValid: boolean; reason?: string } => {
  if (totalVolumeKg < 0) return { isValid: false, reason: 'Negative volume' };
  if (elapsedSeconds <= 0) return { isValid: false, reason: 'Non-positive elapsed time' };
  if (completedSets < 0) return { isValid: false, reason: 'Negative completed sets' };
  if (completedSets === 0 && totalVolumeKg > 0) return { isValid: false, reason: 'Volume without completed sets' };
  
  return { isValid: true };
};