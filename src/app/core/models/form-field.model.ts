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
  /**
   * A `select` whose options are not known until they are fetched, optionally
   * keyed on sibling answers. Picking a new value for a dependency clears this
   * field and reloads its options, so a cascade of these composes automatically
   * without each field having to know about the others.
   */
  | 'dynamic-select'
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
 * Named backend a `dynamic-select` field loads its options from.
 *
 * Adding a new cascading select anywhere in the app is a configuration change
 * plus one entry in `DynamicOptionsSourceService` — the renderer stays unaware
 * of what is being loaded, exactly like `AutocompleteEndpoint`.
 */
export type DynamicSelectEndpoint = 'iris-make' | 'iris-model' | 'iris-year' | 'iris-edition';

/**
 * How a `dynamic-select` field's options are loaded.
 *
 * `dependsOn` names the sibling fields this field's options are a function of.
 * Changing any of them both reloads this field's options and clears its current
 * answer, since an answer chosen against the old options is no longer known to
 * describe anything real — that in turn clears whatever depends on *this* field,
 * so a multi-level cascade needs no coordination beyond each field naming its own
 * direct dependencies.
 *
 * `context` is fixed configuration baked in when the field list was built (for
 * example, which catalogue to search), as distinct from `dependsOn`, which is
 * live and answered by the customer.
 */
export interface DynamicSelectConfig {
  endpoint: DynamicSelectEndpoint;
  dependsOn?: readonly string[];
  context?: Readonly<Record<string, unknown>>;
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
  dynamicSelectConfig?: DynamicSelectConfig;
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
