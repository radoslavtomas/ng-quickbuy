import { matchesConditions } from '../../../../../core/forms/field-conditions';
import { applyDerivedValues } from '../../../../../core/forms/signal-forms-schema';
import type { FormFieldConfig } from '../../../../../core/models/form-field.model';
import { createOccupationFields } from './occupation.fields';

const FIELDS = createOccupationFields({ includeSecondJob: true });

function byName(fields: readonly FormFieldConfig[], name: string): FormFieldConfig {
  const field = fields.find((candidate) => candidate.name === name);
  if (!field) {
    throw new Error(`No field named "${name}".`);
  }

  return field;
}

/** What the section would hand to the mapper for a given set of answers. */
function derive(
  values: Record<string, unknown>,
  fields: readonly FormFieldConfig[] = FIELDS,
): Record<string, unknown> {
  return applyDerivedValues(fields, values);
}

/** Whether the renderer would show a field for a given set of answers. */
function isVisible(
  name: string,
  values: Record<string, unknown>,
  fields: readonly FormFieldConfig[] = FIELDS,
): boolean {
  return matchesConditions(byName(fields, name).visibleWhen, values);
}

describe('occupation fields', () => {
  it('asks nothing beyond the status until one is chosen', () => {
    expect(isVisible('occupation', {})).toBe(false);
    expect(isVisible('industry', {})).toBe(false);
    expect(isVisible('occupationFte', {})).toBe(false);
    expect(isVisible('hasParttime', {})).toBe(false);
  });

  it('searches for an occupation and industry when the status calls for it', () => {
    for (const employmentStatus of ['E', 'SE', 'D', 'P', 'G', 'O', 'L']) {
      expect(isVisible('occupation', { employmentStatus })).toBe(true);
      expect(isVisible('industry', { employmentStatus })).toBe(true);
      expect(isVisible('occupationFte', { employmentStatus })).toBe(false);
    }
  });

  it('offers the student list instead of a search for someone in education', () => {
    expect(isVisible('occupationFte', { employmentStatus: 'FTE' })).toBe(true);
    expect(isVisible('occupation', { employmentStatus: 'FTE' })).toBe(false);
    expect(isVisible('industry', { employmentStatus: 'FTE' })).toBe(false);
  });

  it('asks nothing further of a status that describes itself', () => {
    for (const employmentStatus of ['R', 'U', 'H']) {
      expect(isVisible('occupation', { employmentStatus })).toBe(false);
      expect(isVisible('occupationFte', { employmentStatus })).toBe(false);
    }
  });

  it('derives the codes from a searched occupation', () => {
    const derived = derive({
      employmentStatus: 'E',
      occupation: { code: '394', description: 'Applications Programmer' },
      industry: { code: '021', description: 'Computing' },
    });

    expect(derived['occupationCode']).toBe('394');
    expect(derived['industryCode']).toBe('021');
  });

  it('derives the code a student chose, which the old select never sent', () => {
    const derived = derive({ employmentStatus: 'FTE', occupationFte: 'S51' });

    expect(derived['occupationCode']).toBe('S51');
    expect(derived['industryCode']).toBe('186');
  });

  it('derives the insurer codes for a status that describes itself', () => {
    expect(derive({ employmentStatus: 'R' })['occupationCode']).toBe('R09');
    expect(derive({ employmentStatus: 'R' })['industryCode']).toBe('947');
    expect(derive({ employmentStatus: 'U' })['occupationCode']).toBe('U03');
    expect(derive({ employmentStatus: 'H' })['occupationCode']).toBe('H09');
  });

  it('sends nothing when no status has been chosen', () => {
    expect(derive({})['occupationCode']).toBe('');
    expect(derive({})['industryCode']).toBe('');
  });

  /**
   * The failure the old implementation allowed: a customer searched for an
   * occupation, then changed their status, and the previous code was still sent.
   */
  it('never keeps a code the current status cannot justify', () => {
    const searched = {
      employmentStatus: 'E',
      occupation: { code: '394', description: 'Applications Programmer' },
      industry: { code: '021', description: 'Computing' },
      occupationFte: 'S51',
    };

    expect(derive(searched)['occupationCode']).toBe('394');

    // The customer retires. Their old answers are still in the model, untouched, so
    // that going back restores them — but they must not reach the insurer.
    const retired = derive({ ...searched, employmentStatus: 'R' });
    expect(retired['occupationCode']).toBe('R09');
    expect(retired['industryCode']).toBe('947');
  });

  it('asks about a second job once the first is described', () => {
    expect(isVisible('hasParttime', { employmentStatus: 'E' })).toBe(true);
    expect(isVisible('ptEmploymentStatus', { employmentStatus: 'E' })).toBe(false);
    expect(isVisible('ptEmploymentStatus', { employmentStatus: 'E', hasParttime: 'yes' })).toBe(
      true,
    );
  });

  it('derives the second job codes independently of the first', () => {
    const derived = derive({
      employmentStatus: 'R',
      hasParttime: 'yes',
      ptEmploymentStatus: 'E',
      ptOccupation: { code: '394', description: 'Applications Programmer' },
      ptIndustry: { code: '021', description: 'Computing' },
    });

    expect(derived['occupationCode']).toBe('R09');
    expect(derived['ptOccupationCode']).toBe('394');
    expect(derived['ptIndustryCode']).toBe('021');
  });

  it('sends no second job when the customer says there is not one', () => {
    const derived = derive({
      employmentStatus: 'E',
      occupation: { code: '394', description: 'Applications Programmer' },
      hasParttime: 'no',
      // Left over from a "yes" the customer changed their mind about.
      ptEmploymentStatus: 'E',
      ptOccupation: { code: 'C57', description: 'Computer Programmer' },
    });

    expect(derived['ptOccupationCode']).toBe('');
    expect(derived['ptIndustryCode']).toBe('');
  });

  it('offers a limited company only when asked to', () => {
    const labels = (fields: readonly FormFieldConfig[]) =>
      (byName(fields, 'employmentStatus').options ?? []).map((option) => option.label);

    expect(labels(createOccupationFields())).not.toContain('Limited Company');
    expect(labels(createOccupationFields({ includeLimitedCompany: true }))).toContain(
      'Limited Company',
    );
  });

  describe('behind a gate, as for a joint proposer', () => {
    const GATED = createOccupationFields({
      gate: [{ field: 'hasJointProposer', operator: 'equals', value: 'yes' }],
    });

    it('asks nothing at all until the gate opens', () => {
      expect(isVisible('employmentStatus', {}, GATED)).toBe(false);
      expect(isVisible('employmentStatus', { hasJointProposer: 'yes' }, GATED)).toBe(true);
    });

    it('still requires the status before the searches appear', () => {
      expect(isVisible('occupation', { hasJointProposer: 'yes' }, GATED)).toBe(false);
      expect(
        isVisible('occupation', { hasJointProposer: 'yes', employmentStatus: 'E' }, GATED),
      ).toBe(true);
    });

    it('sends nothing for a person who was never declared', () => {
      const derived = derive({ hasJointProposer: 'no', employmentStatus: 'R' }, GATED);

      expect(derived['occupationCode']).toBe('');
      expect(derived['industryCode']).toBe('');
    });
  });

  describe('rebuilding answers from a recalled quote', () => {
    function toAnswers(name: string, value: unknown, values: Record<string, unknown>) {
      return byName(FIELDS, name).derived?.toAnswers?.(value, values) ?? {};
    }

    it('turns a searched code back into an option awaiting its wording', () => {
      expect(toAnswers('occupationCode', '394', { employmentStatus: 'E' })).toEqual({
        occupation: { code: '394', description: '' },
      });
      expect(toAnswers('industryCode', '021', { employmentStatus: 'E' })).toEqual({
        industry: { code: '021', description: '' },
      });
    });

    it('turns a student code back into a choice from the list', () => {
      expect(toAnswers('occupationCode', 'S51', { employmentStatus: 'FTE' })).toEqual({
        occupationFte: 'S51',
      });
      // The student industry is implied by the status, not an answer of its own.
      expect(toAnswers('industryCode', '186', { employmentStatus: 'FTE' })).toEqual({});
    });

    it('rebuilds nothing for a status that describes itself', () => {
      expect(toAnswers('occupationCode', 'R09', { employmentStatus: 'R' })).toEqual({});
      expect(toAnswers('industryCode', '947', { employmentStatus: 'R' })).toEqual({});
    });

    it('round-trips a searched occupation through derive and back', () => {
      const answers = {
        employmentStatus: 'E',
        occupation: { code: '394', description: 'Applications Programmer' },
        industry: { code: '021', description: 'Computing' },
      };

      const derived = derive(answers);
      const rebuilt = {
        employmentStatus: 'E',
        ...toAnswers('occupationCode', derived['occupationCode'], answers),
        ...toAnswers('industryCode', derived['industryCode'], answers),
      };

      expect(derive(rebuilt)['occupationCode']).toBe('394');
      expect(derive(rebuilt)['industryCode']).toBe('021');
    });
  });
});
