import type { JourneyStep } from '../models/module-journey.model';
import type { ModuleJourneyType } from '../models/brand.model';

export const MOTOR_JOURNEY: readonly JourneyStep[] = [
  {
    id: 1,
    name: 'your-details',
    displayName: 'Your details',
    icon: 'user-edit',
    next: 'your-vehicle',
    prev: null,
  },
  {
    id: 2,
    name: 'your-vehicle',
    displayName: 'Your vehicle',
    icon: 'car',
    next: 'additional-drivers',
    prev: 'your-details',
  },
  {
    id: 3,
    name: 'additional-drivers',
    displayName: 'Additional drivers',
    icon: 'users',
    next: 'your-policy',
    prev: 'your-vehicle',
  },
  {
    id: 4,
    name: 'your-policy',
    displayName: 'Your policy',
    icon: 'file-alt',
    next: 'your-quotes',
    prev: 'additional-drivers',
  },
  {
    id: 5,
    name: 'your-quotes',
    displayName: 'Your quotes',
    icon: 'list-ol',
    next: null,
    prev: 'your-policy',
  },
];

export const PROPERTY_JOURNEY: readonly JourneyStep[] = [
  {
    id: 1,
    name: 'your-details',
    displayName: 'Your details',
    icon: 'user-edit',
    next: 'your-property',
    prev: null,
  },
  {
    id: 2,
    name: 'your-property',
    displayName: 'Your property',
    icon: 'home',
    next: 'joint-proposer',
    prev: 'your-details',
  },
  {
    id: 3,
    name: 'joint-proposer',
    displayName: 'Joint proposer',
    icon: 'users',
    next: 'your-policy',
    prev: 'your-property',
  },
  {
    id: 4,
    name: 'your-policy',
    displayName: 'Your policy',
    icon: 'file-alt',
    next: 'assumptions',
    prev: 'joint-proposer',
  },
  {
    id: 5,
    name: 'assumptions',
    displayName: 'Assumptions',
    icon: 'check-square',
    next: 'your-quotes',
    prev: 'your-policy',
  },
  {
    id: 6,
    name: 'your-quotes',
    displayName: 'Your quotes',
    icon: 'list-ol',
    next: null,
    prev: 'assumptions',
  },
];

export const JOURNEY_BY_TYPE: Readonly<Record<ModuleJourneyType, readonly JourneyStep[]>> = {
  motor: MOTOR_JOURNEY,
  property: PROPERTY_JOURNEY,
};

export const MODULE_JOURNEY_TYPE_BY_CODE: Readonly<Record<string, ModuleJourneyType>> = {
  PC: 'motor',
  GV: 'motor',
  TX: 'motor',
  BD: 'motor',
  HC: 'property',
  HH: 'property',
  LL: 'property',
};

export function getJourneyByType(type: ModuleJourneyType): readonly JourneyStep[] {
  return JOURNEY_BY_TYPE[type];
}

export function isValidJourneyStepForModule(moduleCode: string, stepName: string): boolean {
  const journeyType = MODULE_JOURNEY_TYPE_BY_CODE[moduleCode.toUpperCase()];
  if (!journeyType) {
    return false;
  }

  return JOURNEY_BY_TYPE[journeyType].some(step => step.name === stepName.toLowerCase());
}
