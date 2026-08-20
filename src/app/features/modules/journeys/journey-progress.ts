import type { JourneyStepDefinition } from '../../../core/models/journey.model';

/**
 * Whether a step has been completed. Supplied by the caller so these helpers stay
 * pure and can be reasoned about without journey state.
 */
export type StepCompletionCheck = (stepName: string) => boolean;

/** How a step should be presented, and whether it may be opened at all. */
export type StepStatus = 'complete' | 'current' | 'unlocked' | 'locked';

type Steps = readonly JourneyStepDefinition[];

/**
 * Position of the first step the customer has not completed, which is as far as
 * they may go. Every step being complete yields the last index rather than one
 * past the end: there is nowhere beyond the final step to unlock.
 */
export function firstIncompleteStepIndex(steps: Steps, isComplete: StepCompletionCheck): number {
  const index = steps.findIndex((step) => !isComplete(step.name));
  return index === -1 ? steps.length - 1 : index;
}

/** The first step the customer has not completed, i.e. where they belong. */
export function firstIncompleteStep(
  steps: Steps,
  isComplete: StepCompletionCheck,
): JourneyStepDefinition {
  return steps[firstIncompleteStepIndex(steps, isComplete)];
}

/**
 * A step may be opened only once every earlier step is complete.
 *
 * Deliberately derived from completion rather than from a "furthest visited"
 * marker: skipping ahead would otherwise stay unlocked after the customer went
 * back and invalidated an answer a later step depends on.
 */
export function isStepUnlocked(
  steps: Steps,
  stepName: string,
  isComplete: StepCompletionCheck,
): boolean {
  const index = steps.findIndex((step) => step.name === stepName.toLowerCase());
  if (index < 0) {
    return false;
  }

  return index <= firstIncompleteStepIndex(steps, isComplete);
}

/**
 * Whether the navigation may offer a step from where the customer is standing.
 *
 * Wider than `isStepUnlocked` by exactly one step: the one immediately after the
 * current screen. Choosing it submits the current step first, which is precisely
 * what Continue does, so refusing to offer it would make the progress list a
 * worse version of the button beside it. Everything past that stays shut, and the
 * navigation still cannot reach a step the URL rule would refuse — submitting has
 * to succeed before the move happens.
 */
export function isStepOfferable(
  steps: Steps,
  stepName: string,
  currentStepName: string | null,
  isComplete: StepCompletionCheck,
): boolean {
  if (isStepUnlocked(steps, stepName, isComplete)) {
    return true;
  }

  const currentIndex = steps.findIndex((step) => step.name === currentStepName);
  const index = steps.findIndex((step) => step.name === stepName.toLowerCase());

  return currentIndex >= 0 && index === currentIndex + 1;
}

/**
 * How one step should be presented.
 *
 * The current step reports as `current` even once it is complete: where the
 * customer is matters more to them than what they have already ticked off.
 * `unlocked` means the customer may go there, whether or not this step has to be
 * submitted on the way.
 */
export function stepStatus(
  steps: Steps,
  step: JourneyStepDefinition,
  currentStepName: string | null,
  isComplete: StepCompletionCheck,
): StepStatus {
  if (step.name === currentStepName) {
    return 'current';
  }

  if (isComplete(step.name)) {
    return 'complete';
  }

  return isStepOfferable(steps, step.name, currentStepName, isComplete) ? 'unlocked' : 'locked';
}
