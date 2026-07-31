import {
  getJourneyHydratableStepNames,
  getJourneyStepOrderForModule,
  getStepDefaultValuesForModule,
  getStepFieldsForModule,
} from './journey-config.selectors';

describe('journey-config.selectors', () => {
  it('returns motor journey order and excludes quotes from hydratable steps', () => {
    expect(getJourneyStepOrderForModule('GV')).toEqual([
      'your-details',
      'your-vehicle',
      'additional-drivers',
      'your-policy',
      'your-quotes',
    ]);

    expect(getJourneyHydratableStepNames('GV')).toEqual([
      'your-details',
      'your-vehicle',
      'additional-drivers',
      'your-policy',
    ]);
  });

  it('returns property step fields for the requested module/step', () => {
    const fields = getStepFieldsForModule('HC', 'your-policy');
    const names = fields.map(field => field.name);

    expect(names).toContain('policy-inceptiondate');
    expect(names).toContain('policy-volxs');
  });

  it('returns defaults with canonical keys for module/step', () => {
    const defaults = getStepDefaultValuesForModule('PC', 'your-details');

    expect(defaults['proposer-name-forenames']).toBe('');
    expect(defaults['proposer-daytimetelephone']).toBe('');
  });

  it('returns empty values for unknown module/step combinations', () => {
    expect(getJourneyStepOrderForModule('ZZ')).toEqual([]);
    expect(getStepFieldsForModule('ZZ', 'your-details')).toEqual([]);
    expect(getStepDefaultValuesForModule('ZZ', 'your-details')).toEqual({});
  });
});
