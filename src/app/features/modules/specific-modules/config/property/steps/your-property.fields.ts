import { FormFieldConfig } from '../../../../../../core/models/form-field.model';

export const PROPERTY_YOUR_PROPERTY_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'select',
    label: 'Property type',
    name: 'propertyType',
    validators: [{ type: 'required' }],
    options: [
      { label: 'Detached', value: 'detached' },
      { label: 'Semi-detached', value: 'semi_detached' },
      { label: 'Terraced', value: 'terraced' },
      { label: 'Flat', value: 'flat' },
      { label: 'Bungalow', value: 'bungalow' },
    ],
  },
  {
    type: 'number',
    label: 'Number of bedrooms',
    name: 'bedrooms',
    validators: [{ type: 'required' }, { type: 'min', value: 1 }, { type: 'max', value: 12 }],
    metadata: { placeholder: '3' },
  },
  {
    type: 'select',
    label: 'Occupancy',
    name: 'occupancy',
    validators: [{ type: 'required' }],
    options: [
      { label: 'Owner occupied', value: 'owner_occupied' },
      { label: 'Tenanted', value: 'tenanted' },
      { label: 'Holiday home', value: 'holiday_home' },
      { label: 'Unoccupied', value: 'unoccupied' },
    ],
  },
  {
    type: 'number',
    label: 'Year built (approx.)',
    name: 'yearBuilt',
    validators: [{ type: 'required' }, { type: 'min', value: 1800 }, { type: 'max', value: 2026 }],
    metadata: { placeholder: '1998' },
  },
];

