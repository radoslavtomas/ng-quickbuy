import type { JourneyDefinition, StepAnswers } from '../../../core/models/journey.model';
import { hasAddressState } from '../specific-modules/config/shared/common';
import { createOccupationFields } from '../specific-modules/config/shared/occupation.fields';
import { PROPERTY_YOUR_DETAILS_FIELDS } from '../specific-modules/config/property/steps/your-details.fields';
import { PROPERTY_YOUR_PROPERTY_FIELDS } from '../specific-modules/config/property/steps/your-property.fields';
import { PROPERTY_JOINT_PROPOSER_FIELDS } from '../specific-modules/config/property/steps/joint-proposer.fields';
import { PROPERTY_YOUR_POLICY_FIELDS } from '../specific-modules/config/property/steps/your-policy.fields';
import { PROPERTY_ASSUMPTIONS_FIELDS } from '../specific-modules/config/property/steps/assumptions.fields';
import {
  JOINT_PROPOSER_SECTION_ID,
  PROPERTY_PAYLOAD_MAPPER,
} from './journey-payload.mapper';

/** The proposer's details are only worth asking for once we know where they live. */
function addressIsResolved(answers: StepAnswers): boolean {
  return hasAddressState(answers['address'] ?? {});
}

/**
 * Property questionnaire, shared by house, holiday home and landlord.
 *
 * `storeStep` currently mirrors the route slug — see the note in `motor.journey.ts`.
 */
export const PROPERTY_JOURNEY: JourneyDefinition = {
  id: 'property',
  payloadMapper: PROPERTY_PAYLOAD_MAPPER,
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
          fields: PROPERTY_YOUR_DETAILS_FIELDS,
          visibleWhen: addressIsResolved,
        },
        {
          kind: 'fields',
          id: 'occupation',
          title: 'Occupation',
          fields: createOccupationFields({ includeSecondJob: true }),
          visibleWhen: addressIsResolved,
        },
      ],
    },
    {
      name: 'your-property',
      displayName: 'Your property',
      icon: 'home',
      storeStep: 'your-property',
      sections: [
        {
          kind: 'fields',
          id: 'property',
          title: 'Property details',
          fields: PROPERTY_YOUR_PROPERTY_FIELDS,
          defaults: {
            propertyType: 'semi_detached',
            bedrooms: 3,
            occupancy: 'owner_occupied',
            yearBuilt: 1995,
          },
        },
      ],
    },
    {
      name: 'joint-proposer',
      displayName: 'Joint proposer',
      icon: 'users',
      storeStep: 'joint-proposer',
      sections: [
        {
          kind: 'fields',
          id: JOINT_PROPOSER_SECTION_ID,
          title: 'Joint proposer details',
          fields: PROPERTY_JOINT_PROPOSER_FIELDS,
          defaults: { hasJointProposer: 'no' },
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
          fields: PROPERTY_YOUR_POLICY_FIELDS,
          defaults: {
            buildingsSumInsured: 250000,
            contentsSumInsured: 60000,
            voluntaryExcess: 250,
          },
        },
      ],
    },
    {
      name: 'assumptions',
      displayName: 'Assumptions',
      icon: 'check-square',
      storeStep: 'assumptions',
      sections: [
        {
          kind: 'fields',
          id: 'assumptions',
          title: 'Please confirm the following',
          fields: PROPERTY_ASSUMPTIONS_FIELDS,
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
