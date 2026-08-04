import type { JourneyDefinition, StepAnswers } from '../../../core/models/journey.model';
import { hasAddressState } from '../specific-modules/config/shared/common';
import { MOTOR_YOUR_DETAILS_FIELDS } from '../specific-modules/config/motor/steps/your-details.fields';
import { MOTOR_YOUR_VEHICLE_FIELDS } from '../specific-modules/config/motor/steps/your-vehicle.fields';
import { MOTOR_ADDITIONAL_DRIVERS_FIELDS } from '../specific-modules/config/motor/steps/additional-drivers.fields';
import { MOTOR_YOUR_POLICY_FIELDS } from '../specific-modules/config/motor/steps/your-policy.fields';
import { MOTOR_PAYLOAD_MAPPER } from './journey-payload.mapper';

/** The proposer's details are only worth asking for once we know where they live. */
function addressIsResolved(answers: StepAnswers): boolean {
  return hasAddressState(answers['address'] ?? {});
}

/**
 * Motor questionnaire, shared by car, van, breakdown and taxi.
 *
 * `storeStep` currently mirrors the route slug. The partial-store API expects its
 * own step identifier and the values have not been confirmed by the backend yet,
 * so they are kept as a separate field rather than derived from `name`.
 */
export const MOTOR_JOURNEY: JourneyDefinition = {
  id: 'motor',
  payloadMapper: MOTOR_PAYLOAD_MAPPER,
  steps: [
    {
      name: 'your-details',
      displayName: 'Your details',
      icon: 'user-edit',
      storeStep: 'your-details',
      sections: [
        {
          kind: 'custom',
          id: 'address',
          title: 'Correspondence address',
          component: 'address-lookup',
        },
        {
          kind: 'fields',
          id: 'proposer',
          title: 'Your details',
          fields: MOTOR_YOUR_DETAILS_FIELDS,
          visibleWhen: addressIsResolved,
        },
      ],
    },
    {
      name: 'your-vehicle',
      displayName: 'Your vehicle',
      icon: 'car',
      storeStep: 'your-vehicle',
      sections: [
        {
          kind: 'fields',
          id: 'vehicle',
          title: 'Vehicle details',
          fields: MOTOR_YOUR_VEHICLE_FIELDS,
          defaults: {
            registration: '',
            vehicleUse: '',
            annualMileage: 0,
            overnightLocation: '',
          },
        },
      ],
    },
    {
      name: 'additional-drivers',
      displayName: 'Additional drivers',
      icon: 'users',
      storeStep: 'additional-drivers',
      sections: [
        {
          kind: 'fields',
          id: 'drivers',
          title: 'Additional drivers',
          fields: MOTOR_ADDITIONAL_DRIVERS_FIELDS,
          defaults: {
            hasAdditionalDrivers: 'no',
            noClaimsBonusYears: '3',
          },
        },
      ],
    },
    {
      name: 'your-policy',
      displayName: 'Your policy',
      icon: 'file-alt',
      storeStep: 'your-policy',
      sections: [
        {
          kind: 'fields',
          id: 'policy',
          title: 'Your policy',
          fields: MOTOR_YOUR_POLICY_FIELDS,
          defaults: {
            coverType: 'comprehensive',
            voluntaryExcess: 250,
          },
        },
      ],
    },
    {
      name: 'your-quotes',
      displayName: 'Your quotes',
      icon: 'list-ol',
      storeStep: 'your-quotes',
      isOutcome: true,
      sections: [{ kind: 'custom', id: 'quotes', component: 'quote-results' }],
    },
  ],
};
