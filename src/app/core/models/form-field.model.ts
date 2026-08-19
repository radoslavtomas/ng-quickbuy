import { ValidatorFn } from '@angular/forms';

export type FormFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'date'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  /** Search-driven field whose answer is an `AutocompleteOption`. */
  | 'autocomplete'
  /** Not a question: a value assembled from the section's other answers. */
  | 'derived';

export type ConditionOperator = 'equals' | 'notEquals' | 'in' | 'notIn' | 'truthy' | 'falsy';

export type NormalizationRule = 'trim' | 'phone' | 'date' | 'currency' | 'uppercase' | 'lowercase';

export type BuiltInValidatorType =
  'required' | 'email' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern';

export interface FormFieldOption {
  label: string;
  value: string | number | boolean;
  helpText?: string;
  disabled?: boolean;
}

export interface FieldCondition {
  field: string;
  operator: ConditionOperator;
  value?: unknown;
}

/** Named search backend an `autocomplete` field queries. */
export type AutocompleteEndpoint = 'occupation' | 'industry';

export interface AutocompleteConfig {
  endpoint: AutocompleteEndpoint;
}

/**
 * How a `derived` field's value is produced, and how it is taken apart again.
 *
 * A derived field exists because one insurer key can be answered several ways: an
 * occupation code comes from a search for an employee, from a dropdown for a
 * student, and from the employment status alone for a retired customer. Deriving
 * the value keeps a single wire key without asking the customer the same thing
 * twice, and — because it is recomputed from the current answers every time — it
 * cannot go stale when the customer changes their mind.
 */
export interface FieldDerivation {
  /** Produces the value from the section's other answers. */
  from: (values: Readonly<Record<string, unknown>>) => unknown;
  /**
   * Rebuilds the answers that would produce this value, used when a stored quote
   * is recalled and only the derived value came back.
   */
  toAnswers?: (
    value: unknown,
    values: Readonly<Record<string, unknown>>,
  ) => Record<string, unknown>;
}

export interface FieldMetadata {
  autocomplete?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  maxLengthCounter?: boolean;
  maskPattern?: string;
  radioLayout?: 'row' | 'column';
  valueTransform?: 'booleanYN' | 'numberString';
  autocompleteConfig?: AutocompleteConfig;
}

export interface FieldValidatorConfig {
  type: BuiltInValidatorType | 'custom';
  value?: number | string | RegExp;
  message?: string;
  name?: string;
  validatorFn?: ValidatorFn;
}

export interface FormFieldConfig {
  type: FormFieldType;
  label: string;
  name: string;
  helpText?: string;
  icon?: string;
  options?: readonly FormFieldOption[];
  validators?: readonly FieldValidatorConfig[];
  normalization?: readonly NormalizationRule[];
  visibleWhen?: readonly FieldCondition[];
  enabledWhen?: readonly FieldCondition[];
  metadata?: FieldMetadata;
  /** Required for `derived` fields and meaningless for any other type. */
  derived?: FieldDerivation;
}
