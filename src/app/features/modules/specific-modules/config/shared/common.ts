import { FormFieldConfig } from '../../../../../core/models/form-field.model';

export interface DemoQuote {
  insurer: string;
  plan: string;
  monthlyPremium: number;
  annualPremium: number;
  excess: number;
}

export interface AddressSearchCriteria {
  postcode: string;
  numberOrName: string;
}

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

export const DEMO_QUOTES: readonly DemoQuote[] = [
  {
    insurer: 'AXA Demo',
    plan: 'Comprehensive Plus',
    monthlyPremium: 68.42,
    annualPremium: 786.34,
    excess: 250,
  },
  {
    insurer: 'Aviva Demo',
    plan: 'Comprehensive',
    monthlyPremium: 72.18,
    annualPremium: 829.12,
    excess: 200,
  },
  {
    insurer: 'Allianz Demo',
    plan: 'TPFT',
    monthlyPremium: 59.75,
    annualPremium: 687.1,
    excess: 300,
  },
];

export const MODULE_CONTENT_STYLES = `
  .module-page {
    border-width: 4px 1px 1px 1px;
    border-style: solid;
    border-color: var(--brand-primary);
    border-radius: 0.75rem;
    background: white;
    padding: 1.25rem;
  }

  .module-page h1 {
    font-size: clamp(1.25rem, 3.5vw, 1.75rem);
    font-weight: 700;
    color: #0f172a;
  }

  .module-page p {
    margin-top: 0.5rem;
    color: #334155;
    line-height: 1.6;
  }

  .module-page .module-code {
    margin-top: 0.75rem;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--brand-secondary);
  }
`;

export function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function hasAddressState(value: { addressLine1?: unknown; postcode?: unknown; houseNameNumber?: unknown }): boolean {
  return Boolean(asString(value['addressLine1']) && asString(value['postcode']));
}

