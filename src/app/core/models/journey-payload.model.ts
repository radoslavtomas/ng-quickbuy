import type { StepAnswers } from './journey.model';

/** Every answer captured for a journey: step name -> section id -> values. */
export type JourneyAnswers = Readonly<Record<string, StepAnswers>>;

/**
 * Translates between the journey's answers and an insurer's wire format.
 *
 * This is the only place that knows backend field names, so a contract change is a
 * mapper change rather than a form change. Each product has its own mapper with its
 * own version, because two products sharing a journey shape can still disagree about
 * what the backend expects.
 */
export interface JourneyPayloadMapper {
  /**
   * Identifies the contract this mapper implements. Bump it when the wire format
   * changes so a stored partial can be told apart from a current one.
   */
  readonly version: string;

  /**
   * Flattens the journey's answers into the key/value pairs the quote and
   * partial-store endpoints expect. Values are stringified because both endpoints
   * take form data.
   */
  toStoreFields(answers: JourneyAnswers): Record<string, string>;
}
