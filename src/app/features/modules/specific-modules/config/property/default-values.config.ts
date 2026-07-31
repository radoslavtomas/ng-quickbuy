import { PropertyModuleCode, asPropertyModuleCode } from './modules';

export type PropertyStepDefaultValues = Readonly<Record<string, Record<string, unknown>>>;

const SHARED_PROPERTY_STEP_DEFAULT_VALUES: PropertyStepDefaultValues = {
  'your-details': {
    postcode: '',
    addressLine1: '',
    houseNameNumber: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: 'MANCHESTR',
    'proposer-name-forenames': '',
    'proposer-name-surname': '',
    'proposer-dateofbirth': '',
    'proposer-email': '',
    'proposer-daytimetelephone': '',
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
    'policy-inceptiondate': '01/09/2026',
    buildingsSumInsured: 250000,
    contentsSumInsured: 60000,
    'policy-volxs': 250,
  },
  assumptions: {
    declarationAccepted: true,
    claimsDisclosureAccepted: true,
  },
};

const PROPERTY_STEP_DEFAULT_VALUES_BY_MODULE: Readonly<Record<PropertyModuleCode, PropertyStepDefaultValues>> = {
  HC: SHARED_PROPERTY_STEP_DEFAULT_VALUES,
  HH: SHARED_PROPERTY_STEP_DEFAULT_VALUES,
  LL: SHARED_PROPERTY_STEP_DEFAULT_VALUES,
};

export function getPropertyStepDefaultValues(moduleCode: string): PropertyStepDefaultValues {
  return PROPERTY_STEP_DEFAULT_VALUES_BY_MODULE[asPropertyModuleCode(moduleCode)];
}
