import type { FieldCondition } from '../models/form-field.model';

/**
 * Evaluates one configuration condition against a value.
 *
 * Kept apart from the schema adapter because the same rules are needed in two
 * places: reactively, against the field tree, and plainly, against a set of
 * answers. Two implementations would eventually disagree, and a condition that
 * hides a question in the UI but not in a derivation is how a customer ends up
 * quoted on an answer they never gave.
 */
export function evaluateCondition(condition: FieldCondition, value: unknown): boolean {
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
}

/** True when every condition holds for the given answers. Conditions are ANDed. */
export function matchesConditions(
  conditions: readonly FieldCondition[] | undefined,
  values: Readonly<Record<string, unknown>>,
): boolean {
  return (conditions ?? []).every((condition) =>
    evaluateCondition(condition, values[condition.field]),
  );
}
