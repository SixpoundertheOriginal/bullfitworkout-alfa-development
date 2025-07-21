
/**
 * Immediate Corruption Cleanup Utility
 * 
 * This utility provides aggressive corruption detection and cleanup
 * for stuck workout sessions. Available globally as window.clearCorruption()
 */

interface CorruptionReport {
  localStorage: {
    corrupted: string[];
    valid: string[];
    size: number;
  };
  sessionStorage: {
    corrupted: string[];
    valid: string[];
    size: number;
  };
  storeState: {
    issues: string[];
    isValid: boolean;
  };
  summary: {
    totalIssues: number;
    severity: 'none' | 'minor' | 'major' | 'critical';
  };
}

interface CleanupBackup {
  timestamp: string;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  storeState: any;
}

/**
 * Scan for corruption in all storage systems
 */
export const scanForCorruption = (): CorruptionReport => {
  console.group('🔍 Scanning for workout corruption...');
  
  const report: CorruptionReport = {
    localStorage: { corrupted: [], valid: [], size: 0 },
    sessionStorage: { corrupted: [], valid: [], size: 0 },
    storeState: { issues: [], isValid: true },
    summary: { totalIssues: 0, severity: 'none' }
  };

  // Scan localStorage
  console.log('📱 Checking localStorage...');
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // Check workout-related keys
      if (key.includes('workout') || key.includes('training') || key.includes('exercise')) {
        try {
          const value = localStorage.getItem(key);
          if (!value) {
            report.localStorage.corrupted.push(`${key}: null value`);
            continue;
          }
          
          report.localStorage.size += value.length;
          
          // Try to parse JSON data
          if (value.startsWith('{') || value.startsWith('[')) {
            const parsed = JSON.parse(value);
            
            // Check for corruption patterns
            if (key === 'workout-storage') {
              const state = parsed?.state;
              if (state) {
                // Check for invalid timestamps
                if (state.elapsedTime && (state.elapsedTime < 0 || state.elapsedTime > 86400)) {
                  report.localStorage.corrupted.push(`${key}: Invalid elapsedTime (${state.elapsedTime})`);
                }
                
                // Check for stuck states
                if (state.workoutStatus === 'saving' && state.lastTabActivity) {
                  const timeSinceSaving = Date.now() - state.lastTabActivity;
                  if (timeSinceSaving > 30000) {
                    report.localStorage.corrupted.push(`${key}: Stuck in saving state for ${Math.round(timeSinceSaving/1000)}s`);
                  }
                }
                
                // Check for invalid combinations
                if (state.workoutStatus === 'active' && !state.isActive) {
                  report.localStorage.corrupted.push(`${key}: Status/flag mismatch`);
                }
                
                // Check for corrupted exercise data
                if (state.exercises && typeof state.exercises === 'object') {
                  Object.entries(state.exercises).forEach(([name, data]) => {
                    if (!data || (typeof data !== 'object' && !Array.isArray(data))) {
                      report.localStorage.corrupted.push(`${key}: Corrupted exercise "${name}"`);
                    }
                  });
                }
              }
            }
            
            report.localStorage.valid.push(key);
          } else {
            report.localStorage.valid.push(key);
          }
        } catch (error) {
          report.localStorage.corrupted.push(`${key}: Parse error - ${error}`);
        }
      }
    }
  } catch (error) {
    report.localStorage.corrupted.push(`localStorage access error: ${error}`);
  }

  // Scan sessionStorage
  console.log('💾 Checking sessionStorage...');
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      
      if (key.includes('workout') || key.includes('training') || key.includes('exercise')) {
        try {
          const value = sessionStorage.getItem(key);
          if (!value) {
            report.sessionStorage.corrupted.push(`${key}: null value`);
            continue;
          }
          
          report.sessionStorage.size += value.length;
          
          if (value.startsWith('{') || value.startsWith('[')) {
            JSON.parse(value); // Validate JSON
          }
          
          report.sessionStorage.valid.push(key);
        } catch (error) {
          report.sessionStorage.corrupted.push(`${key}: Parse error - ${error}`);
        }
      }
    }
  } catch (error) {
    report.sessionStorage.corrupted.push(`sessionStorage access error: ${error}`);
  }

  // Check current store state
  console.log('🏪 Checking store state...');
  try {
    if (typeof window !== 'undefined' && (window as any).useWorkoutStore) {
      const store = (window as any).useWorkoutStore.getState();
      
      if (store.elapsedTime && (store.elapsedTime < 0 || store.elapsedTime > 86400)) {
        report.storeState.issues.push(`Invalid elapsedTime: ${store.elapsedTime}`);
      }
      
      if (store.workoutStatus === 'saving' && store.lastTabActivity) {
        const timeSinceSaving = Date.now() - store.lastTabActivity;
        if (timeSinceSaving > 30000) {
          report.storeState.issues.push(`Stuck in saving state for ${Math.round(timeSinceSaving/1000)}s`);
        }
      }
      
      if (store.workoutStatus === 'active' && !store.isActive) {
        report.storeState.issues.push('Status/flag mismatch in store');
      }
    }
  } catch (error) {
    report.storeState.issues.push(`Store access error: ${error}`);
  }

  // Calculate summary
  const totalIssues = report.localStorage.corrupted.length + 
                     report.sessionStorage.corrupted.length + 
                     report.storeState.issues.length;
  
  report.summary.totalIssues = totalIssues;
  report.storeState.isValid = report.storeState.issues.length === 0;
  
  if (totalIssues === 0) {
    report.summary.severity = 'none';
  } else if (totalIssues <= 2) {
    report.summary.severity = 'minor';
  } else if (totalIssues <= 5) {
    report.summary.severity = 'major';
  } else {
    report.summary.severity = 'critical';
  }

  console.log('📊 Corruption Report:', report);
  console.groupEnd();
  
  return report;
};

