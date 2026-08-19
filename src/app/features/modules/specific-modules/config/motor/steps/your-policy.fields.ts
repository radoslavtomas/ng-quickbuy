import { FormFieldConfig } from '../../../../../../core/models/form-field.model';
import {
  licenseYearsByAgeValidator,
  validDateValidator,
} from '../../../../../../core/validators/form-validators';

export const MOTOR_YOUR_POLICY_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'date',
    label: 'Policy start date',
    name: 'startDate',
    validators: [
      { type: 'required' },
      {
        type: 'custom',
        name: 'validDate',
        message: 'Enter a valid date in DD/MM/YYYY format.',
        validatorFn: validDateValidator,
      },
    ],
    normalization: ['trim', 'date'],
  },
  {
    type: 'radio',
    label: 'Level of cover',
    name: 'coverType',
    validators: [{ type: 'required' }],
    options: [
      { label: 'Third party only', value: 'tpo' },
      { label: 'Third party, fire and theft', value: 'tpft' },
      { label: 'Comprehensive', value: 'comprehensive' },
    ],
    metadata: {
      radioLayout: 'column',
    },
  },
  {
    type: 'number',
    label: 'Voluntary excess',
    name: 'voluntaryExcess',
    validators: [{ type: 'required' }, { type: 'min', value: 0 }, { type: 'max', value: 1000 }],
    normalization: ['currency'],
    metadata: {
      prefix: 'GBP',
      placeholder: '250',
    },
  },
  {
    type: 'number',
    label: 'Licence years held',
    name: 'licenseYearsHeld',
    validators: [
      { type: 'required' },
      { type: 'min', value: 0 },
      { type: 'max', value: 80 },
      {
        type: 'custom',
        name: 'licenseYearsByAge',
        message: 'Licence years held cannot exceed the years since you turned 18.',
        validatorFn: licenseYearsByAgeValidator,
      },
    ],
    normalization: ['currency'],
    metadata: {
      placeholder: '0',
      suffix: 'years',
    },
  },
  {
    type: 'checkbox',
    label: 'I confirm the details are correct',
    name: 'declarationAccepted',
    validators: [
      { type: 'required', message: 'You must confirm details before requesting quotes.' },
    ],
  },
];
