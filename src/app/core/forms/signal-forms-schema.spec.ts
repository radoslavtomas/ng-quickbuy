import { Injector, runInInjectionContext, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import type { FormFieldConfig } from '../models/form-field.model';
import { validDateValidator } from '../validators/form-validators';
import { buildSectionModel, buildSectionSchema, type SectionModel } from './signal-forms-schema';

interface Harness {
  readonly model: WritableSignal<SectionModel>;
  errorKinds(fieldName: string): string[];
  messages(fieldName: string): string[];
  hidden(fieldName: string): boolean;
  disabled(fieldName: string): boolean;
  set(fieldName: string, value: unknown): void;
}

/** Builds a live form from field config, the way the renderer will. */
function harness(fields: readonly FormFieldConfig[], values: Record<string, unknown> = {}): Harness {
  const injector = TestBed.inject(Injector);

  return runInInjectionContext(injector, () => {
    const model = signal<SectionModel>(buildSectionModel(fields, values));
    const tree = form(model, buildSectionSchema(fields), { injector }) as unknown as Record<
      string,
      () => {
        errors: () => readonly { kind: string; message?: string }[];
        hidden: () => boolean;
        disabled: () => boolean;
      }
    >;

    return {
      model,
      errorKinds: name => tree[name]().errors().map(error => error.kind),
      messages: name =>
        tree[name]()
          .errors()
          .map(error => error.message ?? ''),
      hidden: name => tree[name]().hidden(),
      disabled: name => tree[name]().disabled(),
      set: (name, value) => model.update(current => ({ ...current, [name]: value })),
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
        validators: [{ type: 'min', value: 1000 }, { type: 'max', value: 100000 }],
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

describe('buildSectionModel', () => {
  it('gives every configured field a key so it has a path in the tree', () => {
    const fields: readonly FormFieldConfig[] = [
      { type: 'text', label: 'A', name: 'a' },
      { type: 'checkbox', label: 'B', name: 'b' },
      { type: 'number', label: 'C', name: 'c' },
    ];

    expect(buildSectionModel(fields, {})).toEqual({ a: '', b: false, c: '' });
  });

  it('prefers provided values and ignores keys with no field', () => {
    const fields: readonly FormFieldConfig[] = [{ type: 'text', label: 'A', name: 'a' }];

    expect(buildSectionModel(fields, { a: 'kept', stale: 'dropped' })).toEqual({ a: 'kept' });
  });
});
