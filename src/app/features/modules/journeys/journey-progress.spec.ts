import { MOTOR_JOURNEY } from './motor.journey';
import {
  firstIncompleteStep,
  firstIncompleteStepIndex,
  isStepOfferable,
  isStepUnlocked,
  stepStatus,
} from './journey-progress';

const STEPS = MOTOR_JOURNEY.steps;

/** Completion check backed by a plain list, so the helpers stay under test alone. */
function completed(...stepNames: readonly string[]) {
  return (stepName: string) => stepNames.includes(stepName);
}

const NONE = completed();

describe('journey progress', () => {
  it('places a customer who has completed nothing on the first step', () => {
    expect(firstIncompleteStepIndex(STEPS, NONE)).toBe(0);
    expect(firstIncompleteStep(STEPS, NONE).name).toBe('your-details');
  });

  it('moves the frontier along as steps are completed', () => {
    const isComplete = completed('your-details', 'your-vehicle');

    expect(firstIncompleteStep(STEPS, isComplete).name).toBe('additional-drivers');
  });

  it('keeps the frontier on the last step once everything is complete', () => {
    const isComplete = completed(...STEPS.map((step) => step.name));

    expect(firstIncompleteStepIndex(STEPS, isComplete)).toBe(STEPS.length - 1);
  });

  it('unlocks the frontier and everything before it, and nothing after', () => {
    const isComplete = completed('your-details');

    expect(isStepUnlocked(STEPS, 'your-details', isComplete)).toBe(true);
    expect(isStepUnlocked(STEPS, 'your-vehicle', isComplete)).toBe(true);
    expect(isStepUnlocked(STEPS, 'additional-drivers', isComplete)).toBe(false);
    expect(isStepUnlocked(STEPS, 'your-quotes', isComplete)).toBe(false);
  });

  it('re-locks a later step when an earlier one is not complete', () => {
    // Completing step 3 without step 2 must not unlock step 3: the frontier is
    // the first gap, not the furthest tick.
    const isComplete = completed('your-details', 'additional-drivers');

    expect(isStepUnlocked(STEPS, 'additional-drivers', isComplete)).toBe(false);
    expect(isStepUnlocked(STEPS, 'your-vehicle', isComplete)).toBe(true);
  });

  it('matches step names case-insensitively, as the route does', () => {
    expect(isStepUnlocked(STEPS, 'YOUR-DETAILS', NONE)).toBe(true);
  });

  it('never unlocks a step the journey does not have', () => {
    expect(isStepUnlocked(STEPS, 'not-a-step', NONE)).toBe(false);
  });

  it('offers the step Continue leads to, and nothing past it', () => {
    const isComplete = completed('your-details');

    // Standing on step 2, step 3 is where Continue goes, so it may be offered.
    expect(isStepOfferable(STEPS, 'additional-drivers', 'your-vehicle', isComplete)).toBe(true);
    expect(isStepOfferable(STEPS, 'your-policy', 'your-vehicle', isComplete)).toBe(false);
    // Being offerable is not the same as being reachable by URL.
    expect(isStepUnlocked(STEPS, 'additional-drivers', isComplete)).toBe(false);
  });

  it('offers nothing extra when the customer is nowhere in the journey', () => {
    expect(isStepOfferable(STEPS, 'your-vehicle', null, NONE)).toBe(false);
  });

  it('describes each step for the navigation', () => {
    const isComplete = completed('your-details');
    const statusOf = (name: string) =>
      stepStatus(
        STEPS,
        STEPS.find((step) => step.name === name)!,
        'your-vehicle',
        isComplete,
      );

    expect(statusOf('your-details')).toBe('complete');
    expect(statusOf('your-vehicle')).toBe('current');
    // Reachable by pressing Continue, so the list offers it too.
    expect(statusOf('additional-drivers')).toBe('unlocked');
    expect(statusOf('your-policy')).toBe('locked');
  });

  it('reports the current step as current even after it was completed', () => {
    const isComplete = completed('your-details', 'your-vehicle');

    expect(stepStatus(STEPS, STEPS[1], 'your-vehicle', isComplete)).toBe('current');
  });
});
