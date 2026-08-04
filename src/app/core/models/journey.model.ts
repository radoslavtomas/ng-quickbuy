import type { FormFieldConfig } from './form-field.model';

/** Identifies the shape of a questionnaire. Several modules share one journey. */
export type JourneyId = 'motor' | 'property';

/** Answers captured so far for a single step, keyed by section id. */
export type StepAnswers = Readonly<Record<string, Readonly<Record<string, unknown>>>>;

interface JourneySectionBase {
  /**
   * Stable identifier, unique within its step. Answers are stored under this key,
   * so it must not change once a journey is live.
   */
  readonly id: string;
  /** Card heading. Omit for a section that should render without a heading. */
  readonly title?: string;
  /**
   * Optional gate evaluated against the answers already captured for this step.
   * Used for sections that only make sense once something earlier is resolved.
   */
  readonly visibleWhen?: (answers: StepAnswers) => boolean;
}

/** A section rendered from field configuration by the generic form renderer. */
export interface JourneyFieldsSection extends JourneySectionBase {
  readonly kind: 'fields';
  readonly fields: readonly FormFieldConfig[];
  /** Seed values applied when the customer has not answered this section yet. */
  readonly defaults?: Readonly<Record<string, unknown>>;
}

/**
 * A section rendered by a bespoke component, for cases the field renderer cannot
 * express (address lookup, vehicle lookup, repeating claim lists).
 *
 * `component` is a key into the section component registry rather than a class
 * reference, so journey configuration stays free of component imports.
 */
export interface JourneyCustomSection extends JourneySectionBase {
  readonly kind: 'custom';
  readonly component: string;
}

export type JourneySection = JourneyFieldsSection | JourneyCustomSection;

export interface JourneyStepDefinition {
  /** URL slug for the step, e.g. `your-details`. */
  readonly name: string;
  readonly displayName: string;
  /** Font Awesome solid icon name without the `fa-` prefix. */
  readonly icon: string;
  /**
   * Step identifier expected by the partial-store API. Deliberately separate from
   * `name` so route slugs remain a presentation concern.
   */
  readonly storeStep: string;
  readonly sections: readonly JourneySection[];
  /** True for the terminal step, which shows results rather than questions. */
  readonly isOutcome?: boolean;
}

export interface JourneyDefinition {
  readonly id: JourneyId;
  readonly steps: readonly JourneyStepDefinition[];
}
