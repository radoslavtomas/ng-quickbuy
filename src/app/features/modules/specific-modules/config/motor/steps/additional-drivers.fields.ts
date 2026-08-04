import { FormFieldConfig } from '../../../../../../core/models/form-field.model';

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
    type: 'number',
    label: 'How many additional drivers?',
    name: 'additionalDriverCount',
    validators: [{ type: 'min', value: 0 }, { type: 'max', value: 4 }],
    visibleWhen: [{ field: 'hasAdditionalDrivers', operator: 'equals', value: 'yes' }],
    enabledWhen: [{ field: 'hasAdditionalDrivers', operator: 'equals', value: 'yes' }],
    metadata: { placeholder: '1' },
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

