import { FormFieldConfig } from '../../../../../../core/models/form-field.model';
import { adultOnlyValidator, validDateValidator } from '../../../../../../core/validators/form-validators';
import { PropertyModuleCode, asPropertyModuleCode } from '../modules';

const SHARED_PROPERTY_JOINT_PROPOSER_FIELDS: readonly FormFieldConfig[] = [
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
    type: 'text',
    label: 'Joint proposer full name',
    name: 'jointProposerName',
    validators: [{ type: 'maxLength', value: 80 }],
    visibleWhen: [{ field: 'hasJointProposer', operator: 'equals', value: 'yes' }],
    enabledWhen: [{ field: 'hasJointProposer', operator: 'equals', value: 'yes' }],
    normalization: ['trim'],
    metadata: { placeholder: 'Jordan Taylor' },
  },
  {
    type: 'date',
    label: 'Joint proposer date of birth',
    name: 'jointProposerDob',
    validators: [
      {
        type: 'custom',
        name: 'validDate',
        message: 'Enter a valid date in DD/MM/YYYY format.',
        validatorFn: validDateValidator,
      },
      {
        type: 'custom',
        name: 'adultOnly',
        message: 'Joint proposer must be at least 18 years old.',
        validatorFn: adultOnlyValidator,
      },
    ],
    normalization: ['trim', 'date'],
    visibleWhen: [{ field: 'hasJointProposer', operator: 'equals', value: 'yes' }],
    enabledWhen: [{ field: 'hasJointProposer', operator: 'equals', value: 'yes' }],
  },
];

const PROPERTY_JOINT_PROPOSER_FIELDS_BY_MODULE: Readonly<Record<PropertyModuleCode, readonly FormFieldConfig[]>> = {
  HC: SHARED_PROPERTY_JOINT_PROPOSER_FIELDS,
  HH: SHARED_PROPERTY_JOINT_PROPOSER_FIELDS,
  LL: SHARED_PROPERTY_JOINT_PROPOSER_FIELDS,
};

export function getPropertyJointProposerFields(moduleCode: string): readonly FormFieldConfig[] {
  return PROPERTY_JOINT_PROPOSER_FIELDS_BY_MODULE[asPropertyModuleCode(moduleCode)];
}
