import { FormFieldConfig } from '../../../../../../core/models/form-field.model';
import { adultOnlyValidator, validDateValidator } from '../../../../../../core/validators/form-validators';
import { PropertyModuleCode, asPropertyModuleCode } from '../modules';

const SHARED_PROPERTY_YOUR_DETAILS_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'text',
    label: 'First name',
    name: 'proposer-name-forenames',
    validators: [{ type: 'required' }],
    normalization: ['trim'],
    metadata: {
      autocomplete: 'given-name',
      placeholder: 'Alex',
      aliases: ['firstName'],
    },
  },
  {
    type: 'text',
    label: 'Surname',
    name: 'proposer-name-surname',
    validators: [{ type: 'required' }],
    normalization: ['trim'],
    metadata: {
      autocomplete: 'family-name',
      placeholder: 'Taylor',
      aliases: ['lastName'],
    },
  },
  {
    type: 'date',
    label: 'Date of birth',
    name: 'proposer-dateofbirth',
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
      aliases: ['dateOfBirth'],
    },
  },
  {
    type: 'email',
    label: 'Email',
    name: 'proposer-email',
    validators: [{ type: 'required' }, { type: 'email' }],
    normalization: ['trim', 'lowercase'],
    metadata: {
      autocomplete: 'email',
      placeholder: 'alex.taylor@example.com',
      aliases: ['email'],
    },
  },
  {
    type: 'tel',
    label: 'Main number',
    name: 'proposer-daytimetelephone',
    validators: [{ type: 'required' }, { type: 'minLength', value: 10 }, { type: 'maxLength', value: 15 }],
    normalization: ['trim', 'phone'],
    metadata: {
      autocomplete: 'tel',
      placeholder: '07123456789',
      maskPattern: '[0-9+ ]*',
      aliases: ['mainPhone', 'mobilePhone'],
    },
  },
];

const PROPERTY_YOUR_DETAILS_FIELDS_BY_MODULE: Readonly<Record<PropertyModuleCode, readonly FormFieldConfig[]>> = {
  HC: SHARED_PROPERTY_YOUR_DETAILS_FIELDS,
  HH: SHARED_PROPERTY_YOUR_DETAILS_FIELDS,
  LL: SHARED_PROPERTY_YOUR_DETAILS_FIELDS,
};

export function getPropertyYourDetailsFields(moduleCode: string): readonly FormFieldConfig[] {
  return PROPERTY_YOUR_DETAILS_FIELDS_BY_MODULE[asPropertyModuleCode(moduleCode)];
}
