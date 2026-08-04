import { MODULE_CATALOGUE } from '../../../core/config/module-catalogue';
import { BRAND_CONFIGS } from '../../../core/config/brands.config';
import {
  findStep,
  getFirstStep,
  getJourneyForModule,
  getNextStep,
  getPreviousStep,
  getQuestionSteps,
  getStepNumber,
  isValidStepForModule,
} from './journey-registry';

describe('journey registry', () => {
  it('resolves each catalogued module to a journey', () => {
    for (const module of MODULE_CATALOGUE) {
      expect(getJourneyForModule(module.code)?.id).toBe(module.journeyId);
    }
  });

  it('returns null for an unknown module instead of defaulting to a journey', () => {
    // The previous implementation fell back to PC/HC, which silently showed a
    // customer the wrong product's questions.
    expect(getJourneyForModule('ZZ')).toBeNull();
    expect(getJourneyForModule('')).toBeNull();
    expect(getJourneyForModule(null)).toBeNull();
  });

  it('accepts module codes in any casing', () => {
    expect(getJourneyForModule('pc')?.id).toBe('motor');
    expect(isValidStepForModule('hc', 'YOUR-POLICY')).toBe(true);
  });

  it('validates steps against the module journey', () => {
    expect(isValidStepForModule('PC', 'your-vehicle')).toBe(true);
    // your-property belongs to the property journey, not motor.
    expect(isValidStepForModule('PC', 'your-property')).toBe(false);
    expect(isValidStepForModule('HC', 'your-property')).toBe(true);
    expect(isValidStepForModule('ZZ', 'your-details')).toBe(false);
  });

  it('derives ordering from the step list rather than stored links', () => {
    const motor = getJourneyForModule('PC');
    if (!motor) {
      throw new Error('expected a motor journey');
    }

    expect(getFirstStep(motor).name).toBe('your-details');
    expect(getPreviousStep(motor, 'your-details')).toBeNull();
    expect(getNextStep(motor, 'your-details')?.name).toBe('your-vehicle');
    expect(getPreviousStep(motor, 'your-vehicle')?.name).toBe('your-details');
    expect(getNextStep(motor, 'your-quotes')).toBeNull();
    expect(getStepNumber(motor, 'your-policy')).toBe(4);
  });

  it('treats only the outcome step as non-question', () => {
    const property = getJourneyForModule('HC');
    if (!property) {
      throw new Error('expected a property journey');
    }

    expect(property.steps).toHaveLength(6);
    expect(getQuestionSteps(property).map(step => step.name)).toEqual([
      'your-details',
      'your-property',
      'joint-proposer',
      'your-policy',
      'assumptions',
    ]);
  });

  it('finds steps case-insensitively and rejects unknown ones', () => {
    const motor = getJourneyForModule('GV');
    if (!motor) {
      throw new Error('expected a motor journey');
    }

    expect(findStep(motor, 'YOUR-VEHICLE')?.name).toBe('your-vehicle');
    expect(findStep(motor, 'nope')).toBeNull();
    expect(findStep(motor, null)).toBeNull();
  });

  it('gives every step a unique route slug and store step id', () => {
    for (const module of MODULE_CATALOGUE) {
      const journey = getJourneyForModule(module.code);
      if (!journey) {
        throw new Error(`expected a journey for ${module.code}`);
      }

      const names = journey.steps.map(step => step.name);
      const storeSteps = journey.steps.map(step => step.storeStep);
      expect(new Set(names).size).toBe(names.length);
      expect(new Set(storeSteps).size).toBe(storeSteps.length);
    }
  });

  it('gives every section within a step a unique id, since answers are keyed by it', () => {
    for (const module of MODULE_CATALOGUE) {
      const journey = getJourneyForModule(module.code);
      if (!journey) {
        throw new Error(`expected a journey for ${module.code}`);
      }

      for (const step of journey.steps) {
        const ids = step.sections.map(section => section.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it('only lets brands sell modules that exist in the catalogue', () => {
    const catalogued = new Set(MODULE_CATALOGUE.map(module => module.code));

    for (const brand of Object.values(BRAND_CONFIGS)) {
      for (const code of brand.moduleCodes) {
        expect(catalogued.has(code)).toBe(true);
      }
    }
  });
});
