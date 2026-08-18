import type {
  FieldCondition,
  FormFieldConfig,
} from '../../../../../../core/models/form-field.model';
import {
  adultOnlyValidator,
  validDateValidator,
} from '../../../../../../core/validators/form-validators';
import { createOccupationFields } from '../../shared/occupation.fields';
import { PERSON_TITLE_OPTIONS } from '../../lookups/personal-details';

/** Nothing about a joint proposer is asked until the customer says there is one. */
const WHEN_DECLARED: readonly FieldCondition[] = [
  { field: 'hasJointProposer', operator: 'equals', value: 'yes' },
];

/**
 * The joint proposer's details.
 *
 * They are a person on the policy, so they use the same field names as the customer
 * and every additional driver: the mapper files this section under the
 * `jointproposer` slot, which is what turns `surname` into
 * `jointproposer-name-surname`. That is also why their occupation comes from the
 * shared factory — the insurer wants it for them as much as for the customer.
 *
 * Everything here is required once a joint proposer is declared, and drops out of
 * validity entirely when one is not, because a hidden field cannot block the step.
 */
export const PROPERTY_JOINT_PROPOSER_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'radio',
    label: 'Do you have a joint proposer?',
    name: 'hasJointProposer',
    validators: [{ type: 'required' }],
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' },
    ],
    metadata: { radioLayout: 'row' },
  },
  {
    type: 'select',
    label: 'Title',
    name: 'title',
    validators: [{ type: 'required' }],
    options: PERSON_TITLE_OPTIONS,
    visibleWhen: WHEN_DECLARED,
  },
  {
    type: 'text',
    label: 'Joint proposer first name',
    name: 'forenames',
    validators: [{ type: 'required' }, { type: 'maxLength', value: 40 }],
    visibleWhen: WHEN_DECLARED,
    normalization: ['trim'],
    metadata: { autocomplete: 'off', placeholder: 'Jordan' },
  },
  {
    type: 'text',
    label: 'Joint proposer surname',
    name: 'surname',
    validators: [{ type: 'required' }, { type: 'maxLength', value: 40 }],
    visibleWhen: WHEN_DECLARED,
    normalization: ['trim'],
    metadata: { autocomplete: 'off', placeholder: 'Taylor' },
  },
  {
    type: 'date',
    label: 'Joint proposer date of birth',
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
        message: 'A joint proposer must be at least 18 years old.',
        validatorFn: adultOnlyValidator,
      },
    ],
    normalization: ['trim', 'date'],
    visibleWhen: WHEN_DECLARED,
  },
  ...createOccupationFields({ gate: WHEN_DECLARED }),
];
