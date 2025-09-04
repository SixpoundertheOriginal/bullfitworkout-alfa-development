import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePredictiveRestTime, usePredictiveRestTimeWithState } from '../usePredictiveRestTime';

// Mock timer functions
const mockTimers = vi.hoisted(() => ({
  isTimerActive: vi.fn(() => false),
  getTimer: vi.fn(() => null),
}));

// Mock dependencies
vi.mock('@/hooks/useGlobalRestTimers', () => ({
  useGlobalRestTimers: () => ({
    generateTimerId: (exerciseId: string, setIndex: number) => `${exerciseId}-${setIndex}`,
    isTimerActive: mockTimers.isTimerActive,
    getTimer: mockTimers.getTimer,
  }),
}));

vi.mock('@/utils/formatTime', () => ({
  formatTime: (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}));

vi.mock('@/constants/featureFlags', () => ({
  FEATURE_FLAGS: {
    REST_TIMER_ANIMATIONS_ENABLED: true,
  },
}));

describe('usePredictiveRestTime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTimers.isTimerActive.mockReturnValue(false);
    mockTimers.getTimer.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test('returns null for first set (no rest time)', () => {
    const { result } = renderHook(() => 
      usePredictiveRestTime('bench', 1, undefined)
    );

    expect(result.current.displayRestTime).toBeNull();
    expect(result.current.isPredicted).toBe(false);
    expect(result.current.actualRestTime).toBeNull();
    expect(result.current.isTimerActive).toBe(false);
  });

  test('shows recorded rest time when available', () => {
    const { result } = renderHook(() => 
      usePredictiveRestTime('bench', 2, 90)
    );

    expect(result.current.displayRestTime).toBe('01:30');
    expect(result.current.isPredicted).toBe(false);
    expect(result.current.actualRestTime).toBe(90);
    expect(result.current.isTimerActive).toBe(false);
  });

  test('shows predicted time when timer is active', async () => {
    const mockStartTime = Date.now() - 60000; // 60 seconds ago
    
    mockTimers.isTimerActive.mockReturnValue(true);
    mockTimers.getTimer.mockReturnValue({
      isActive: true,
      startTime: mockStartTime,
      targetTime: 120,
      elapsedTime: 60,
      isCompleted: false,
      isOvertime: false,
    });

    const { result } = renderHook(() => 
      usePredictiveRestTime('bench', 2, undefined)
    );

    // Wait for effect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.displayRestTime).toBe('01:00');
    expect(result.current.isPredicted).toBe(true);
    expect(result.current.actualRestTime).toBeNull();
    expect(result.current.isTimerActive).toBe(true);
  });

  test('prefers recorded time over predicted time', () => {
    const mockStartTime = Date.now() - 30000; // 30 seconds ago
    
    mockTimers.isTimerActive.mockReturnValue(true);
    mockTimers.getTimer.mockReturnValue({
      isActive: true,
      startTime: mockStartTime,
      targetTime: 120,
      elapsedTime: 30,
      isCompleted: false,
      isOvertime: false,
    });

    const { result } = renderHook(() => 
      usePredictiveRestTime('bench', 2, 90) // Recorded time provided
    );

    expect(result.current.displayRestTime).toBe('01:30'); // Shows recorded, not predicted
    expect(result.current.isPredicted).toBe(false);
    expect(result.current.actualRestTime).toBe(90);
  });

  test('handles timer errors gracefully', () => {
    mockTimers.isTimerActive.mockReturnValue(true);
    mockTimers.getTimer.mockImplementation(() => {
      throw new Error('Timer error');
    });

    const { result } = renderHook(() => 
      usePredictiveRestTime('bench', 2, undefined)
    );

    expect(result.current.displayRestTime).toBeNull();
    expect(result.current.isPredicted).toBe(false);
    expect(result.current.actualRestTime).toBeNull();
  });
});

describe('usePredictiveRestTimeWithState', () => {
  test('provides enhanced state information for predicted time', async () => {
    const mockStartTime = Date.now() - 45000; // 45 seconds ago
    
    mockTimers.isTimerActive.mockReturnValue(true);
    mockTimers.getTimer.mockReturnValue({
      isActive: true,
      startTime: mockStartTime,
      targetTime: 90,
      elapsedTime: 45,
      isCompleted: false,
      isOvertime: false,
    });

    const { result } = renderHook(() => 
      usePredictiveRestTimeWithState('squat', 3, undefined)
    );

    // Wait for effect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.displayRestTime).toBe('00:45');
    expect(result.current.isPredicted).toBe(true);
    expect(result.current.shouldShowPulsing).toBe(true);
    expect(result.current.opacity).toBe(0.75);
    expect(result.current.className).toBe('italic font-light');
    expect(result.current.ariaLabel).toBe('Predicted rest time: 00:45');
  });

  test('provides enhanced state information for recorded time', () => {
    const { result } = renderHook(() => 
      usePredictiveRestTimeWithState('squat', 3, 120)
    );

    expect(result.current.displayRestTime).toBe('02:00');
    expect(result.current.isPredicted).toBe(false);
    expect(result.current.shouldShowPulsing).toBe(false);
    expect(result.current.opacity).toBe(1.0);
    expect(result.current.className).toBe('font-normal');
    expect(result.current.ariaLabel).toBe('Rest time: 02:00');
  });
});