import { describe, it, expect } from 'vitest'
import { computePctOfSetsWithNonNullRest } from '../service'

describe('computePctOfSetsWithNonNullRest', () => {
  it('calculates rest coverage across workouts', () => {
    const sets = [
      { workoutId: 'w1', restTimeSec: null },
      { workoutId: 'w1', restTimeSec: 30 },
      { workoutId: 'w1', restTimeSec: null },
      { workoutId: 'w2', restTimeSec: null },
      { workoutId: 'w2', restTimeSec: 45 },
    ] as any
    const pct = computePctOfSetsWithNonNullRest(sets)
    expect(pct).toBeCloseTo(66.67, 2)
  })

  it('returns 0 when no rest data', () => {
    const sets = [
      { workoutId: 'w1', restTimeSec: null },
      { workoutId: 'w1', restTimeSec: null },
    ] as any
    const pct = computePctOfSetsWithNonNullRest(sets)
    expect(pct).toBe(0)
  })
})
