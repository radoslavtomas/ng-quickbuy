import { FormFieldConfig } from '../../../../../../core/models/form-field.model';

export const MOTOR_YOUR_VEHICLE_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'text',
    label: 'Vehicle registration',
    name: 'registration',
    validators: [{ type: 'required' }, { type: 'maxLength', value: 10 }],
    normalization: ['trim', 'uppercase'],
    metadata: {
      placeholder: 'AB12CDE',
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
    name: 'annualMileage',
    validators: [
      { type: 'required' },
      { type: 'min', value: 1000 },
      { type: 'max', value: 100000 },
    ],
    normalization: ['currency'],
    metadata: {
      suffix: 'miles',
      placeholder: '12000',
    },
  },
  {
    type: 'radio',
    label: 'Where is the vehicle kept overnight?',
    name: 'overnightLocation',
    validators: [{ type: 'required' }],
    options: [
      { label: 'Driveway', value: 'driveway' },
      { label: 'Garage', value: 'garage' },
      { label: 'Roadside', value: 'roadside' },
    ],
    metadata: {
      radioLayout: 'row',
    },
  },
];
