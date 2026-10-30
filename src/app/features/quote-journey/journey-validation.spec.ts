import type { FieldReference, FormFieldConfig } from '../../core/models/form-field.model';
import type { JourneyDefinition } from './models/journey.model';
import { MOTOR_JOURNEY } from './definitions/motor/motor.journey';
import { validateJourneyDependencies } from './journey-validation';

function journeyWith(reference: FieldReference): JourneyDefinition {
  const target: FormFieldConfig = {
    type: 'text',
    name: 'target',
    label: 'Target',
    validators: [
      {
        type: 'cross-field',
        name: 'test',
        dependencies: { source: reference },
        validate: () => undefined,
      },
    ],
  };
  return {
    ...MOTOR_JOURNEY,
    steps: MOTOR_JOURNEY.steps.map((step) =>
      step.name === 'your-vehicle'
        ? {
            ...step,
            sections: [
              {
                kind: 'fields',
                id: 'vehicle',
                fields: [{ type: 'text', label: 'Local', name: 'local' }, target],
              },
            ],
          }
        : step,
    ),
  };
}

describe('validateJourneyDependencies', () => {
  it('accepts local fields, other sections on this page and previous pages', () => {
    for (const reference of [
      'local',
      { step: 'your-vehicle', section: 'vehicle', field: 'local' },
      { step: 'your-details', section: 'proposer', field: 'dateOfBirth' },
    ]) {
      expect(() => validateJourneyDependencies(journeyWith(reference), 'PC')).not.toThrow();
    }
  });

  it('rejects unknown paths, future pages, derived fields and custom/repeat sources', () => {
    for (const reference of [
      'typo',
      { step: 'typo', section: 'proposer', field: 'dateOfBirth' },
      { step: 'your-details', section: 'typo', field: 'dateOfBirth' },
      { step: 'your-details', section: 'proposer', field: 'typo' },
      { step: 'your-policy', section: 'policy', field: 'startDate' },
      { step: 'your-details', section: 'occupation', field: 'occupationCode' },
      { step: 'your-details', section: 'address', field: 'postcode' },
      { step: 'additional-drivers', section: 'additionalDrivers', field: 'dateOfBirth' },
    ]) {
      expect(() => validateJourneyDependencies(journeyWith(reference), 'PC')).toThrow(
        /Invalid dependency/,
      );
    }
  });

  it('resolves module-specific field providers before checking references', () => {
    const journey = journeyWith({ step: 'your-details', section: 'proposer', field: 'vanOnly' });
    const configured: JourneyDefinition = {
      ...journey,
      steps: journey.steps.map((step) =>
        step.name === 'your-details'
          ? {
              ...step,
              sections: [
                {
                  kind: 'fields',
                  id: 'proposer',
                  fields: (moduleCode) =>
                    moduleCode === 'GV'
                      ? [
                          { type: 'text', label: 'Van only', name: 'vanOnly' },
                          { type: 'date', label: 'DOB', name: 'dateOfBirth' },
                        ]
                      : [{ type: 'date', label: 'DOB', name: 'dateOfBirth' }],
                },
              ],
            }
          : step,
      ),
    };
    expect(() => validateJourneyDependencies(configured, 'GV')).not.toThrow();
    expect(() => validateJourneyDependencies(configured, 'PC')).toThrow(/Invalid dependency/);
  });
});
