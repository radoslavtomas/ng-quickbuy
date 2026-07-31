import type { FormFieldConfig } from '../../../../core/models/form-field.model';
import { MODULE_JOURNEY_TYPE_BY_CODE } from '../../../../core/config/module-journeys.config';
import {
  MOTOR_STEP_ORDER,
  getMotorAdditionalDriversFields,
  getMotorStepDefaultValues,
  getMotorYourDetailsFields,
  getMotorYourPolicyFields,
  getMotorYourVehicleFields,
} from './motor';
import {
  PROPERTY_STEP_ORDER,
  getPropertyAssumptionsFields,
  getPropertyJointProposerFields,
  getPropertyStepDefaultValues,
  getPropertyYourDetailsFields,
  getPropertyYourPolicyFields,
  getPropertyYourPropertyFields,
} from './property';

export function getJourneyStepOrderForModule(moduleCode: string): readonly string[] {
  const journeyType = MODULE_JOURNEY_TYPE_BY_CODE[moduleCode.toUpperCase()];
  if (journeyType === 'motor') {
    return MOTOR_STEP_ORDER;
  }

  if (journeyType === 'property') {
    return PROPERTY_STEP_ORDER;
  }

  return [];
}

export function getJourneyHydratableStepNames(moduleCode: string): readonly string[] {
  return getJourneyStepOrderForModule(moduleCode).filter(step => step !== 'your-quotes');
}

export function getStepFieldsForModule(moduleCode: string, stepName: string): readonly FormFieldConfig[] {
  const normalizedStep = stepName.toLowerCase();
  const journeyType = MODULE_JOURNEY_TYPE_BY_CODE[moduleCode.toUpperCase()];

  if (journeyType === 'motor') {
    switch (normalizedStep) {
      case 'your-details':
        return getMotorYourDetailsFields(moduleCode);
      case 'your-vehicle':
        return getMotorYourVehicleFields(moduleCode);
      case 'additional-drivers':
        return getMotorAdditionalDriversFields(moduleCode);
      case 'your-policy':
        return getMotorYourPolicyFields(moduleCode);
      default:
        return [];
    }
  }

  if (journeyType === 'property') {
    switch (normalizedStep) {
      case 'your-details':
        return getPropertyYourDetailsFields(moduleCode);
      case 'your-property':
        return getPropertyYourPropertyFields(moduleCode);
      case 'joint-proposer':
        return getPropertyJointProposerFields(moduleCode);
      case 'your-policy':
        return getPropertyYourPolicyFields(moduleCode);
      case 'assumptions':
        return getPropertyAssumptionsFields(moduleCode);
      default:
        return [];
    }
  }

  return [];
}

export function getStepDefaultValuesForModule(moduleCode: string, stepName: string): Record<string, unknown> {
  const normalizedStep = stepName.toLowerCase();
  const journeyType = MODULE_JOURNEY_TYPE_BY_CODE[moduleCode.toUpperCase()];

  if (journeyType === 'motor') {
    return getMotorStepDefaultValues(moduleCode)[normalizedStep] ?? {};
  }

  if (journeyType === 'property') {
    return getPropertyStepDefaultValues(moduleCode)[normalizedStep] ?? {};
  }

  return {};
}
