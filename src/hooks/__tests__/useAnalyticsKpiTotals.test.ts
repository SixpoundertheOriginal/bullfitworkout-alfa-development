import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAnalyticsKpiTotals } from '../useAnalyticsKpiTotals';

// Mock feature flags
vi.mock('@/constants/featureFlags', () => ({
  useFeatureFlags: vi.fn(() => ({
    ANALYTICS_DERIVED_KPIS_ENABLED: true,
    KPI_DIAGNOSTICS_ENABLED: false,
  })),
  FEATURE_FLAGS: {
    ANALYTICS_DERIVED_KPIS_ENABLED: true,
    KPI_DIAGNOSTICS_ENABLED: false,
  }
}));

describe('useAnalyticsKpiTotals', () => {
  const mockUseFeatureFlags = vi.mocked(
    require('@/constants/featureFlags').useFeatureFlags
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFeatureFlags.mockReturnValue({
      ANALYTICS_DERIVED_KPIS_ENABLED: true,
      KPI_DIAGNOSTICS_ENABLED: false,
    });
  });

  describe('with complete V2 data', () => {
    const v2DataComplete = {
      totals: {
        sets: 20,
        reps: 200,
        duration_min: 60,
        tonnage_kg: 2000,
        density_kg_per_min: 33.33,
        rest_min: 15,
        active_min: 45,
      },
      kpis: {
        avg_rest_sec: 120,
        set_efficiency_kg_per_min: 44.44,
      },
    };

    it('should compute all base and derived totals correctly', () => {
      const { result } = renderHook(() =>
        useAnalyticsKpiTotals(v2DataComplete, undefined)
      );

      expect(result.current.baseTotals).toEqual({
        sets: 20,
        reps: 200,
        duration_min: 60,
        tonnage_kg: 2000,
        density_kg_per_min: 33.33,
        rest_min: 15,
        active_min: 45,
      });

      expect(result.current.derivedTotals.avg_reps_per_set).toBeCloseTo(10, 2);
      expect(result.current.derivedTotals.avg_tonnage_per_set_kg).toBeCloseTo(100, 2);
      expect(result.current.derivedTotals.avg_tonnage_per_rep_kg).toBeCloseTo(10, 2);
      expect(result.current.derivedTotals.avg_rest_sec).toBe(120);
      expect(result.current.derivedTotals.avg_duration_per_set_min).toBeCloseTo(3, 2);
      expect(result.current.derivedTotals.set_efficiency_kg_per_min).toBe(44.44);
    });
  });

  describe('with missing derived fields but rest_min/active_min present', () => {
    const v2DataWithFallbacks = {
      totals: {
        sets: 10,
        reps: 100,
        duration_min: 40,
        tonnage_kg: 1500,
        density_kg_per_min: 37.5,
        rest_min: 10,
        active_min: 30,
      },
    };

    it('should use fallback calculations', () => {
      const { result } = renderHook(() =>
        useAnalyticsKpiTotals(v2DataWithFallbacks, undefined)
      );

      expect(result.current.derivedTotals.avg_rest_sec).toBe(60); // (10 * 60) / 10
      expect(result.current.derivedTotals.set_efficiency_kg_per_min).toBe(50); // 1500 / 30
    });
  });

  describe('with zero values (edge case)', () => {
    const zeroData = {
      totals: {
        sets: 0,
        reps: 0,
        duration_min: 0,
        tonnage_kg: 0,
        density_kg_per_min: 0,
      },
    };

    it('should return 0 for all derived values without NaN/Infinity', () => {
      const { result } = renderHook(() =>
        useAnalyticsKpiTotals(zeroData, undefined)
      );

      expect(result.current.derivedTotals.avg_reps_per_set).toBe(0);
      expect(result.current.derivedTotals.avg_tonnage_per_set_kg).toBe(0);
      expect(result.current.derivedTotals.avg_tonnage_per_rep_kg).toBe(0);
      expect(result.current.derivedTotals.avg_duration_per_set_min).toBe(0);
      expect(result.current.derivedTotals.avg_rest_sec).toBeUndefined();
      
      // Check no NaN or Infinity values
      Object.values(result.current.derivedTotals).forEach(value => {
        if (typeof value === 'number') {
          expect(Number.isFinite(value)).toBe(true);
        }
      });
    });
  });

  describe('when ANALYTICS_DERIVED_KPIS_ENABLED is false', () => {
    beforeEach(() => {
      mockUseFeatureFlags.mockReturnValue({
        ANALYTICS_DERIVED_KPIS_ENABLED: false,
        KPI_DIAGNOSTICS_ENABLED: false,
      });
    });

    it('should return empty derivedTotals', () => {
      const v2Data = {
        totals: {
          sets: 10,
          reps: 100,
          duration_min: 30,
          tonnage_kg: 1000,
          density_kg_per_min: 33.33,
        },
      };

      const { result } = renderHook(() =>
        useAnalyticsKpiTotals(v2Data, undefined)
      );

      expect(result.current.derivedTotals).toEqual({});
    });
  });

  describe('when KPI_DIAGNOSTICS_ENABLED is true', () => {
    beforeEach(() => {
      mockUseFeatureFlags.mockReturnValue({
        ANALYTICS_DERIVED_KPIS_ENABLED: true,
        KPI_DIAGNOSTICS_ENABLED: true,
      });
    });

    it('should include diagnostics with source information', () => {
      const v2Data = {
        totals: {
          sets: 5,
          reps: 50,
          duration_min: 20,
          tonnage_kg: 500,
          density_kg_per_min: 25,
        },
        kpis: {
          avg_rest_sec: 90,
        },
      };

      const { result } = renderHook(() =>
        useAnalyticsKpiTotals(v2Data, undefined)
      );

      expect(result.current.diagnostics).toBeDefined();
      expect(result.current.diagnostics?.avg_rest_sec).toBe('v2');
      expect(result.current.diagnostics?.set_efficiency_kg_per_min).toBe('density_fallback');
    });
  });

  describe('diagnostics for fallback sources', () => {
    beforeEach(() => {
      mockUseFeatureFlags.mockReturnValue({
        ANALYTICS_DERIVED_KPIS_ENABLED: true,
        KPI_DIAGNOSTICS_ENABLED: true,
      });
    });

    it('should record rest_min_per_set and active_min sources', () => {
      const v2Data = {
        totals: {
          sets: 10,
          reps: 100,
          duration_min: 40,
          tonnage_kg: 1500,
          density_kg_per_min: 37.5,
          rest_min: 10,
          active_min: 30,
        },
      };

      const { result } = renderHook(() =>
        useAnalyticsKpiTotals(v2Data, undefined)
      );

      expect(result.current.diagnostics?.avg_rest_sec).toBe('rest_min_per_set');
      expect(result.current.diagnostics?.set_efficiency_kg_per_min).toBe('active_min');
    });
  });
});