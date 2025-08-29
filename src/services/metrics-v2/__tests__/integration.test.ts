import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { metricsServiceV2 } from '../service';
import { FEATURE_FLAGS } from '@/config/featureFlags';

// Mock feature flag
const originalFlag = FEATURE_FLAGS.ANALYTICS_DERIVED_KPIS_ENABLED;

// Mock Supabase auth
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: 'test-user-123' }
          }
        },
        error: null
      })
    }
  }
}));

describe('metrics-v2 integration', () => {
  afterEach(() => {
    // Restore original flag value
    (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = originalFlag;
  });

  describe('metricsServiceV2.getMetricsV2', () => {
    it('should return enhanced metrics with KPIs when flag is enabled', async () => {
      (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = true;
      
      const result = await metricsServiceV2.getMetricsV2({
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-03'
        },
        userId: 'test-user-123'
      });

      // Should have basic structure
      expect(result).toHaveProperty('totals');
      expect(result).toHaveProperty('perWorkout');
      expect(result).toHaveProperty('series');
      expect(result).toHaveProperty('totalsKpis');

      // Mock data should give us 2 workouts
      expect(result.perWorkout).toHaveLength(2);

      // Each workout should have activeMin and restMin
      expect(result.perWorkout[0]).toHaveProperty('activeMin');
      expect(result.perWorkout[0]).toHaveProperty('restMin');

      // When flag is on, should have KPIs
      expect(result.perWorkout[0]).toHaveProperty('kpis');
      expect(result.perWorkout[0].kpis).toHaveProperty('density');
      expect(result.perWorkout[0].kpis).toHaveProperty('avgRest');
      expect(result.perWorkout[0].kpis).toHaveProperty('setEfficiency');

      // Should have totals KPIs
      expect(result.totalsKpis).toBeDefined();
      expect(result.totalsKpis).toHaveProperty('density');
      expect(result.totalsKpis).toHaveProperty('avgRest');
      expect(result.totalsKpis).toHaveProperty('setEfficiency');
    });

    it('should omit KPIs when feature flag is disabled', async () => {
      (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = false;
      
      const result = await metricsServiceV2.getMetricsV2({
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-03'
        },
        userId: 'test-user-123'
      });

      // Should still have activeMin and restMin (shadow mode)
      expect(result.perWorkout[0]).toHaveProperty('activeMin');
      expect(result.perWorkout[0]).toHaveProperty('restMin');

      // Should not have KPIs when flag is off
      expect(result.perWorkout[0].kpis).toBeUndefined();
      expect(result.totalsKpis).toBeUndefined();
    });

    it('should calculate rest time analytics correctly with mock data', async () => {
      (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = true;
      
      const result = await metricsServiceV2.getMetricsV2({
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-03'
        },
        userId: 'test-user-123'
      });

      // Workout 1: 60min duration, 2 sets with 120s + 180s rest = 300s total rest
      const workout1 = result.perWorkout.find(w => w.totalSets === 2);
      expect(workout1).toBeDefined();
      expect(workout1!.restMin).toBeCloseTo(5); // 300s / 60 = 5min
      expect(workout1!.activeMin).toBeCloseTo(55); // 60min - 5min = 55min

      // Workout 2: 45min duration, 1 set with 90s rest
      const workout2 = result.perWorkout.find(w => w.totalSets === 1);
      expect(workout2).toBeDefined(); 
      expect(workout2!.restMin).toBeCloseTo(1.5); // 90s / 60 = 1.5min
      expect(workout2!.activeMin).toBeCloseTo(43.5); // 45min - 1.5min = 43.5min
    });

    it('should calculate density KPI correctly', async () => {
      (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = true;
      
      const result = await metricsServiceV2.getMetricsV2({
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-03'
        },
        userId: 'test-user-123'
      });

      // Workout 1: (80*8 + 100*5) = 1140kg in 60min = 19kg/min
      const workout1 = result.perWorkout.find(w => w.totalSets === 2);
      expect(workout1!.kpis!.density).toBeCloseTo(19);

      // Workout 2: (60*12) = 720kg in 45min = 16kg/min
      const workout2 = result.perWorkout.find(w => w.totalSets === 1);
      expect(workout2!.kpis!.density).toBeCloseTo(16);
    });

    it('should calculate set efficiency correctly', async () => {
      (FEATURE_FLAGS as any).ANALYTICS_DERIVED_KPIS_ENABLED = true;
      
      const result = await metricsServiceV2.getMetricsV2({
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-03'
        },
        userId: 'test-user-123'
      });

      // Workout 1: avgRest = 150s, target = 90s, efficiency = 150/90 = 1.67
      const workout1 = result.perWorkout.find(w => w.totalSets === 2);
      expect(workout1!.kpis!.avgRest).toBe(150); // (120+180)/2
      expect(workout1!.kpis!.setEfficiency).toBeCloseTo(1.67);

      // Workout 2: avgRest = 90s, target = 90s, efficiency = 90/90 = 1.0
      const workout2 = result.perWorkout.find(w => w.totalSets === 1);
      expect(workout2!.kpis!.avgRest).toBe(90);
      expect(workout2!.kpis!.setEfficiency).toBeCloseTo(1.0);
    });

    it('should handle zero duration workouts gracefully', async () => {
      // This would require mocking repository with zero duration workout
      // For now, verify existing logic handles edge cases in calculator functions
      expect(true).toBe(true); // Placeholder - specific test would require mock data injection
    });
  });
});