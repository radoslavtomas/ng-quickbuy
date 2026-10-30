import { Injector, runInInjectionContext, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import type { CrossFieldValidatorConfig, FormFieldConfig } from '../models/form-field.model';
import { validDateValidator } from '../validators/form-validators';
import { buildSectionModel, buildSectionSchema, type SectionModel, type SectionValidationContext } from './signal-forms-schema';

interface Harness {
  readonly model: WritableSignal<SectionModel>;
  errorKinds(fieldName: string): string[];
  messages(fieldName: string): string[];
  hidden(fieldName: string): boolean;
  disabled(fieldName: string): boolean;
  set(fieldName: string, value: unknown): void;
}

/** Builds a live form from field config, the way the renderer will. */
function harness(
  fields: readonly FormFieldConfig[],
  values: Record<string, unknown> = {},
  context: SectionValidationContext = {},
): Harness {
  const injector = TestBed.inject(Injector);

  return runInInjectionContext(injector, () => {
    const model = signal<SectionModel>(buildSectionModel(fields, values));
    const tree = form(model, buildSectionSchema(fields, context), { injector }) as unknown as Record<
      string,
      () => {
        errors: () => readonly { kind: string; message?: string }[];
        hidden: () => boolean;
        disabled: () => boolean;
      }
    >;

    return {
      model,
      errorKinds: (name) =>
        tree[name]()
          .errors()
          .map((error) => error.kind),
      messages: (name) =>
        tree[name]()
          .errors()
          .map((error) => error.message ?? ''),
      hidden: (name) => tree[name]().hidden(),
      disabled: (name) => tree[name]().disabled(),
      set: (name, value) => model.update((current) => ({ ...current, [name]: value })),
    };
  });
}

describe('buildSectionSchema', () => {
  it('applies required from config and clears it once answered', () => {
    const fields: readonly FormFieldConfig[] = [
      { type: 'text', label: 'Surname', name: 'surname', validators: [{ type: 'required' }] },
    ];
    const section = harness(fields);

    expect(section.errorKinds('surname')).toContain('required');

    section.set('surname', 'Taylor');
    expect(section.errorKinds('surname')).toEqual([]);
  });

  it('carries the configured message rather than a generic one', () => {
    const fields: readonly FormFieldConfig[] = [
      {
        type: 'text',
        label: 'Postcode',
        name: 'postcode',
        validators: [{ type: 'required', message: 'Postcode is required.' }],
      },
    ];

    expect(harness(fields).messages('postcode')).toContain('Postcode is required.');
  });

  it('applies numeric bounds', () => {
    const fields: readonly FormFieldConfig[] = [
      {
        type: 'number',
        label: 'Mileage',
        name: 'mileage',
        validators: [
          { type: 'min', value: 1000 },
          { type: 'max', value: 100000 },
        ],
      },
    ];

    expect(harness(fields, { mileage: 500 }).errorKinds('mileage')).toContain('min');
    expect(harness(fields, { mileage: 200000 }).errorKinds('mileage')).toContain('max');
    expect(harness(fields, { mileage: 12000 }).errorKinds('mileage')).toEqual([]);
  });

  it('applies length and email rules', () => {
    const fields: readonly FormFieldConfig[] = [
      {
        type: 'email',
        label: 'Email',
        name: 'email',
        validators: [{ type: 'email' }],
      },
      {
        type: 'tel',
        label: 'Phone',
        name: 'phone',
        validators: [{ type: 'minLength', value: 10 }],
      },
    ];
    const section = harness(fields, { email: 'not-an-email', phone: '123' });

    expect(section.errorKinds('email')).toContain('email');
    expect(section.errorKinds('phone')).toContain('minLength');
  });

  it('treats an unticked required checkbox as missing, unlike a plain required', () => {
    const fields: readonly FormFieldConfig[] = [
      {
        type: 'checkbox',
        label: 'I confirm the details are correct',
        name: 'declarationAccepted',
        validators: [{ type: 'required', message: 'You must confirm details.' }],
      },
    ];
    const section = harness(fields);

    // `false` is a present value, so this only works because the adapter special-cases it.
    expect(section.errorKinds('declarationAccepted')).toContain('required');

    section.set('declarationAccepted', true);
    expect(section.errorKinds('declarationAccepted')).toEqual([]);
  });

  it('bridges an existing ValidatorFn, including its error kind', () => {
    const fields: readonly FormFieldConfig[] = [
      {
        type: 'date',
        label: 'Date of birth',
        name: 'dob',
        validators: [
          {
            type: 'custom',
            name: 'validDate',
            message: 'Enter a valid date in DD/MM/YYYY format.',
            validatorFn: validDateValidator,
          },
        ],
      },
    ];

    const invalid = harness(fields, { dob: '31/02/2000' });
    expect(invalid.errorKinds('dob')).toContain('validDate');
    expect(invalid.messages('dob')).toContain('Enter a valid date in DD/MM/YYYY format.');

    expect(harness(fields, { dob: '01/09/1990' }).errorKinds('dob')).toEqual([]);
  });

  it('hides and disables a field whose conditions fail, reactively', () => {
    const fields: readonly FormFieldConfig[] = [
      {
        type: 'radio',
        label: 'Any additional drivers?',
        name: 'hasAdditionalDrivers',
        options: [
          { label: 'No', value: 'no' },
          { label: 'Yes', value: 'yes' },
        ],
      },
      {
        type: 'number',
        label: 'How many?',
        name: 'additionalDriverCount',
        visibleWhen: [{ field: 'hasAdditionalDrivers', operator: 'equals', value: 'yes' }],
        enabledWhen: [{ field: 'hasAdditionalDrivers', operator: 'equals', value: 'yes' }],
      },
    ];
    const section = harness(fields, { hasAdditionalDrivers: 'no', additionalDriverCount: 1 });

    expect(section.hidden('additionalDriverCount')).toBe(true);
    expect(section.disabled('additionalDriverCount')).toBe(true);

    section.set('hasAdditionalDrivers', 'yes');

    expect(section.hidden('additionalDriverCount')).toBe(false);
    expect(section.disabled('additionalDriverCount')).toBe(false);
  });

  it('supports the truthy and in operators', () => {
    const fields: readonly FormFieldConfig[] = [
      { type: 'checkbox', label: 'Owner', name: 'owner' },
      { type: 'select', label: 'Cover', name: 'cover' },
      {
        type: 'text',
        label: 'Detail',
        name: 'detail',
        visibleWhen: [
          { field: 'owner', operator: 'truthy' },
          { field: 'cover', operator: 'in', value: ['comprehensive', 'tpft'] },
        ],
      },
    ];

    expect(harness(fields, { owner: false, cover: 'comprehensive' }).hidden('detail')).toBe(true);
    expect(harness(fields, { owner: true, cover: 'tpo' }).hidden('detail')).toBe(true);
    expect(harness(fields, { owner: true, cover: 'tpft' }).hidden('detail')).toBe(false);
  });
});

describe('cross-field validation', () => {
  const rule: CrossFieldValidatorConfig = {
    type: 'cross-field',
    name: 'withinLimit',
    dependencies: { limit: { step: 'earlier', section: 'source', field: 'limit' } },
    message: 'Above the limit.',
    dependencyMessage: 'Answer the limit question first.',
    validate: (value, dependencies) =>
      Number(value) > Number(dependencies['limit']) ? { kind: 'withinLimit' } : undefined,
  };
  const fields: readonly FormFieldConfig[] = [
    { type: 'number', name: 'amount', label: 'Amount', validators: [rule] },
  ];

  it('tracks an external signal without recreating the form or changing its answer', () => {
    const limit = signal<unknown>(10);
    const section = harness(fields, { amount: 8 }, { readAnswer: () => limit() });
    expect(section.errorKinds('amount')).toEqual([]);
    limit.set(5);
    expect(section.messages('amount')).toEqual(['Above the limit.']);
    expect(section.model()['amount']).toBe(8);
    limit.set(20);
    expect(section.errorKinds('amount')).toEqual([]);
    section.set('amount', 21);
    expect(section.errorKinds('amount')).toEqual(['withinLimit']);
  });

  it('supports local dependencies without a resolver', () => {
    const localFields: readonly FormFieldConfig[] = [
      { type: 'number', name: 'limit', label: 'Limit' },
      { ...fields[0], validators: [{ ...rule, dependencies: { limit: 'limit' } }] },
    ];
    const section = harness(localFields, { amount: 8, limit: 10 });
    section.set('limit', 5);
    expect(section.errorKinds('amount')).toEqual(['withinLimit']);
  });

  it('fails closed on an unanswered dependency, but accepts zero and false as answers', () => {
    const limit = signal<unknown>(undefined);
    const section = harness(fields, { amount: 0 }, { readAnswer: () => limit() });
    for (const value of [undefined, null, '']) {
      limit.set(value);
      expect(section.messages('amount')).toEqual(['Answer the limit question first.']);
    }
    for (const value of [0, false]) {
      limit.set(value);
      expect(section.errorKinds('amount')).toEqual([]);
    }
  });

  it('rejects missing resolvers and misspelled local dependencies at construction', () => {
    expect(() => harness(fields)).toThrow(/Invalid dependency/);
    expect(() => harness([{ ...fields[0], validators: [{ ...rule, dependencies: { limit: 'typo' } }] }]))
      .toThrow(/Invalid dependency/);
  });

  it('does not validate hidden or disabled targets against missing dependencies', () => {
    for (const mode of ['visibleWhen', 'enabledWhen'] as const) {
      const section = harness([
        { type: 'checkbox', name: 'active', label: 'Active' },
        { ...fields[0], [mode]: [{ field: 'active', operator: 'truthy' }] },
      ], { active: false }, { readAnswer: () => undefined });
      expect(section.errorKinds('amount')).toEqual([]);
      section.set('active', true);
      expect(section.errorKinds('amount')).toEqual(['dependencyRequired']);
    }
  });
});

describe('buildSectionModel', () => {
  it('gives every configured field a key so it has a path in the tree', () => {
    const fields: readonly FormFieldConfig[] = [
      { type: 'text', label: 'A', name: 'a' },
      { type: 'checkbox', label: 'B', name: 'b' },
      { type: 'number', label: 'C', name: 'c' },
    ];

    // Numbers seed as null so the native numeric binding applies; see emptyValueFor.
    expect(buildSectionModel(fields, {})).toEqual({ a: '', b: false, c: null });
  });

  it('prefers provided values and ignores keys with no field', () => {
    const fields: readonly FormFieldConfig[] = [{ type: 'text', label: 'A', name: 'a' }];

    expect(buildSectionModel(fields, { a: 'kept', stale: 'dropped' })).toEqual({ a: 'kept' });
  });
});
