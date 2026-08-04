import { Injectable } from '@angular/core';
import type { FormFieldConfig } from '../models/form-field.model';

/**
 * Resolves the text shown for a validation error.
 *
 * A field's own configuration wins; this supplies the wording for rules that did not
 * specify a message. Keeping it in one place means the same rule reads identically
 * wherever it appears, and constraint values are taken from the field configuration
 * rather than the error payload, which differs between validators.
 */
@Injectable({ providedIn: 'root' })
export class FormValidationMessageService {
  /**
   * @param kind Error kind as reported by Signal Forms, e.g. `required`, `minLength`,
   *   or a custom validator's own key such as `validDate`.
   */
  resolve(field: FormFieldConfig, kind: string, configuredMessage?: string): string {
    if (configuredMessage) {
      return configuredMessage;
    }

    const limit = this.limitFor(field, kind);

    switch (kind) {
      case 'required':
        return `${field.label} is required.`;
      case 'email':
        return 'Enter a valid email address.';
      case 'minLength':
        return `${field.label} must be at least ${limit} characters.`;
      case 'maxLength':
        return `${field.label} must be ${limit} characters or fewer.`;
      case 'min':
        return `${field.label} must be greater than or equal to ${limit}.`;
      case 'max':
        return `${field.label} must be less than or equal to ${limit}.`;
      case 'pattern':
        return `${field.label} is not in the expected format.`;
      default:
        return `${field.label} is invalid.`;
    }
  }

  /** The constraint value configured for a rule, for messages that quote it. */
  private limitFor(field: FormFieldConfig, kind: string): number | string | undefined {
    const rule = (field.validators ?? []).find(
      validator =>
        validator.type === kind || (validator.type === 'custom' && validator.name === kind),
    );

    return typeof rule?.value === 'number' || typeof rule?.value === 'string'
      ? rule.value
      : undefined;
  }
}
