import type { FormFieldConfig } from '../../../core/models/form-field.model';
import {
  ADDRESS_LOOKUP_FIELDS,
  ADDRESS_MANUAL_FIELDS,
  DEMO_QUOTES,
  MODULE_CONTENT_STYLES,
  asString,
  hasAddressState,
} from './config/shared/common';
import {
  MOTOR_STEP_ORDER,
  getMotorAdditionalDriversFields,
  getMotorStepDefaultValues,
  getMotorYourDetailsFields,
  getMotorYourPolicyFields,
  getMotorYourVehicleFields,
} from './config/motor';
import {
  PROPERTY_STEP_ORDER,
  getPropertyAssumptionsFields,
  getPropertyJointProposerFields,
  getPropertyStepDefaultValues,
  getPropertyYourDetailsFields,
  getPropertyYourPolicyFields,
  getPropertyYourPropertyFields,
} from './config/property';

export type { DemoQuote, AddressSearchCriteria } from './config/shared/common';

export {
  ADDRESS_LOOKUP_FIELDS,
  ADDRESS_MANUAL_FIELDS,
  DEMO_QUOTES,
  MODULE_CONTENT_STYLES,
  MOTOR_STEP_ORDER,
  PROPERTY_STEP_ORDER,
  asString,
  hasAddressState,
};

// Backward-compatible exports kept during migration from monolithic to split config files.
export const MOTOR_FIRST_STEP_PERSONAL_FIELDS: readonly FormFieldConfig[] = getMotorYourDetailsFields('PC');
export const MOTOR_YOUR_VEHICLE_FIELDS: readonly FormFieldConfig[] = getMotorYourVehicleFields('PC');
export const MOTOR_ADDITIONAL_DRIVERS_FIELDS: readonly FormFieldConfig[] = getMotorAdditionalDriversFields('PC');
export const MOTOR_YOUR_POLICY_FIELDS: readonly FormFieldConfig[] = getMotorYourPolicyFields('PC');

export const PROPERTY_FIRST_STEP_PERSONAL_FIELDS: readonly FormFieldConfig[] = getPropertyYourDetailsFields('HC');
export const PROPERTY_YOUR_PROPERTY_FIELDS: readonly FormFieldConfig[] = getPropertyYourPropertyFields('HC');
export const PROPERTY_JOINT_PROPOSER_FIELDS: readonly FormFieldConfig[] = getPropertyJointProposerFields('HC');
export const PROPERTY_YOUR_POLICY_FIELDS: readonly FormFieldConfig[] = getPropertyYourPolicyFields('HC');
export const PROPERTY_ASSUMPTIONS_FIELDS: readonly FormFieldConfig[] = getPropertyAssumptionsFields('HC');

export const MOTOR_STEP_DEFAULT_VALUES = getMotorStepDefaultValues('PC');
export const PROPERTY_STEP_DEFAULT_VALUES = getPropertyStepDefaultValues('HC');
