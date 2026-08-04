import {
  getJourneyByType,
  isValidJourneyStepForModule,
  MOTOR_JOURNEY,
  PROPERTY_JOURNEY,
} from './module-journeys.config';

describe('module-journeys.config', () => {
  it('returns motor journey by type', () => {
    expect(getJourneyByType('motor')).toBe(MOTOR_JOURNEY);
    expect(getJourneyByType('motor').length).toBe(5);
    expect(getJourneyByType('motor')[0].name).toBe('your-details');
    expect(getJourneyByType('motor')[4].name).toBe('your-quotes');
  });

  it('returns property journey by type', () => {
    expect(getJourneyByType('property')).toBe(PROPERTY_JOURNEY);
    expect(getJourneyByType('property').length).toBe(6);
    expect(getJourneyByType('property')[0].name).toBe('your-details');
    expect(getJourneyByType('property')[5].name).toBe('your-quotes');
  });

  it('accepts valid motor steps for motor modules', () => {
    expect(isValidJourneyStepForModule('TX', 'your-details')).toBe(true);
    expect(isValidJourneyStepForModule('PC', 'your-policy')).toBe(true);
    expect(isValidJourneyStepForModule('GV', 'YOUR-QUOTES')).toBe(true);
  });

  it('accepts valid property steps for property modules', () => {
    expect(isValidJourneyStepForModule('HC', 'joint-proposer')).toBe(true);
    expect(isValidJourneyStepForModule('LL', 'assumptions')).toBe(true);
    expect(isValidJourneyStepForModule('HH', 'YOUR-QUOTES')).toBe(true);
  });

  it('rejects unknown modules and invalid step combinations', () => {
    expect(isValidJourneyStepForModule('ZZ', 'your-details')).toBe(false);
    expect(isValidJourneyStepForModule('TX', 'joint-proposer')).toBe(false);
    expect(isValidJourneyStepForModule('HC', 'additional-drivers')).toBe(false);
    expect(isValidJourneyStepForModule('TX', 'not-a-step')).toBe(false);
  });
});