/**
 * Global Rest Timer Coordinator
 * 
 * Ensures only one rest timer system can be active at a time,
 * preventing the concurrent timer issue that causes data corruption.
 */

interface ActiveTimer {
  timerId: string;
  exerciseName: string;
  setNumber: number;
  startTime: number;
  targetTime: number;
  source: 'global' | 'legacy';
}

class TimerCoordinator {
  private activeTimer: ActiveTimer | null = null;
  private listeners: Array<(timer: ActiveTimer | null) => void> = [];

  /**
   * Register a new timer, automatically stopping any existing timer
   */
  registerTimer(timer: Omit<ActiveTimer, 'startTime'>) {
    // Stop any existing timer before starting a new one
    if (this.activeTimer) {
      console.warn(`⚠️  Stopping existing timer ${this.activeTimer.timerId} to prevent concurrent timers`);
      this.stopActiveTimer();
    }

    const newTimer: ActiveTimer = {
      ...timer,
      startTime: Date.now(),
    };

    this.activeTimer = newTimer;
    this.notifyListeners();

    console.log(`🕐 Timer started: ${timer.timerId} (${timer.exerciseName} Set ${timer.setNumber})`);
  }

  /**
   * Stop the currently active timer
   */
  stopActiveTimer() {
    if (this.activeTimer) {
      console.log(`🛑 Timer stopped: ${this.activeTimer.timerId}`);
      this.activeTimer = null;
      this.notifyListeners();
    }
  }

  /**
   * Get the currently active timer
   */
  getActiveTimer(): ActiveTimer | null {
    return this.activeTimer;
  }

  /**
   * Check if a specific timer is currently active
   */
  isTimerActive(timerId: string): boolean {
    return this.activeTimer?.timerId === timerId;
  }

  /**
   * Subscribe to timer state changes
   */
  subscribe(listener: (timer: ActiveTimer | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.activeTimer));
  }

  /**
   * Clear all timers and reset state
   */
  reset() {
    this.activeTimer = null;
    this.notifyListeners();
    console.log('🔄 Timer coordinator reset');
  }
}

// Global singleton instance
export const timerCoordinator = new TimerCoordinator();

// Helper functions
export const registerRestTimer = (
  timerId: string,
  exerciseName: string,
  setNumber: number,
  targetTime: number,
  source: 'global' | 'legacy' = 'global'
) => {
  timerCoordinator.registerTimer({
    timerId,
    exerciseName,
    setNumber,
    targetTime,
    source,
  });
};

export const stopCurrentTimer = () => {
  timerCoordinator.stopActiveTimer();
};

export const getCurrentTimer = () => {
  return timerCoordinator.getActiveTimer();
};

export const isTimerCurrentlyActive = (timerId: string) => {
  return timerCoordinator.isTimerActive(timerId);
};