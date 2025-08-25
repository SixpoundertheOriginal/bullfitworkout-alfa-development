import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import { EnhancedWorkoutSetupWizard } from './EnhancedWorkoutSetupWizard';

vi.mock('@/constants/featureFlags', () => ({
  SETUP_CHOOSE_EXERCISES_ENABLED: true,
}));

vi.mock('./TrainingFocusSelector', () => ({
  TrainingFocusSelector: ({ onSelect }: any) => (
    <button onClick={() => onSelect({ category: 'Push', description: '', subFocus: [] })}>
      Select Focus
    </button>
  ),
}));

describe('EnhancedWorkoutSetupWizard', () => {
  test('shows mode modal after focus selection when flag on', () => {
    const onComplete = vi.fn();
    const onManualStart = vi.fn();
    render(
      <EnhancedWorkoutSetupWizard open={true} onOpenChange={() => {}} onComplete={onComplete} onManualStart={onManualStart} />
    );
    fireEvent.click(screen.getByText('Select Focus'));
    expect(screen.getByText('How would you like to start?')).toBeInTheDocument();
  });

  test('smart plan path triggers onComplete', async () => {
    const onComplete = vi.fn();
    render(
      <EnhancedWorkoutSetupWizard open={true} onOpenChange={() => {}} onComplete={onComplete} onManualStart={() => {}} />
    );
    fireEvent.click(screen.getByText('Select Focus'));
    fireEvent.click(screen.getByText('Generate Smart Plan'));
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
  });

  test('choose exercises calls onManualStart', () => {
    const onManualStart = vi.fn();
    render(
      <EnhancedWorkoutSetupWizard open={true} onOpenChange={() => {}} onComplete={() => {}} onManualStart={onManualStart} />
    );
    fireEvent.click(screen.getByText('Select Focus'));
    fireEvent.click(screen.getByText('Choose Exercises'));
    expect(onManualStart).toHaveBeenCalled();
  });

  test('modal dismissal returns to step 1', () => {
    render(
      <EnhancedWorkoutSetupWizard open={true} onOpenChange={() => {}} onComplete={() => {}} onManualStart={() => {}} />
    );
    fireEvent.click(screen.getByText('Select Focus'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('How would you like to start?')).not.toBeInTheDocument();
    expect(screen.getByText('Select Focus')).toBeInTheDocument();
  });
});

