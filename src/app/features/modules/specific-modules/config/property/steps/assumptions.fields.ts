import { FormFieldConfig } from '../../../../../../core/models/form-field.model';
import { PropertyModuleCode, asPropertyModuleCode } from '../modules';

const SHARED_PROPERTY_ASSUMPTIONS_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'checkbox',
    label: 'I confirm all information provided is accurate',
    name: 'declarationAccepted',
    validators: [{ type: 'required', message: 'You must confirm details before requesting quotes.' }],
  },
  {
    type: 'checkbox',
    label: 'I confirm there are no known claims not disclosed above',
    name: 'claimsDisclosureAccepted',
    validators: [{ type: 'required', message: 'Please confirm claims disclosure.' }],
  },
];

const PROPERTY_ASSUMPTIONS_FIELDS_BY_MODULE: Readonly<Record<PropertyModuleCode, readonly FormFieldConfig[]>> = {
  HC: SHARED_PROPERTY_ASSUMPTIONS_FIELDS,
  HH: SHARED_PROPERTY_ASSUMPTIONS_FIELDS,
  LL: SHARED_PROPERTY_ASSUMPTIONS_FIELDS,
};

export function getPropertyAssumptionsFields(moduleCode: string): readonly FormFieldConfig[] {
  return PROPERTY_ASSUMPTIONS_FIELDS_BY_MODULE[asPropertyModuleCode(moduleCode)];
}
