import { FormFieldConfig } from '../../../../../../core/models/form-field.model';

export const MOTOR_YOUR_VEHICLE_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'text',
    label: 'Vehicle registration',
    name: 'vehicle-regnumber',
    validators: [{ type: 'required' }, { type: 'maxLength', value: 10 }],
    normalization: ['trim', 'uppercase'],
    metadata: {
      placeholder: 'AB12CDE',
      aliases: ['registration'],
    },
  },
  {
    type: 'select',
    label: 'Vehicle use',
    name: 'vehicleUse',
    validators: [{ type: 'required' }],
    options: [
      { label: 'Social, domestic and pleasure', value: 'sdp' },
      { label: 'Business use', value: 'business' },
      { label: 'Carriage of own goods', value: 'own_goods' },
    ],
  },
  {
    type: 'number',
    label: 'Estimated annual mileage',
    name: 'policy-totalmileage',
    validators: [{ type: 'required' }, { type: 'min', value: 1000 }, { type: 'max', value: 100000 }],
    normalization: ['currency'],
    metadata: {
      suffix: 'miles',
      placeholder: '12000',
      aliases: ['annualMileage'],
    },
  },
  {
    type: 'radio',
    label: 'Where is the vehicle kept overnight?',
    name: 'vehicle-wherekept',
    validators: [{ type: 'required' }],
    options: [
      { label: 'Driveway', value: 'driveway' },
      { label: 'Garage', value: 'garage' },
      { label: 'Roadside', value: 'roadside' },
    ],
    metadata: {
      radioLayout: 'row',
      aliases: ['overnightLocation'],
    },
  },
];

