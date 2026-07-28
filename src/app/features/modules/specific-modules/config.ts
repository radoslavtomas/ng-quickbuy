import { FormFieldConfig } from '../../../core/models/form-field.model';
import {
  adultOnlyValidator,
  licenseYearsByAgeValidator,
  validDateValidator,
} from '../../../core/validators/form-validators';

export const MOTOR_STEP_ORDER = [
  'your-details',
  'your-vehicle',
  'additional-drivers',
  'your-policy',
  'your-quotes',
] as const;

export const PROPERTY_STEP_ORDER = [
  'your-details',
  'your-property',
  'joint-proposer',
  'your-policy',
  'assumptions',
  'your-quotes',
] as const;

export const MOTOR_YOUR_VEHICLE_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'text',
    label: 'Vehicle registration',
    name: 'registration',
    validators: [{ type: 'required' }, { type: 'maxLength', value: 10 }],
    normalization: ['trim', 'uppercase'],
    metadata: { placeholder: 'AB12CDE' },
  },
  {
    type: 'select',
    label: 'Vehicle use',
    name: 'vehicleUse',
    validators: [{ type: 'required' }],
    options: [
      { label: 'Social, domestic and pleasure', value: 'sdp' },
      { label: 'Business use', value: 'business' },
      { label: 'Carriage of own goods', value: 'own_goods' },
    ],
  },
  {
    type: 'number',
    label: 'Estimated annual mileage',
    name: 'annualMileage',
    validators: [{ type: 'required' }, { type: 'min', value: 1000 }, { type: 'max', value: 100000 }],
    normalization: ['currency'],
    metadata: { suffix: 'miles', placeholder: '12000' },
  },
  {
    type: 'radio',
    label: 'Where is the vehicle kept overnight?',
    name: 'overnightLocation',
    validators: [{ type: 'required' }],
    options: [
      { label: 'Driveway', value: 'driveway' },
      { label: 'Garage', value: 'garage' },
      { label: 'Roadside', value: 'roadside' },
    ],
    metadata: { radioLayout: 'row' },
  },
];

export const MOTOR_ADDITIONAL_DRIVERS_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'radio',
    label: 'Any additional drivers?',
    name: 'hasAdditionalDrivers',
    validators: [{ type: 'required' }],
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' },
    ],
    metadata: { radioLayout: 'row' },
  },
  {
    type: 'number',
    label: 'How many additional drivers?',
    name: 'additionalDriverCount',
    validators: [{ type: 'min', value: 0 }, { type: 'max', value: 4 }],
    visibleWhen: [{ field: 'hasAdditionalDrivers', operator: 'equals', value: 'yes' }],
    enabledWhen: [{ field: 'hasAdditionalDrivers', operator: 'equals', value: 'yes' }],
    metadata: { placeholder: '1' },
  },
  {
    type: 'select',
    label: 'Main driver no-claims bonus',
    name: 'noClaimsBonus',
    validators: [{ type: 'required' }],
    options: [
      { label: '0 years', value: '0' },
      { label: '1 year', value: '1' },
      { label: '2 years', value: '2' },
      { label: '3 years', value: '3' },
      { label: '4 years', value: '4' },
      { label: '5+ years', value: '5_plus' },
    ],
  },
];

