import type { AbstractControl, ValidatorFn } from '@angular/forms';
import {
  disabled,
  email,
  hidden,
  max,
  maxLength,
  min,
  minLength,
  pattern,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import type { FieldCondition, FormFieldConfig } from '../models/form-field.model';
import { evaluateCondition } from './field-conditions';

/**
 * Model shape for a config-driven section.
 *
 * Field names come from configuration, so the model is an index signature rather
 * than a declared interface. Signal Forms supports this: `Subfields` maps over
 * `keyof TModel`, which makes dynamic path access valid.
 */
export type SectionModel = Record<string, unknown>;

/** Minimal view of the schema path tree, keyed dynamically by field name. */
type SectionPath = Record<string, unknown>;

/**
 * Fields the customer actually answers.
 *
 * A `derived` field is not a control: it has no node in the tree, no rules and no
 * key in the model, because its value is recomputed from the answers whenever the
 * section is read. Leaving it out is what stops it from going stale.
 */
export function getControlFields(fields: readonly FormFieldConfig[]): readonly FormFieldConfig[] {
  return fields.filter((field) => field.type !== 'derived');
}

/** Fields assembled from the answers rather than asked for. */
export function getDerivedFields(fields: readonly FormFieldConfig[]): readonly FormFieldConfig[] {
  return fields.filter((field) => field.type === 'derived' && !!field.derived);
}

/**
 * Applies every `derived` field to a set of answers.
 *
 * Derivations read the answers as they are now, so a customer who changes their
 * employment status cannot leave behind the occupation code the previous status
 * produced.
 */
export function applyDerivedValues(
  fields: readonly FormFieldConfig[],
  values: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const derived = getDerivedFields(fields);
  if (derived.length === 0) {
    return { ...values };
  }

  const result: Record<string, unknown> = { ...values };
  for (const field of derived) {
    result[field.name] = field.derived?.from(values);
  }

  return result;
}

/**
 * Builds a Signal Forms schema from field configuration.
 *
 * This is the single boundary between configuration (untyped by nature, since a
 * journey decides its own questions) and Signal Forms (typed by design). The casts
 * below are confined to this file on purpose: validator signatures expect concrete
 * types such as `number | null`, which a dynamic model cannot promise. Nothing
 * outside this module should need to cast.
 */
export function buildSectionSchema(fields: readonly FormFieldConfig[]) {
  const controlFields = getControlFields(fields);

  // The path object resolves any key, and reading one that is not in the model
  // throws at validation time, so rules may only reference fields of this section.
  const fieldNames = new Set(controlFields.map((field) => field.name));

  return schema<SectionModel>((path) => {
    const sectionPath = path as unknown as SectionPath;

    for (const field of controlFields) {
      applyFieldRules(field, sectionPath, fieldNames);
    }
  });
}

function applyFieldRules(
  field: FormFieldConfig,
  path: SectionPath,
  fieldNames: ReadonlySet<string>,
): void {
  const target = path[field.name] as never;

  for (const validator of field.validators ?? []) {
    const message = validator.message;

    switch (validator.type) {
      case 'required':
        // Checkboxes and toggles must be ticked, which `required` alone does not
        // express for a boolean: `false` is a present value.
        if (field.type === 'checkbox' || field.type === 'toggle') {
          validate(target, (ctx) =>
            ctx.value() === true
              ? undefined
              : { kind: 'required', message: message ?? `${field.label} is required.` },
          );
        } else {
          required(target, { message });
        }
        break;
      case 'email':
        email(target, { message });
        break;
      case 'min':
        min(target, Number(validator.value), { message });
        break;
      case 'max':
        max(target, Number(validator.value), { message });
        break;
      case 'minLength':
        minLength(target, Number(validator.value), { message });
        break;
      case 'maxLength':
        maxLength(target, Number(validator.value), { message });
        break;
      case 'pattern':
        if (validator.value !== undefined) {
          pattern(target, toRegExp(validator.value), { message });
        }
        break;
      case 'custom':
        applyCustomValidator(field, validator.validatorFn, message, target, path, fieldNames);
        break;
    }
  }

  if (field.visibleWhen?.length) {
    const conditions = field.visibleWhen;
    hidden(target, { when: (ctx) => !conditionsPass(conditions, path, fieldNames, ctx) });
  }

  if (field.enabledWhen?.length) {
    const conditions = field.enabledWhen;
    disabled(target, { when: (ctx) => !conditionsPass(conditions, path, fieldNames, ctx) });
  }
}

/**
 * Bridges an existing `ValidatorFn` into Signal Forms.
 *
 * The domain validators in `core/validators` are written against `AbstractControl`,
 * so rather than rewrite them this presents a control-shaped view backed by the
 * field's value and its siblings.
 *
 * KNOWN GAP: a validator reaching for a sibling in a *different* section gets `null`,
 * because each section is its own form. `licenseYearsByAgeValidator` is in exactly
 * that position — it wants `dateOfBirth`, which the proposer section owns — so it
 * always passes. That predates this adapter (the reactive renderer had the same
 * blind spot, just silently) and is fixed by the typed model, where the rule can be
 * expressed across the whole journey. Until then the licence-years-versus-age check
 * is inert, which is an underwriting gap worth tracking.
 */
function applyCustomValidator(
  field: FormFieldConfig,
  validatorFn: ValidatorFn | undefined,
  message: string | undefined,
  target: never,
  path: SectionPath,
  fieldNames: ReadonlySet<string>,
): void {
  if (!validatorFn) {
    return;
  }

  validate(target, (ctx) => {
    const control = {
      value: ctx.value(),
      parent: {
        get: (name: string) =>
          fieldNames.has(name) ? { value: ctx.valueOf(path[name] as never) } : null,
      },
    } as unknown as AbstractControl;

    const errors = validatorFn(control);
    if (!errors) {
      return undefined;
    }

    const kind = Object.keys(errors)[0] ?? 'custom';
    return { kind, message: message ?? `${field.label} is invalid.` };
  });
}

/**
 * Evaluates configuration conditions against sibling values, reactively.
 *
 * A condition naming a field outside this section reads as `undefined` rather than
 * throwing, so a mis-scoped condition degrades instead of breaking the form.
 */
function conditionsPass(
  conditions: readonly FieldCondition[],
  path: SectionPath,
  fieldNames: ReadonlySet<string>,
  ctx: { valueOf: (p: never) => unknown },
): boolean {
  return conditions.every((condition) => {
    const value = fieldNames.has(condition.field)
      ? ctx.valueOf(path[condition.field] as never)
      : undefined;

    return evaluateCondition(condition, value);
  });
}

function toRegExp(value: number | string | RegExp): RegExp {
  return value instanceof RegExp ? value : new RegExp(`${value}`);
}

/**
 * Starting model for a section: a key per configured field, so every field has a
 * path in the tree even before the customer types anything.
 */
export function buildSectionModel(
  fields: readonly FormFieldConfig[],
  values: Readonly<Record<string, unknown>>,
): SectionModel {
  const model: SectionModel = {};

  for (const field of getControlFields(fields)) {
    const provided = values[field.name];
    model[field.name] = provided !== undefined ? provided : emptyValueFor(field);
  }

  return model;
}

function emptyValueFor(field: FormFieldConfig): unknown {
  if (field.type === 'checkbox' || field.type === 'toggle') {
    return false;
  }

  // `null` rather than `''` for numbers on purpose: the native binding only reads
  // `valueAsNumber` when the model value is already a number or null, so seeding an
  // empty string would make a numeric field report strings and break min/max.
  if (field.type === 'number') {
    return null;
  }

  // An unresolved search field is `null` rather than `''`, which is also what
  // `required` treats as empty, so typed-but-unmatched text is not an answer.
  return field.type === 'autocomplete' ? null : '';
}
