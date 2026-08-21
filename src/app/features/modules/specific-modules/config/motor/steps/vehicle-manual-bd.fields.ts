import {
  bdVehicleEngineValidator,
  bdVehicleYearValidator,
} from '../../../../../../core/validators/form-validators';
import { FormFieldConfig } from '../../../../../../core/models/form-field.model';

/**
 * Breakdown insurance has no IRIS catalogue entry, so its manual vehicle search is
 * three freeform fields rather than cascading selects. `engine` is deliberately
 * `text`, not `number`: customers may type a decimal in litres (`1.6`) as readily
 * as a value in cc (`1600`), and `VehicleBdManualSearchComponent` normalizes
 * whichever they typed before it is stored.
 */
export const BD_MANUAL_VEHICLE_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'text',
    label: 'Make and model',
    name: 'makeandmodel',
    validators: [
      { type: 'required', message: 'Make and model is required.' },
      { type: 'maxLength', value: 32, message: 'Make and model must be 32 characters or fewer.' },
    ],
    normalization: ['trim'],
    metadata: { placeholder: 'eg. Ford Transit' },
  },
  {
    type: 'text',
    label: 'Year of manufacture',
    name: 'year',
    validators: [
      { type: 'required', message: 'Year of manufacture is required.' },
      {
        type: 'custom',
        name: 'bdVehicleYear',
        validatorFn: bdVehicleYearValidator,
        message: 'Enter a 4-digit year that is not in the future and no more than 13 years ago.',
      },
    ],
    normalization: ['trim'],
    metadata: { placeholder: 'eg. 2015' },
  },
  {
    type: 'text',
    label: 'Engine size (cc)',
    name: 'engine',
    validators: [
      { type: 'required', message: 'Engine size is required.' },
      {
        type: 'custom',
        name: 'bdVehicleEngine',
        validatorFn: bdVehicleEngineValidator,
        message: 'Enter a valid engine size, eg. 1600 or 1.6.',
      },
    ],
    normalization: ['trim'],
    metadata: { placeholder: 'eg. 1600 or 1.6' },
  },
];
