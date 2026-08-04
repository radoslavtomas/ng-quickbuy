import { FormFieldConfig } from '../../../../../../core/models/form-field.model';

export const PROPERTY_ASSUMPTIONS_FIELDS: readonly FormFieldConfig[] = [
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