export const MOTOR_YOUR_POLICY_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'date',
    label: 'Policy start date',
    name: 'policyStartDate',
    validators: [
      { type: 'required' },
      {
        type: 'custom',
        name: 'validDate',
        message: 'Enter a valid date in DD/MM/YYYY format.',
        validatorFn: validDateValidator,
      },
    ],
    normalization: ['trim', 'date'],
  },
  {
    type: 'radio',
    label: 'Level of cover',
    name: 'coverType',
    validators: [{ type: 'required' }],
    options: [
      { label: 'Third party only', value: 'tpo' },
      { label: 'Third party, fire and theft', value: 'tpft' },
      { label: 'Comprehensive', value: 'comprehensive' },
    ],
    metadata: { radioLayout: 'column' },
  },
  {
    type: 'number',
    label: 'Voluntary excess',
    name: 'voluntaryExcess',
    validators: [{ type: 'required' }, { type: 'min', value: 0 }, { type: 'max', value: 1000 }],
    normalization: ['currency'],
    metadata: { prefix: 'GBP', placeholder: '250' },
  },
  {
    type: 'number',
    label: 'Licence years held',
    name: 'licenseYearsHeld',
    validators: [
      { type: 'required' },
      { type: 'min', value: 0 },
      { type: 'max', value: 80 },
      {
        type: 'custom',
        name: 'licenseYearsByAge',
        message: 'Licence years held cannot exceed the years since you turned 18.',
        validatorFn: licenseYearsByAgeValidator,
      },
    ],
    normalization: ['currency'],
    metadata: {
      placeholder: '0',
      suffix: 'years',
    },
  },
  {
    type: 'checkbox',
    label: 'I confirm the details are correct',
    name: 'declarationAccepted',
    validators: [{ type: 'required', message: 'You must confirm details before requesting quotes.' }],
  },
];

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

export const PROPERTY_YOUR_POLICY_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'date',
    label: 'Policy start date',
    name: 'policyStartDate',
    validators: [
      { type: 'required' },
      {
        type: 'custom',
        name: 'validDate',
        message: 'Enter a valid date in DD/MM/YYYY format.',
        validatorFn: validDateValidator,
      },
    ],
    normalization: ['trim', 'date'],
  },
  {
    type: 'number',
    label: 'Buildings sum insured',
    name: 'buildingsSumInsured',
    validators: [{ type: 'required' }, { type: 'min', value: 50000 }, { type: 'max', value: 2000000 }],
    normalization: ['currency'],
    metadata: { prefix: 'GBP', placeholder: '250000' },
  },
  {
    type: 'number',
    label: 'Contents sum insured',
    name: 'contentsSumInsured',
    validators: [{ type: 'required' }, { type: 'min', value: 10000 }, { type: 'max', value: 500000 }],
    normalization: ['currency'],
    metadata: { prefix: 'GBP', placeholder: '60000' },
  },
  {
    type: 'number',
    label: 'Voluntary excess',
    name: 'voluntaryExcess',
    validators: [{ type: 'required' }, { type: 'min', value: 0 }, { type: 'max', value: 1000 }],
    normalization: ['currency'],
    metadata: { prefix: 'GBP', placeholder: '250' },
  },
];

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

export const FIRST_STEP_ADDRESS_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'text',
    label: 'House Name/Number',
    name: 'houseNameNumber',
    validators: [{ type: 'required' }],
    normalization: ['trim'],
    metadata: { placeholder: '1' },
  },
  {
    type: 'text',
    label: 'Address Line 2',
    name: 'addressLine2',
    normalization: ['trim'],
    metadata: { placeholder: 'District or locality (optional)' },
  },
  {
    type: 'text',
    label: 'Address Line 3',
    name: 'addressLine3',
    normalization: ['trim'],
    metadata: { placeholder: 'Town (optional)' },
  },
  {
    type: 'text',
    label: 'Address Line 4',
    name: 'addressLine4',
    normalization: ['trim'],
    metadata: { placeholder: 'County (optional)' },
  },
];

