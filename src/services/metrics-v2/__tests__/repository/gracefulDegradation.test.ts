import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseMetricsRepository } from '../../repository/supabase';

// Mock Supabase client
const mockClient = {
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  in: vi.fn(),
  or: vi.fn(),
  limit: vi.fn(),
  gte: vi.fn(),
  lt: vi.fn(),
  order: vi.fn(),
};

// Chain mock methods
mockClient.from.mockReturnValue(mockClient);
mockClient.select.mockReturnValue(mockClient);
mockClient.eq.mockReturnValue(mockClient);
mockClient.in.mockReturnValue(mockClient);
mockClient.or.mockReturnValue(mockClient);
mockClient.limit.mockReturnValue(mockClient);
mockClient.gte.mockReturnValue(mockClient);
mockClient.lt.mockReturnValue(mockClient);
mockClient.order.mockReturnValue(mockClient);

describe('SupabaseMetricsRepository Graceful Degradation', () => {
  let repository: SupabaseMetricsRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SupabaseMetricsRepository();
    // Mock the client property
    (repository as any).client = mockClient;
    (repository as any).isInitialized = true;
  });

  it('probes timing columns availability correctly', async () => {
    // Test successful probe (timing columns exist)
    mockClient.limit.mockResolvedValueOnce({ error: null, data: [] });
    
    const available = await (repository as any).probeTimingColumns();
    expect(available).toBe(true);
    expect(mockClient.from).toHaveBeenCalledWith('exercise_sets');
    expect(mockClient.select).toHaveBeenCalledWith('timing_quality, rest_ms');
    expect(mockClient.limit).toHaveBeenCalledWith(1);
  });

  it('handles missing timing columns gracefully', async () => {
    // Test probe failure (timing columns missing)
    mockClient.limit.mockResolvedValueOnce({
      error: { message: 'column "timing_quality" does not exist', code: '42703' },
      data: null
    });
    
    const available = await (repository as any).probeTimingColumns();
    expect(available).toBe(false);
  });

  it('caches probe result to avoid repeated checks', async () => {
    // Mock successful workout ownership check
    mockClient.eq.mockResolvedValueOnce({ error: null, data: [{ id: 'w1' }] });
    
    // Mock successful timing probe
    mockClient.limit.mockResolvedValueOnce({ error: null, data: [] });
    
    // Mock successful sets query
    mockClient.or.mockResolvedValueOnce({ 
      error: null, 
      data: [{
        id: 's1',
        workout_id: 'w1',
        exercise_name: 'bench',
        weight: 50,
        reps: 5,
        timing_quality: 'actual'
      }]
    });

    // First call should probe timing columns
    const result1 = await repository.getSets(['w1'], 'user1');
    expect(result1).toHaveLength(1);
    
    // Second call should not probe again (cached result)
    const probeCallsBefore = mockClient.limit.mock.calls.length;
    await repository.getSets(['w1'], 'user1');
    const probeCallsAfter = mockClient.limit.mock.calls.length;
    
    // Probe should not have been called again
    expect(probeCallsAfter).toBe(probeCallsBefore);
  });

  it('returns consistent interface regardless of schema state', async () => {
    // Mock workouts ownership check
    mockClient.eq.mockResolvedValueOnce({ error: null, data: [{ id: 'w1' }] });
    
    // Test with timing columns available
    (repository as any).timingColumnsAvailable = true;
    mockClient.or.mockResolvedValueOnce({ 
      error: null, 
      data: [{
        id: 's1',
        workout_id: 'w1',
        exercise_name: 'bench',
        weight: 50,
        reps: 5,
        timing_quality: 'actual',
        rest_ms: 60000
      }]
    });
    
    const enhancedResult = await repository.getSets(['w1'], 'user1');
    expect(enhancedResult[0]).toHaveProperty('timingQuality');
    expect(enhancedResult[0].timingQuality).toBe('actual');
    
    // Test with timing columns unavailable
    (repository as any).timingColumnsAvailable = false;
    mockClient.or.mockResolvedValueOnce({ 
      error: null, 
      data: [{
        id: 's2',
        workout_id: 'w1',
        exercise_name: 'squat',
        weight: 60,
        reps: 8
      }]
    });
    
    const legacyResult = await repository.getSets(['w1'], 'user1');
    expect(legacyResult[0]).toHaveProperty('timingQuality');
    expect(legacyResult[0].timingQuality).toBe('legacy');
  });
});