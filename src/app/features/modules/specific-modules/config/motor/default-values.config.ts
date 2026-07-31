import { MotorModuleCode, asMotorModuleCode } from './modules';

export type MotorStepDefaultValues = Readonly<Record<string, Record<string, unknown>>>;

const SHARED_MOTOR_STEP_DEFAULT_VALUES: MotorStepDefaultValues = {
  'your-details': {
    postcode: '',
    addressLine1: '',
    houseNameNumber: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    'proposer-name-forenames': '',
    'proposer-name-surname': '',
    'proposer-dateofbirth': '',
    'proposer-email': '',
    'proposer-daytimetelephone': '',
  },
  'your-vehicle': {
    'vehicle-regnumber': '',
    vehicleUse: '',
    'policy-totalmileage': 0,
    'vehicle-wherekept': '',
  },
  'additional-drivers': {
    hasAdditionalDrivers: 'yes',
    additionalDriverCount: 1,
    'policy-previousinsurance-noclaimsbonusyears': '3',
  },
  'your-policy': {
    'policy-inceptiondate': '01/09/2026',
    'policy-cover': 'comprehensive',
    'policy-volxs': 250,
    licenseYearsHeld: 8,
    declarationAccepted: true,
  },
};

const MOTOR_STEP_DEFAULT_VALUES_BY_MODULE: Readonly<Record<MotorModuleCode, MotorStepDefaultValues>> = {
  PC: SHARED_MOTOR_STEP_DEFAULT_VALUES,
  GV: SHARED_MOTOR_STEP_DEFAULT_VALUES,
  TX: SHARED_MOTOR_STEP_DEFAULT_VALUES,
  BD: SHARED_MOTOR_STEP_DEFAULT_VALUES,
};

export function getMotorStepDefaultValues(moduleCode: string): MotorStepDefaultValues {
  return MOTOR_STEP_DEFAULT_VALUES_BY_MODULE[asMotorModuleCode(moduleCode)];
}
