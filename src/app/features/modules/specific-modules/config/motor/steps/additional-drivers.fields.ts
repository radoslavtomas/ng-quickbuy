import { FormFieldConfig } from '../../../../../../core/models/form-field.model';
import { adultOnlyValidator, validDateValidator } from '../../../../../../core/validators/form-validators';

export const MOTOR_ADDITIONAL_DRIVERS_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'radio',
    label: 'Any additional drivers?',
    name: 'hasAdditionalDrivers',
    validators: [{ type: 'required' }],
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' },
    ],
    metadata: { radioLayout: 'row' },
  },
  {
    type: 'select',
    label: 'Main driver no-claims bonus',
    name: 'noClaimsBonusYears',
    validators: [{ type: 'required' }],
    options: [
      { label: '0 years', value: '0' },
      { label: '1 year', value: '1' },
      { label: '2 years', value: '2' },
      { label: '3 years', value: '3' },
      { label: '4 years', value: '4' },
      { label: '5+ years', value: '5_plus' },
    ],
  },
];

/**
 * Questions asked of each additional driver.
 *
 * The same field names the proposer uses, because the wire format files them under a
 * slot rather than renaming them: `forenames` becomes `driver-2-name-forenames` for
 * the second driver and `proposer-name-forenames` for the customer.
 */
export const MOTOR_ADDITIONAL_DRIVER_ITEM_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'text',
    label: 'First name',
    name: 'forenames',
    validators: [{ type: 'required' }],
    normalization: ['trim'],
    metadata: { autocomplete: 'off', placeholder: 'Jordan' },
  },
  {
    type: 'text',
    label: 'Surname',
    name: 'surname',
    validators: [{ type: 'required' }],
    normalization: ['trim'],
    metadata: { autocomplete: 'off', placeholder: 'Taylor' },
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
        message: 'A driver must be at least 18 years old.',
        validatorFn: adultOnlyValidator,
      },
    ],
    normalization: ['trim', 'date'],
    metadata: { autocomplete: 'off' },
  },
];