export const MOTOR_FIRST_STEP_PERSONAL_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'text',
    label: 'First name',
    name: 'firstName',
    validators: [{ type: 'required' }],
    normalization: ['trim'],
    metadata: { autocomplete: 'given-name', placeholder: 'Alex' },
  },
  {
    type: 'text',
    label: 'Surname',
    name: 'lastName',
    validators: [{ type: 'required' }],
    normalization: ['trim'],
    metadata: { autocomplete: 'family-name', placeholder: 'Taylor' },
  },
  {
    type: 'date',
    label: 'Date of birth',
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
        message: 'You must be at least 18 years old to continue.',
        validatorFn: adultOnlyValidator,
      },
    ],
    normalization: ['trim', 'date'],
    metadata: { autocomplete: 'bday' },
  },
  {
    type: 'email',
    label: 'Email',
    name: 'email',
    validators: [{ type: 'required' }, { type: 'email' }],
    normalization: ['trim', 'lowercase'],
    metadata: { autocomplete: 'email', placeholder: 'alex.taylor@example.com' },
  },
  {
    type: 'tel',
    label: 'Mobile number',
    name: 'mobilePhone',
    validators: [{ type: 'required' }, { type: 'minLength', value: 10 }, { type: 'maxLength', value: 15 }],
    normalization: ['trim', 'phone'],
    metadata: { autocomplete: 'tel', placeholder: '07123456789', maskPattern: '[0-9+ ]*' },
  },
];

export const PROPERTY_FIRST_STEP_PERSONAL_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'text',
    label: 'First name',
    name: 'firstName',
    validators: [{ type: 'required' }],
    normalization: ['trim'],
    metadata: { autocomplete: 'given-name', placeholder: 'Alex' },
  },
  {
    type: 'text',
    label: 'Surname',
    name: 'lastName',
    validators: [{ type: 'required' }],
    normalization: ['trim'],
    metadata: { autocomplete: 'family-name', placeholder: 'Taylor' },
  },
  {
    type: 'date',
    label: 'Date of birth',
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
        message: 'You must be at least 18 years old to continue.',
        validatorFn: adultOnlyValidator,
      },
    ],
    normalization: ['trim', 'date'],
    metadata: { autocomplete: 'bday' },
  },
  {
    type: 'email',
    label: 'Email',
    name: 'email',
    validators: [{ type: 'required' }, { type: 'email' }],
    normalization: ['trim', 'lowercase'],
    metadata: { autocomplete: 'email', placeholder: 'alex.taylor@example.com' },
  },
  {
    type: 'tel',
    label: 'Main number',
    name: 'mainPhone',
    validators: [{ type: 'required' }, { type: 'minLength', value: 10 }, { type: 'maxLength', value: 15 }],
    normalization: ['trim', 'phone'],
    metadata: { autocomplete: 'tel', placeholder: '07123456789', maskPattern: '[0-9+ ]*' },
  },
];

export const MOTOR_STEP_DEFAULT_VALUES: Readonly<Record<string, Record<string, unknown>>> = {
  'your-details': {
    postcode: '',
    addressLine1: '',
    houseNameNumber: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    mobilePhone: '',
  },
  'your-vehicle': {
    registration: '',
    vehicleUse: '',
    annualMileage: 0,
    overnightLocation: '',
  },
  'additional-drivers': {
    hasAdditionalDrivers: 'yes',
    additionalDriverCount: 1,
    noClaimsBonus: '3',
  },
  'your-policy': {
    policyStartDate: '01/09/2026',
    coverType: 'comprehensive',
    voluntaryExcess: 250,
    licenseYearsHeld: 8,
    declarationAccepted: true,
  },
};

export const PROPERTY_STEP_DEFAULT_VALUES: Readonly<Record<string, Record<string, unknown>>> = {
  'your-details': {
    postcode: '',
    addressLine1: '',
    houseNameNumber: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: 'MANCHESTR',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    mainPhone: '',
  },
  'your-property': {
    propertyType: 'semi_detached',
    bedrooms: 3,
    occupancy: 'owner_occupied',
    yearBuilt: 1995,
  },
  'joint-proposer': {
    hasJointProposer: 'no',
  },
  'your-policy': {
    policyStartDate: '01/09/2026',
    buildingsSumInsured: 250000,
    contentsSumInsured: 60000,
    voluntaryExcess: 250,
  },
  assumptions: {
    declarationAccepted: true,
    claimsDisclosureAccepted: true,
  },
};

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