/**
 * Create backup of current data before cleanup
 */
const createBackup = (): CleanupBackup => {
  const backup: CleanupBackup = {
    timestamp: new Date().toISOString(),
    localStorage: {},
    sessionStorage: {},
    storeState: null
  };

  // Backup localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('workout') || key.includes('training') || key.includes('exercise'))) {
        const value = localStorage.getItem(key);
        if (value) {
          backup.localStorage[key] = value;
        }
      }
    }
  } catch (error) {
    console.warn('Could not backup localStorage:', error);
  }

  // Backup sessionStorage
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('workout') || key.includes('training') || key.includes('exercise'))) {
        const value = sessionStorage.getItem(key);
        if (value) {
          backup.sessionStorage[key] = value;
        }
      }
    }
  } catch (error) {
    console.warn('Could not backup sessionStorage:', error);
  }

  // Backup store state
  try {
    if (typeof window !== 'undefined' && (window as any).useWorkoutStore) {
      backup.storeState = (window as any).useWorkoutStore.getState();
    }
  } catch (error) {
    console.warn('Could not backup store state:', error);
  }

  return backup;
};

/**
 * Aggressive cleanup of all workout-related corruption
 */
export const clearCorruption = (skipConfirmation = false): boolean => {
  if (!skipConfirmation) {
    const confirmed = confirm(
      '🚨 CORRUPTION CLEANUP\n\n' +
      'This will:\n' +
      '• Clear ALL workout data from storage\n' +
      '• Reset workout state completely\n' +
      '• Clear timers and intervals\n' +
      '• Create backup for debugging\n\n' +
      'Continue with cleanup?'
    );
    
    if (!confirmed) {
      console.log('❌ Cleanup cancelled by user');
      return false;
    }
  }

  console.group('🧹 AGGRESSIVE CORRUPTION CLEANUP');
  
  // Step 1: Create backup
  console.log('💾 Creating backup...');
  const backup = createBackup();
  
  // Store backup in a safe location
  try {
    sessionStorage.setItem('corruption-cleanup-backup', JSON.stringify(backup));
    console.log('✅ Backup created successfully');
  } catch (error) {
    console.warn('⚠️ Could not create backup:', error);
  }

  let cleanupCount = 0;

  // Step 2: Clear localStorage workout data
  console.log('🗑️ Clearing localStorage...');
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('workout') || key.includes('training') || key.includes('exercise'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      cleanupCount++;
      console.log(`  ✓ Removed: ${key}`);
    });
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
  }

  // Step 3: Clear sessionStorage workout data
  console.log('🗑️ Clearing sessionStorage...');
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key !== 'corruption-cleanup-backup' && 
          (key.includes('workout') || key.includes('training') || key.includes('exercise'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
      cleanupCount++;
      console.log(`  ✓ Removed: ${key}`);
    });
  } catch (error) {
    console.error('❌ Error clearing sessionStorage:', error);
  }

  // Step 4: Reset store state
  console.log('🏪 Resetting store state...');
  try {
    if (typeof window !== 'undefined' && (window as any).useWorkoutStore) {
      const store = (window as any).useWorkoutStore.getState();
      if (store.clearWorkoutState) {
        store.clearWorkoutState();
        console.log('  ✓ Store state cleared');
        cleanupCount++;
      }
    }
  } catch (error) {
    console.error('❌ Error resetting store:', error);
  }

  // Step 5: Clear any orphaned timers/intervals
  console.log('⏰ Clearing timers...');
  try {
    // Clear high-numbered interval IDs (likely orphaned)
    for (let i = 1; i < 1000; i++) {
      clearInterval(i);
      clearTimeout(i);
    }
    console.log('  ✓ Cleared potential orphaned timers');
  } catch (error) {
    console.warn('⚠️ Error clearing timers:', error);
  }

  // Step 6: Force garbage collection if available
  console.log('🗑️ Forcing cleanup...');
  try {
    if ((window as any).gc) {
      (window as any).gc();
      console.log('  ✓ Garbage collection triggered');
    }
  } catch (error) {
    // Ignore - gc is not always available
  }

  console.log(`\n✅ CLEANUP COMPLETE`);
  console.log(`📊 Cleaned ${cleanupCount} corrupted items`);
  console.log(`💾 Backup saved as 'corruption-cleanup-backup'`);
  console.log(`🔄 Please refresh the page to complete cleanup`);
  console.groupEnd();

  // Show success message
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      alert(
        '✅ CORRUPTION CLEANUP COMPLETE\n\n' +
        `Cleaned ${cleanupCount} corrupted items\n` +
        'Backup created for debugging\n\n' +
        'Please refresh the page to complete cleanup.'
      );
    }, 100);
  }

  return true;
};

