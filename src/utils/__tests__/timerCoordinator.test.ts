import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { timerCoordinator, registerRestTimer, stopCurrentTimer, getCurrentTimer } from '../timerCoordinator';

describe('Timer Coordinator - Concurrent Timer Prevention', () => {
  beforeEach(() => {
    // Reset the timer coordinator before each test
    timerCoordinator.reset();
    vi.clearAllMocks();
    console.log = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    timerCoordinator.reset();
  });

  it('should allow starting a single timer', () => {
    registerRestTimer('push_ups_set_1', 'Push-ups', 1, 90);
    
    const activeTimer = getCurrentTimer();
    expect(activeTimer).toBeDefined();
    expect(activeTimer?.timerId).toBe('push_ups_set_1');
    expect(activeTimer?.exerciseName).toBe('Push-ups');
    expect(activeTimer?.setNumber).toBe(1);
    expect(activeTimer?.targetTime).toBe(90);
  });

  it('should prevent concurrent timers by stopping existing timer when new one starts', () => {
    // Start first timer
    registerRestTimer('push_ups_set_1', 'Push-ups', 1, 90);
    const firstTimer = getCurrentTimer();
    expect(firstTimer?.timerId).toBe('push_ups_set_1');

    // Start second timer - should stop the first one
    registerRestTimer('chest_dips_set_1', 'Chest Dips', 1, 60);
    const secondTimer = getCurrentTimer();
    
    expect(secondTimer?.timerId).toBe('chest_dips_set_1');
    expect(secondTimer?.exerciseName).toBe('Chest Dips');
    
    // Verify warning was logged about stopping existing timer
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Stopping existing timer push_ups_set_1')
    );
  });

  it('should handle multiple rapid timer starts correctly', () => {
    // Simulate rapid timer starts (like in the bug scenario)
    registerRestTimer('exercise_a_set_1', 'Exercise A', 1, 60);
    registerRestTimer('exercise_b_set_1', 'Exercise B', 1, 90);
    registerRestTimer('exercise_c_set_1', 'Exercise C', 1, 120);
    
    // Only the last timer should be active
    const activeTimer = getCurrentTimer();
    expect(activeTimer?.timerId).toBe('exercise_c_set_1');
    expect(activeTimer?.exerciseName).toBe('Exercise C');
    
    // Should have warned about stopping previous timers
    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it('should properly stop the active timer', () => {
    registerRestTimer('push_ups_set_1', 'Push-ups', 1, 90);
    expect(getCurrentTimer()).toBeDefined();

    stopCurrentTimer();
    expect(getCurrentTimer()).toBeNull();
  });

  it('should handle timer state subscription', () => {
    const mockListener = vi.fn();
    const unsubscribe = timerCoordinator.subscribe(mockListener);

    // Start a timer
    registerRestTimer('push_ups_set_1', 'Push-ups', 1, 90);
    expect(mockListener).toHaveBeenCalledWith(
      expect.objectContaining({
        timerId: 'push_ups_set_1',
        exerciseName: 'Push-ups'
      })
    );

    // Stop timer
    stopCurrentTimer();
    expect(mockListener).toHaveBeenLastCalledWith(null);

    unsubscribe();
  });

  it('should correctly identify active timers', () => {
    expect(timerCoordinator.isTimerActive('nonexistent')).toBe(false);

    registerRestTimer('push_ups_set_1', 'Push-ups', 1, 90);
    expect(timerCoordinator.isTimerActive('push_ups_set_1')).toBe(true);
    expect(timerCoordinator.isTimerActive('other_timer')).toBe(false);
  });

  it('should simulate the original bug scenario and verify fix', () => {
    // Simulate the scenario: user completes set and both timer systems try to start
    
    // Legacy system starts timer
    registerRestTimer('push_ups_set_2', 'Push-ups', 2, 305, 'legacy'); // 5:05 timer
    
    // Modern system tries to start timer (this would cause the bug)
    registerRestTimer('chest_dips_set_1', 'Chest Dips', 1, 7, 'global'); // 0:07 timer
    
    // Verify only one timer is active (the last one)
    const activeTimer = getCurrentTimer();
    expect(activeTimer?.timerId).toBe('chest_dips_set_1');
    expect(activeTimer?.exerciseName).toBe('Chest Dips');
    expect(activeTimer?.targetTime).toBe(7);
    
    // Verify the first timer was stopped
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Stopping existing timer push_ups_set_2')
    );
  });

  it('should reset properly', () => {
    registerRestTimer('push_ups_set_1', 'Push-ups', 1, 90);
    expect(getCurrentTimer()).toBeDefined();

    timerCoordinator.reset();
    expect(getCurrentTimer()).toBeNull();
  });
});