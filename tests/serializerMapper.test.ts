import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => {
  const invoke = vi.fn().mockResolvedValue({ data: { workout_id: 'mock123' }, error: null });
  const from = vi.fn().mockReturnValue({
    insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'mockW1' }, error: null }) }) }),
    update: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
  });
  const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) };
  return { supabase: { functions: { invoke }, from, auth } };
});

import { saveWorkout } from '@/services/workoutSaveService';

describe('Serializer/Mapper (failing first)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('preserves null rest in payload (no coalesce to 60)', async () => {
    const userData = { id: 'user-1' } as any;
    const workoutData = {
      name: 'Test',
      training_type: 'strength',
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      duration: 10,
      notes: null,
      metadata: {}
    };
    const exercises = {
      'Bench Press': [
        { weight: 100, reps: 5, completed: true, restTime: undefined } as any,
      ]
    };

    await saveWorkout({ userData, workoutData, exercises });

    // Inspect the mocked edge function call
    const { supabase } = await import('@/integrations/supabase/client');
    const call = (supabase.functions.invoke as any).mock.calls[0];
    const body = call[1].body;
    const sentSets = body.exercise_sets;

    // Desired: should preserve null/undefined, not coalesce to 60
    // This will FAIL currently because code uses `|| 60`
    expect(sentSets[0].rest_time ?? null).toBeNull();
  });
});

