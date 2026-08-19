import { FormFieldConfig } from '../../../../../../core/models/form-field.model';
import {
  adultOnlyValidator,
  validDateValidator,
} from '../../../../../../core/validators/form-validators';
import {
  PERSON_GENDER_OPTIONS,
  PERSON_TITLE_OPTIONS,
  PERSON_MARITAL_STATUS_OPTIONS,
} from '../../lookups/personal-details';

export const PROPERTY_YOUR_DETAILS_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'select',
    label: 'Title',
    name: 'title',
    validators: [{ type: 'required' }],
    options: PERSON_TITLE_OPTIONS,
  },
  {
    type: 'text',
    label: 'First name',
    name: 'forenames',
    validators: [{ type: 'required' }],
    normalization: ['trim'],
    metadata: {
      autocomplete: 'given-name',
      placeholder: 'Alex',
    },
  },
  {
    type: 'text',
    label: 'Surname',
    name: 'surname',
    validators: [{ type: 'required' }],
    normalization: ['trim'],
    metadata: {
      autocomplete: 'family-name',
      placeholder: 'Taylor',
    },
  },
  {
    type: 'date',
    label: 'Date of birth',
    name: 'dateOfBirth',
    validators: [
      { type: 'required' },
      {
        type: 'custom',
        name: 'validDate',
        message: 'Enter a valid date in DD/MM/YYYY format.',
        validatorFn: validDateValidator,
      },
      {
        type: 'custom',
        name: 'adultOnly',
        message: 'You must be at least 18 years old to continue.',
        validatorFn: adultOnlyValidator,
      },
    ],
    normalization: ['trim', 'date'],
    metadata: {
      autocomplete: 'bday',
    },
  },
  {
    type: 'email',
    label: 'Email',
    name: 'email',
    validators: [{ type: 'required' }, { type: 'email' }],
    normalization: ['trim', 'lowercase'],
    metadata: {
      autocomplete: 'email',
      placeholder: 'alex.taylor@example.com',
    },
  },
  {
    type: 'tel',
    label: 'Main number',
    name: 'phone',
    validators: [
      { type: 'required' },
      { type: 'minLength', value: 10 },
      { type: 'maxLength', value: 15 },
    ],
    normalization: ['trim', 'phone'],
    metadata: {
      autocomplete: 'tel',
      placeholder: '07123456789',
      maskPattern: '[0-9+ ]*',
    },
  },
  {
    type: 'tel',
    label: 'Alternative number',
    name: 'altphone',
    validators: [
      { type: 'required' },
      { type: 'minLength', value: 10 },
      { type: 'maxLength', value: 15 },
    ],
    normalization: ['trim', 'phone'],
    metadata: {
      autocomplete: 'tel',
      placeholder: '07123456789',
      maskPattern: '[0-9+ ]*',
    },
  },
  {
    type: 'radio',
    label: 'Gender',
    name: 'gender',
    validators: [{ type: 'required' }],
    options: PERSON_GENDER_OPTIONS,
    metadata: { radioLayout: 'row' },
  },
  {
    type: 'radio',
    label: 'Marital status',
    name: 'marital-status',
    validators: [{ type: 'required' }],
    options: PERSON_MARITAL_STATUS_OPTIONS,
  },
];
