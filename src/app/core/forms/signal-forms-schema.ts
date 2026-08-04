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
 * Builds a Signal Forms schema from field configuration.
 *
 * This is the single boundary between configuration (untyped by nature, since a
 * journey decides its own questions) and Signal Forms (typed by design). The casts
 * below are confined to this file on purpose: validator signatures expect concrete
 * types such as `number | null`, which a dynamic model cannot promise. Nothing
 * outside this module should need to cast.
 */
export function buildSectionSchema(fields: readonly FormFieldConfig[]) {
  return schema<SectionModel>(path => {
    const sectionPath = path as unknown as SectionPath;

    for (const field of fields) {
      applyFieldRules(field, sectionPath);
    }
  });
}

function applyFieldRules(field: FormFieldConfig, path: SectionPath): void {
  const target = path[field.name] as never;

  for (const validator of field.validators ?? []) {
    const message = validator.message;

    switch (validator.type) {
      case 'required':
        // Checkboxes and toggles must be ticked, which `required` alone does not
        // express for a boolean: `false` is a present value.
        if (field.type === 'checkbox' || field.type === 'toggle') {
          validate(target, ctx =>
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
        applyCustomValidator(field, validator.validatorFn, message, target, path);
        break;
    }
  }

  if (field.visibleWhen?.length) {
    const conditions = field.visibleWhen;
    hidden(target, { when: ctx => !conditionsPass(conditions, path, ctx) });
  }

  if (field.enabledWhen?.length) {
    const conditions = field.enabledWhen;
    disabled(target, { when: ctx => !conditionsPass(conditions, path, ctx) });
  }
}

/**
 * Bridges an existing `ValidatorFn` into Signal Forms.
 *
 * The domain validators in `core/validators` are written against `AbstractControl`,
 * so rather than rewrite them this presents a control-shaped view backed by the
 * field's value and its siblings.
 *
 * KNOWN GAP: a validator reaching for a sibling that lives in a *different* section
 * finds nothing, because each section is its own form. `licenseYearsByAgeValidator`
 * is in exactly that position — it wants `dateOfBirth`, which the proposer section
 * owns — so it silently passes. That predates this adapter and is fixed by the
 * typed model, where the rule can be expressed across the whole journey.
 */
function applyCustomValidator(
  field: FormFieldConfig,
  validatorFn: ValidatorFn | undefined,
  message: string | undefined,
  target: never,
  path: SectionPath,
): void {
  if (!validatorFn) {
    return;
  }

  validate(target, ctx => {
    const control = {
      value: ctx.value(),
      parent: {
        get: (name: string) => {
          const siblingPath = path[name];
          return siblingPath === undefined ? null : { value: ctx.valueOf(siblingPath as never) };
        },
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

/** Evaluates configuration conditions against sibling values, reactively. */
function conditionsPass(
  conditions: readonly FieldCondition[],
  path: SectionPath,
  ctx: { valueOf: (p: never) => unknown },
): boolean {
  return conditions.every(condition => {
    const siblingPath = path[condition.field];
    const value = siblingPath === undefined ? undefined : ctx.valueOf(siblingPath as never);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'notEquals':
        return value !== condition.value;
      case 'in':
        return Array.isArray(condition.value) ? condition.value.includes(value) : false;
      case 'notIn':
        return Array.isArray(condition.value) ? !condition.value.includes(value) : true;
      case 'truthy':
        return Boolean(value);
      case 'falsy':
        return !value;
      default:
        return true;
    }
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

  for (const field of fields) {
    const provided = values[field.name];
    model[field.name] = provided !== undefined ? provided : emptyValueFor(field);
  }

  return model;
}

function emptyValueFor(field: FormFieldConfig): unknown {
  return field.type === 'checkbox' || field.type === 'toggle' ? false : '';
}
