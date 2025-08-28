/**
 * UI tests for EnhancedExerciseCard bodyweight load badges
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
// Note: we intentionally do NOT import the component or provider statically so
// that vitest's vi.mock() can replace module implementations before import.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Exercise } from '@/types/exercise';

// Use typed mocks from src/__mocks__
vi.mock('@/config/flags');
import * as flags from '@/config/flags';

// Use typed mocks from src/__mocks__
vi.mock('@/providers/ProfileProvider');
import * as profileProvider from '@/providers/ProfileProvider';

// Mock the exercise variants hook
vi.mock('@/hooks/useExerciseVariants', () => ({
  useExerciseVariants: () => ({
    variants: [],
    recommendations: [],
    getProgressionTrend: () => 'stable',
    getLastPerformed: () => null,
    getPersonalBest: () => null,
  })
}));

const createMockExercise = (overrides: Partial<Exercise>): Exercise => ({
  id: 'test-exercise',
  name: 'Test Exercise',
  user_id: 'test-user',
  created_at: new Date().toISOString(),
  description: 'Test exercise description',
  primary_muscle_groups: ['chest'],
  secondary_muscle_groups: [],
  equipment_type: ['bodyweight'],
  movement_pattern: 'push',
  difficulty: 'intermediate',
  instructions: {},
  is_compound: false,
  tips: [],
  variations: [],
  metadata: {},
  type: 'reps',
  is_bodyweight: true,
  bw_multiplier: 0.65,
  ...overrides
});

const renderWithProviders = async (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const { ProfileProvider } = await import('@/providers/ProfileProvider');

  return render(
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        {component}
      </ProfileProvider>
    </QueryClientProvider>
  );
};

describe('EnhancedExerciseCard Bodyweight Load Badges', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('when BW_LOADS_ENABLED flag is on', () => {
    beforeEach(() => {
      (flags.useFeatureFlag as any).mockReturnValue(true);
    });

    it('shows estimated load badge for bodyweight reps exercise with profile weight', async () => {
      (profileProvider.useBodyweightKg as any).mockReturnValue(80);

      const exercise = createMockExercise({
        name: 'Push-ups',
        type: 'reps',
        bw_multiplier: 0.65
      });

      const { EnhancedExerciseCard } = await import('../EnhancedExerciseCard');
      await renderWithProviders(
        <EnhancedExerciseCard exercise={exercise} />
      );

      // Should show estimated load badge with profile weight
      expect(screen.getByText(/Est\. Load @ 80 kg:/)).toBeInTheDocument();
      expect(screen.getByText(/≈52 kg/)).toBeInTheDocument();
      expect(screen.queryByText(/\(default\)/)).not.toBeInTheDocument();
    });

    it('shows estimated load badge with default marker when using 70kg fallback', async () => {
      (profileProvider.useBodyweightKg as any).mockReturnValue(70);

      const exercise = createMockExercise({
        name: 'Pull-ups',
        type: 'reps',
        bw_multiplier: 0.95
      });

      const { EnhancedExerciseCard } = await import('../EnhancedExerciseCard');
      await renderWithProviders(
        <EnhancedExerciseCard exercise={exercise} />
      );

      // Should show estimated load badge with default marker
      expect(screen.getByText(/Est\. Load @ 70 kg \(default\):/)).toBeInTheDocument();
      expect(screen.getByText(/≈66\.5 kg/)).toBeInTheDocument();
    });

    it('shows isometric load badge for hold/time exercises', async () => {
      (profileProvider.useBodyweightKg as any).mockReturnValue(90);

      const exercise = createMockExercise({
        name: 'Plank',
        type: 'hold',
        bw_multiplier: 0.25,
        static_posture_factor: 1.0
      });

      const { EnhancedExerciseCard } = await import('../EnhancedExerciseCard');
      await renderWithProviders(
        <EnhancedExerciseCard exercise={exercise} />
      );

      // Should show isometric load badge
      expect(screen.getByText(/Isometric load:/)).toBeInTheDocument();
      expect(screen.getByText(/22\.5 kg/)).toBeInTheDocument();
    });

    it('applies static posture factor for isometric exercises', async () => {
      (profileProvider.useBodyweightKg as any).mockReturnValue(80);

      const exercise = createMockExercise({
        name: 'L-Sit',
        type: 'hold',
        bw_multiplier: 0.7,
        static_posture_factor: 1.2
      });

      const { EnhancedExerciseCard } = await import('../EnhancedExerciseCard');
      await renderWithProviders(
        <EnhancedExerciseCard exercise={exercise} />
      );

      // Should show adjusted isometric load (80 * 0.7 * 1.2 = 67.2)
      expect(screen.getByText(/67\.2 kg/)).toBeInTheDocument();
    });

    it('does not show badges for non-bodyweight exercises', async () => {
      (profileProvider.useBodyweightKg as any).mockReturnValue(80);

      const exercise = createMockExercise({
        name: 'Barbell Bench Press',
        is_bodyweight: false,
        equipment_type: ['barbell'],
        bw_multiplier: undefined
      });

      const { EnhancedExerciseCard } = await import('../EnhancedExerciseCard');
      await renderWithProviders(
        <EnhancedExerciseCard exercise={exercise} />
      );

      // Should not show any load badges
      expect(screen.queryByText(/Est\. Load/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Isometric load/)).not.toBeInTheDocument();
    });

    it('includes proper accessibility labels', async () => {
      (profileProvider.useBodyweightKg as any).mockReturnValue(80);

      const exercise = createMockExercise({
        name: 'Push-ups',
        type: 'reps',
        bw_multiplier: 0.65
      });

      const { EnhancedExerciseCard } = await import('../EnhancedExerciseCard');
      await renderWithProviders(
        <EnhancedExerciseCard exercise={exercise} />
      );

      const badge = screen.getByLabelText(/Estimated load per rep: 52 kg using profile bodyweight/);
      expect(badge).toBeInTheDocument();
    });
  });

  describe('when BW_LOADS_ENABLED flag is off', () => {
    beforeEach(() => {
      (flags.useFeatureFlag as any).mockReturnValue(false);
    });

    it('hides load badges when feature flag is disabled', async () => {
      (profileProvider.useBodyweightKg as any).mockReturnValue(80);

      const exercise = createMockExercise({
        name: 'Push-ups',
        type: 'reps',
        bw_multiplier: 0.65
      });

      const { EnhancedExerciseCard } = await import('../EnhancedExerciseCard');
      await renderWithProviders(
        <EnhancedExerciseCard exercise={exercise} />
      );

      // Should not show any load badges when flag is off
      expect(screen.queryByText(/Est\. Load/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Isometric load/)).not.toBeInTheDocument();
    });
  });

  describe('specific exercise calculations', () => {
    beforeEach(() => {
      (flags.useFeatureFlag as any).mockReturnValue(true);
    });

    it('calculates hanging leg raise load correctly', async () => {
      (profileProvider.useBodyweightKg as any).mockReturnValue(80);

      const exercise = createMockExercise({
        name: 'Hanging Leg Raise',
        type: 'reps',
        bw_multiplier: 0.60
      });

      const { EnhancedExerciseCard } = await import('../EnhancedExerciseCard');
      await renderWithProviders(
        <EnhancedExerciseCard exercise={exercise} />
      );

      // Should show 80 * 0.60 = 48 kg
      expect(screen.getByText(/≈48 kg/)).toBeInTheDocument();
    });

    it('calculates hanging knee raise load correctly', async () => {
      (profileProvider.useBodyweightKg as any).mockReturnValue(80);

      const exercise = createMockExercise({
        name: 'Hanging Knee Raise',
        type: 'reps',
        bw_multiplier: 0.45
      });

      const { EnhancedExerciseCard } = await import('../EnhancedExerciseCard');
      await renderWithProviders(
        <EnhancedExerciseCard exercise={exercise} />
      );

      // Should show 80 * 0.45 = 36 kg
      expect(screen.getByText(/≈36 kg/)).toBeInTheDocument();
    });
  });
});