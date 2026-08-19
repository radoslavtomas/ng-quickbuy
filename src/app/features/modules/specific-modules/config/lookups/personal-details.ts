import type { FormFieldOption } from '../../../../../core/models/form-field.model';

export const PERSON_TITLE_OPTIONS: readonly FormFieldOption[] = [
  { label: 'Mr', value: 'Mr' },
  { label: 'Mrs', value: 'Mrs' },
  { label: 'Ms', value: 'Ms' },
  { label: 'Miss', value: 'Miss' },
  { label: 'Dr', value: 'Dr' },
  { label: 'Mx', value: 'Mx' },
];

export const PERSON_GENDER_OPTIONS: readonly FormFieldOption[] = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
  { label: 'Unspecified', value: 'U' },
];

export const PERSON_MARITAL_STATUS_OPTIONS: readonly FormFieldOption[] = [
  { label: 'Divorced', value: 'D' },
  { label: 'Married', value: 'M' },
  { label: 'Single', value: 'S' },
  { label: 'Widowed', value: 'W' },
  { label: 'Civil Partnered', value: 'V' },
];
