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

  /**
   * Wire slots this product files people under, the first being the proposer.
   *
   * The APIs identify people by slot rather than index, so the number of slots is
   * also the ceiling on how many people a policy can name.
   */
  readonly personSlots: readonly string[];

  /** The backend key for an internal field name, or the name itself if unmapped. */
  backendKeyFor(internalName: string): string;

  /** The backend key for a field belonging to the person in a given slot. */
  backendKeyForSlot(slot: string, internalName: string): string;

  /**
   * The backend key for a field as answered in a particular section.
   *
   * The joint proposer's section reuses the customer's field names, so both
   * directions of the translation have to agree on whose answers they are looking
   * at. Outbound and inbound both go through this, which is what keeps them from
   * disagreeing.
   */
  backendKeyForSection(sectionId: string, internalName: string): string;

  /** The internal field name for a backend key, or the key itself if unmapped. */
  internalNameFor(backendKey: string): string;

  /**
   * Translates an internal value to its coded wire form, or null when the value is
   * absent and should not be sent.
   */
  toWireValueFor(internalName: string, value: unknown): string | null;

  /** Translates a coded wire value back to the value the form uses. */
  fromWireValueFor(internalName: string, value: unknown): unknown;
}
