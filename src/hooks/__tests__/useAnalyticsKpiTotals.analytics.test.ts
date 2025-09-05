import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAnalyticsKpiTotals } from '../useAnalyticsKpiTotals';
import { FEATURE_FLAGS } from '@/constants/featureFlags';

// Mock feature flags
vi.mock('@/constants/featureFlags', () => ({
  FEATURE_FLAGS: {
    ANALYTICS_DERIVED_KPIS_ENABLED: true,
    KPI_DIAGNOSTICS_ENABLED: true,
  },
}));

// Mock console for debugging
const originalConsoleDebug = console.debug;
beforeEach(() => {
  console.debug = vi.fn();
});

afterEach(() => {
  console.debug = originalConsoleDebug;
});

describe('Analytics KPI Totals - Rest Time Fix', () => {
  it('should emit canonical avg_rest_sec from v2Data when available', () => {
    const v2Data = {
      kpis: {
        avg_rest_sec: 75.5,
        sets: 10,
      },
    };

    const { renderHook } = require('@testing-library/react');
    const { result } = renderHook(() => useAnalyticsKpiTotals(v2Data));
    
    expect(result.current.derivedTotals.avg_rest_sec).toBe(75.5);
    expect(result.current.diagnostics?.avg_rest_sec).toBe('v2');
  });

  it('should calculate avg_rest_sec from rest_min when v2Data unavailable', () => {
    const legacyData = {
      totals: {
        sets: 10,
        rest_min: 15, // 15 minutes
        duration_min: 60,
        tonnage_kg: 1000,
        reps: 100,
      },
    };

    const { renderHook } = require('@testing-library/react');
    const { result } = renderHook(() => useAnalyticsKpiTotals(undefined, legacyData));
    
    // 15 minutes * 60 seconds / 10 sets = 90 seconds per set
    expect(result.current.derivedTotals.avg_rest_sec).toBe(90);
    expect(result.current.diagnostics?.avg_rest_sec).toBe('rest_min_per_set');
  });

  it('should handle rest_min = 0 correctly (not undefined)', () => {
    const legacyData = {
      totals: {
        sets: 5,
        rest_min: 0, // Zero rest time (edge case)
        duration_min: 30,
        tonnage_kg: 500,
        reps: 50,
      },
    };

    const { renderHook } = require('@testing-library/react');
    const { result } = renderHook(() => useAnalyticsKpiTotals(undefined, legacyData));
    
    // 0 minutes * 60 seconds / 5 sets = 0 seconds per set (valid calculation)
    expect(result.current.derivedTotals.avg_rest_sec).toBe(0);
    expect(result.current.diagnostics?.avg_rest_sec).toBe('rest_min_per_set');
  });

  it('should emit canonical totals with avg_rest_sec = 0 when no data available', () => {
    const noRestData = {
      totals: {
        sets: 5,
        duration_min: 30,
        tonnage_kg: 500,
        reps: 50,
        // No rest_min field
      },
    };

    const { renderHook } = require('@testing-library/react');
    const { result } = renderHook(() => useAnalyticsKpiTotals(undefined, { totals: noRestData.totals }));
    
    // Per invariant: all analytics hooks must emit canonical totals
    expect(result.current.derivedTotals.avg_rest_sec).toBe(0);
    expect(result.current.diagnostics?.avg_rest_sec).toBe('none');
  });

  it('should emit all canonical totals per invariant', () => {
    const data = {
      totals: {
        sets: 187, // User's data
        reps: 1500,
        duration_min: 716, // ~12 hours
        tonnage_kg: 15000,
        rest_min: 13, // 13 minutes rest
      },
    };

    const { renderHook } = require('@testing-library/react');
    const { result } = renderHook(() => useAnalyticsKpiTotals(undefined, data));
    
    const { baseTotals, derivedTotals } = result.current;
    
    // Verify all canonical base totals are present
    expect(baseTotals).toHaveProperty('sets', 187);
    expect(baseTotals).toHaveProperty('reps', 1500);
    expect(baseTotals).toHaveProperty('duration_min', 716);
    expect(baseTotals).toHaveProperty('tonnage_kg', 15000);
    expect(baseTotals).toHaveProperty('density_kg_per_min');
    expect(baseTotals).toHaveProperty('rest_min', 13);
    
    // Verify all canonical derived totals are present
    expect(derivedTotals).toHaveProperty('avg_rest_sec');
    expect(derivedTotals).toHaveProperty('set_efficiency_kg_per_min');
    
    // Verify avg_rest_sec calculation: 13min * 60sec / 187sets ≈ 4.17 seconds per set
    expect(derivedTotals.avg_rest_sec).toBeCloseTo(4.17, 2);
    expect(result.current.diagnostics?.avg_rest_sec).toBe('rest_min_per_set');
  });

  it('should handle edge case where sets = 0 gracefully', () => {
    const zeroSetsData = {
      totals: {
        sets: 0,
        rest_min: 10,
        duration_min: 30,
        tonnage_kg: 0,
        reps: 0,
      },
    };

    const { renderHook } = require('@testing-library/react');
    const { result } = renderHook(() => useAnalyticsKpiTotals(undefined, zeroSetsData));
    
    // When no sets, should still emit canonical total
    expect(result.current.derivedTotals.avg_rest_sec).toBe(0);
    expect(result.current.diagnostics?.avg_rest_sec).toBe('none');
  });
});