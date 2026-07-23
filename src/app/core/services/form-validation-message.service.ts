import { Injectable } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { FormFieldConfig } from '../models/form-field.model';

@Injectable({ providedIn: 'root' })
export class FormValidationMessageService {
  resolveMessages(field: FormFieldConfig, errors: ValidationErrors | null): string[] {
    if (!errors) {
      return [];
    }

    const errorKeys = Object.keys(errors);
    if (!errorKeys.length) {
      return [];
    }

    const validatorMessages = new Map(
      (field.validators ?? [])
        .filter((config) => !!config.message)
        .map((config) => [config.type === 'custom' && config.name ? config.name : config.type, config.message as string]),
    );

    return errorKeys.map((key) => {
      const customMessage = validatorMessages.get(key);
      if (customMessage) {
        return customMessage;
      }

      return this.defaultMessage(field.label, key, errors[key]);
    });
  }

  private defaultMessage(label: string, key: string, value: unknown): string {
    switch (key) {
      case 'required':
        return `${label} is required.`;
      case 'email':
        return 'Enter a valid email address.';
      case 'minlength': {
        const requiredLength = this.safeLength(value, 'requiredLength');
        return `${label} must be at least ${requiredLength} characters.`;
      }
      case 'maxlength': {
        const requiredLength = this.safeLength(value, 'requiredLength');
        return `${label} must be ${requiredLength} characters or fewer.`;
      }
      case 'min':
        return `${label} must be greater than or equal to ${this.safeScalar(value, 'min')}.`;
      case 'max':
        return `${label} must be less than or equal to ${this.safeScalar(value, 'max')}.`;
      case 'pattern':
        return `${label} is not in the expected format.`;
      default:
        return `${label} is invalid.`;
    }
  }

  private safeLength(errorValue: unknown, key: string): number {
    if (typeof errorValue === 'object' && errorValue && key in errorValue) {
      const raw = (errorValue as Record<string, unknown>)[key];
      return typeof raw === 'number' ? raw : 0;
    }
    return 0;
  }

  private safeScalar(errorValue: unknown, key: string): string | number {
    if (typeof errorValue === 'object' && errorValue && key in errorValue) {
      const raw = (errorValue as Record<string, unknown>)[key];
      return typeof raw === 'string' || typeof raw === 'number' ? raw : '';
    }
    return '';
  }
}
