import { findModuleByCode } from '../../../core/config/module-catalogue';
import type { FormFieldConfig } from '../../../core/models/form-field.model';
import type {
  FieldsProvider,
  JourneyDefinition,
  JourneyFieldsSection,
  JourneyId,
  JourneyStepDefinition,
} from '../../../core/models/journey.model';
import { MOTOR_JOURNEY } from './motor.journey';
import { PROPERTY_JOURNEY } from './property.journey';

const JOURNEYS: Readonly<Record<JourneyId, JourneyDefinition>> = {
  motor: MOTOR_JOURNEY,
  property: PROPERTY_JOURNEY,
};

export function getJourney(journeyId: JourneyId): JourneyDefinition {
  return JOURNEYS[journeyId];
}

/**
 * Resolves the journey a module runs, or null when the code is not in the
 * catalogue. Deliberately returns null rather than defaulting to a journey: a
 * wrong default would show a customer the wrong product's questions.
 */
export function getJourneyForModule(
  moduleCode: string | null | undefined,
): JourneyDefinition | null {
  const module = findModuleByCode(moduleCode);
  return module ? JOURNEYS[module.journeyId] : null;
}

export function findStep(
  journey: JourneyDefinition,
  stepName: string | null | undefined,
): JourneyStepDefinition | null {
  if (!stepName) {
    return null;
  }

  const normalized = stepName.toLowerCase();
  return journey.steps.find((step) => step.name === normalized) ?? null;
}

export function getFirstStep(journey: JourneyDefinition): JourneyStepDefinition {
  return journey.steps[0];
}

export function getStepIndex(journey: JourneyDefinition, stepName: string): number {
  return journey.steps.findIndex((step) => step.name === stepName.toLowerCase());
}

export function getPreviousStep(
  journey: JourneyDefinition,
  stepName: string,
): JourneyStepDefinition | null {
  const index = getStepIndex(journey, stepName);
  return index > 0 ? journey.steps[index - 1] : null;
}

export function getNextStep(
  journey: JourneyDefinition,
  stepName: string,
): JourneyStepDefinition | null {
  const index = getStepIndex(journey, stepName);
  if (index < 0 || index >= journey.steps.length - 1) {
    return null;
  }

  return journey.steps[index + 1];
}

/** Human-facing step position, 1-based, for progress indicators and announcements. */
export function getStepNumber(journey: JourneyDefinition, stepName: string): number {
  return getStepIndex(journey, stepName) + 1;
}

export function isValidStepForModule(moduleCode: string, stepName: string): boolean {
  const journey = getJourneyForModule(moduleCode);
  return journey ? findStep(journey, stepName) !== null : false;
}

/** Every step that captures answers, i.e. everything before the outcome screen. */
export function getQuestionSteps(journey: JourneyDefinition): readonly JourneyStepDefinition[] {
  return journey.steps.filter((step) => !step.isOutcome);
}

export function getFieldsSections(step: JourneyStepDefinition): readonly JourneyFieldsSection[] {
  return step.sections.filter(
    (section): section is JourneyFieldsSection => section.kind === 'fields',
  );
}

/**
 * The questions a section asks for one module.
 *
 * The only place that decides whether a section's fields are fixed or
 * module-specific, so callers never have to know which kind they were given.
 */
export function resolveFields(
  provider: FieldsProvider,
  moduleCode: string,
): readonly FormFieldConfig[] {
  return typeof provider === 'function' ? provider(moduleCode) : provider;
}
