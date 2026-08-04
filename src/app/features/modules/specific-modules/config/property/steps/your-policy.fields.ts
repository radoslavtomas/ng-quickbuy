import { FormFieldConfig } from '../../../../../../core/models/form-field.model';
import { validDateValidator } from '../../../../../../core/validators/form-validators';

export const PROPERTY_YOUR_POLICY_FIELDS: readonly FormFieldConfig[] = [
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
    type: 'number',
    label: 'Buildings sum insured',
    name: 'buildingsSumInsured',
    validators: [{ type: 'required' }, { type: 'min', value: 50000 }, { type: 'max', value: 2000000 }],
    normalization: ['currency'],
    metadata: { prefix: 'GBP', placeholder: '250000' },
  },
  {
    type: 'number',
    label: 'Contents sum insured',
    name: 'contentsSumInsured',
    validators: [{ type: 'required' }, { type: 'min', value: 10000 }, { type: 'max', value: 500000 }],
    normalization: ['currency'],
    metadata: { prefix: 'GBP', placeholder: '60000' },
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
];

