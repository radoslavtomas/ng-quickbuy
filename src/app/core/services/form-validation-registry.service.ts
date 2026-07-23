import { Injectable } from '@angular/core';
import { ValidatorFn, Validators } from '@angular/forms';
import { FieldValidatorConfig } from '../models/form-field.model';

export type ValidatorFactory = (config: FieldValidatorConfig) => ValidatorFn | null;

@Injectable({ providedIn: 'root' })
export class FormValidationRegistryService {
  private readonly customFactories = new Map<string, ValidatorFactory>();

  register(name: string, factory: ValidatorFactory): void {
    this.customFactories.set(name, factory);
  }

  createValidators(configs: readonly FieldValidatorConfig[] | undefined): ValidatorFn[] {
    if (!configs?.length) {
      return [];
    }

    return configs
      .map((config) => this.createSingleValidator(config))
      .filter((validator): validator is ValidatorFn => validator !== null);
  }

  private createSingleValidator(config: FieldValidatorConfig): ValidatorFn | null {
    if (config.type === 'custom') {
      if (config.validatorFn) {
        return config.validatorFn;
      }

      if (config.name) {
        const factory = this.customFactories.get(config.name);
        return factory ? factory(config) : null;
      }

      return null;
    }

    switch (config.type) {
      case 'required':
        return Validators.required;
      case 'email':
        return Validators.email;
      case 'min':
        return Validators.min(Number(config.value));
      case 'max':
        return Validators.max(Number(config.value));
      case 'minLength':
        return Validators.minLength(Number(config.value));
      case 'maxLength':
        return Validators.maxLength(Number(config.value));
      case 'pattern': {
        const patternValue = config.value;
        if (patternValue === undefined) {
          return null;
        }
        return Validators.pattern(patternValue as string | RegExp);
      }
      default:
        return null;
    }
  }
}
