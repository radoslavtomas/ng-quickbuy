import { FormFieldConfig } from '../../../../../core/models/form-field.model';
import { applyFieldAliases } from './common';

describe('specific-modules config shared/common', () => {
  it('fills canonical field names from aliases when canonical value is missing', () => {
    const fields: readonly FormFieldConfig[] = [
      {
        type: 'text',
        label: 'First name',
        name: 'proposer-name-forenames',
        metadata: { aliases: ['firstName'] },
      },
      {
        type: 'text',
        label: 'Surname',
        name: 'proposer-name-surname',
        metadata: { aliases: ['lastName'] },
      },
    ];

    const result = applyFieldAliases({ firstName: 'Alex', lastName: 'Taylor' }, fields);

    expect(result['proposer-name-forenames']).toBe('Alex');
    expect(result['proposer-name-surname']).toBe('Taylor');
  });

  it('does not override canonical values when both canonical and alias exist', () => {
    const fields: readonly FormFieldConfig[] = [
      {
        type: 'text',
        label: 'First name',
        name: 'proposer-name-forenames',
        metadata: { aliases: ['firstName'] },
      },
    ];

    const result = applyFieldAliases(
      {
        'proposer-name-forenames': 'Canonical',
        firstName: 'Legacy',
      },
      fields,
    );

    expect(result['proposer-name-forenames']).toBe('Canonical');
  });
});
