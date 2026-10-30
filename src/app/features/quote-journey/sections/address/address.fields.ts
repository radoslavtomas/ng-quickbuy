import type { FormFieldConfig } from '../../../../core/models/form-field.model';

export const ADDRESS_LOOKUP_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'text',
    label: 'House number or name',
    name: 'numberOrName',
    validators: [{ type: 'required', message: 'House number or name is required.' }],
    normalization: ['trim'],
    metadata: { autocomplete: 'address-line1', placeholder: 'eg. 17 or The Oaks' },
  },
  {
    type: 'text',
    label: 'Postcode',
    name: 'postcode',
    validators: [{ type: 'required', message: 'Postcode is required.' }],
    normalization: ['trim', 'uppercase'],
    metadata: { autocomplete: 'postal-code', placeholder: 'eg. M16 0PQ' },
  },
];

/** Internal name of the yes/no answer to the risk-address question. UI only. */
export const RISK_ADDRESS_MATCHES_FIELD = 'riskAddressMatches';

/** UI-only field driving the risk-address lookup's search box. */
export const RISK_ADDRESS_HOUSE_NAME_NUMBER_FIELD = 'riskHouseNameNumber';

/** Internal names of the risk (property) address fields sent to the insurer. */
export const RISK_ADDRESS_FIELD_NAMES: readonly string[] = [
  'riskAddressLine1',
  'riskAddressLine2',
  'riskAddressLine3',
  'riskAddressLine4',
  'riskPostcode',
];

/** Every internal name the risk-address question occupies, UI-only and mapped alike. */
export const RISK_ADDRESS_KEYS: readonly string[] = [
  RISK_ADDRESS_MATCHES_FIELD,
  RISK_ADDRESS_HOUSE_NAME_NUMBER_FIELD,
  ...RISK_ADDRESS_FIELD_NAMES,
];

/**
 * Asks whether the correspondence address is also the property being insured.
 *
 * Answering "no" reveals a second, independent address search for the risk
 * address; answering "yes" derives it from the correspondence address instead of
 * asking the customer to search twice.
 */
export const RISK_ADDRESS_QUESTION_FIELD: readonly FormFieldConfig[] = [
  {
    type: 'radio',
    label: 'Is this the address of the property you want to insure?',
    name: RISK_ADDRESS_MATCHES_FIELD,
    validators: [
      {
        type: 'required',
        message: 'Please tell us if this is the address of the property you want to insure.',
      },
    ],
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' },
    ],
    metadata: { radioLayout: 'row' },
  },
];

export const ADDRESS_MANUAL_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'text',
    label: 'Address Line 1',
    name: 'addressLine1',
    validators: [{ type: 'required', message: 'Address line 1 is required.' }],
    normalization: ['trim'],
    metadata: { autocomplete: 'address-line1', placeholder: 'eg. Talbot Road' },
  },
  {
    type: 'text',
    label: 'Address Line 2',
    name: 'addressLine2',
    normalization: ['trim'],
    metadata: { autocomplete: 'address-line2', placeholder: 'Optional' },
  },
  {
    type: 'text',
    label: 'Address Line 3',
    name: 'addressLine3',
    normalization: ['trim'],
    metadata: { placeholder: 'Optional' },
  },
  {
    type: 'text',
    label: 'Town/city',
    name: 'addressLine4',
    validators: [{ type: 'required', message: 'Town/city is required.' }],
    normalization: ['trim'],
    metadata: { autocomplete: 'address-level2', placeholder: 'eg. Manchester' },
  },
  {
    type: 'text',
    label: 'Postcode',
    name: 'postcode',
    validators: [{ type: 'required', message: 'Postcode is required.' }],
    normalization: ['trim', 'uppercase'],
    metadata: { autocomplete: 'postal-code', placeholder: 'eg. M16 0PQ' },
  },
];