/**
 * Quick health check for immediate issues
 */
export const quickHealthCheck = (): { isHealthy: boolean; issues: string[] } => {
  const issues: string[] = [];

  try {
    // Check store state
    if (typeof window !== 'undefined' && (window as any).useWorkoutStore) {
      const store = (window as any).useWorkoutStore.getState();
      
      if (store.elapsedTime && store.elapsedTime > 86400) {
        issues.push(`Invalid elapsed time: ${store.elapsedTime} seconds`);
      }
      
      if (store.workoutStatus === 'saving' && store.lastTabActivity) {
        const timeSinceSaving = Date.now() - store.lastTabActivity;
        if (timeSinceSaving > 30000) {
          issues.push(`Stuck in saving state for ${Math.round(timeSinceSaving/1000)} seconds`);
        }
      }
    }

    // Check localStorage size
    try {
      const workoutStorage = localStorage.getItem('workout-storage');
      if (workoutStorage && workoutStorage.length > 100000) {
        issues.push(`Large workout storage: ${workoutStorage.length} characters`);
      }
    } catch (error) {
      issues.push('Cannot access localStorage');
    }

  } catch (error) {
    issues.push(`Health check error: ${error}`);
  }

  return {
    isHealthy: issues.length === 0,
    issues
  };
};

// Development-only global utilities
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Make functions globally available
  (window as any).scanForCorruption = scanForCorruption;
  (window as any).clearCorruption = clearCorruption;
  (window as any).quickHealthCheck = quickHealthCheck;
  
  // Convenience function
  (window as any).fixWorkout = () => {
    console.log('🔧 Running quick workout fix...');
    const health = quickHealthCheck();
    
    if (!health.isHealthy) {
      console.log('⚠️ Issues detected:', health.issues);
      return clearCorruption();
    } else {
      console.log('✅ No immediate issues detected');
      return true;
    }
  };

  console.log('🛠️ Corruption cleanup utilities loaded:');
  console.log('  scanForCorruption() - Detailed corruption scan');
  console.log('  clearCorruption() - Aggressive cleanup with backup');
  console.log('  quickHealthCheck() - Fast issue detection');
  console.log('  fixWorkout() - One-click fix for common issues');
  console.log('');
  console.log('🚨 IMMEDIATE FIX: Run clearCorruption() to fix your stuck session');
}
