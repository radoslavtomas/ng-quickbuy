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
  | 'toggle';

export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'in'
  | 'notIn'
  | 'truthy'
  | 'falsy';

export type NormalizationRule =
  | 'trim'
  | 'phone'
  | 'date'
  | 'currency'
  | 'uppercase'
  | 'lowercase';

export type BuiltInValidatorType =
  | 'required'
  | 'email'
  | 'min'
  | 'max'
  | 'minLength'
  | 'maxLength'
  | 'pattern';

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

export interface FieldMetadata {
  autocomplete?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  maxLengthCounter?: boolean;
  maskPattern?: string;
  radioLayout?: 'row' | 'column';
  aliases?: readonly string[];
  valueTransform?: 'booleanYN' | 'numberString';
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
  reviewFormatter?: (value: unknown, formValue: Record<string, unknown>) => string;
}
