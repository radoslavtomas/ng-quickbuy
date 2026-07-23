import { Injectable } from '@angular/core';
import { FormFieldConfig, NormalizationRule } from '../models/form-field.model';

@Injectable({ providedIn: 'root' })
export class FormNormalizationService {
  normalizeFieldValue(field: FormFieldConfig, value: unknown): unknown {
    if (!field.normalization?.length) {
      return value;
    }

    return field.normalization.reduce((current, rule) => this.applyRule(rule, current), value);
  }

  private applyRule(rule: NormalizationRule, value: unknown): unknown {
    switch (rule) {
      case 'trim':
        return typeof value === 'string' ? value.trim() : value;
      case 'uppercase':
        return typeof value === 'string' ? value.toUpperCase() : value;
      case 'lowercase':
        return typeof value === 'string' ? value.toLowerCase() : value;
      case 'phone':
        return this.normalizePhone(value);
      case 'date':
        return this.normalizeDate(value);
      case 'currency':
        return this.normalizeCurrency(value);
      default:
        return value;
    }
  }

  private normalizePhone(value: unknown): unknown {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    if (!trimmed.length) {
      return trimmed;
    }

    const hasPlusPrefix = trimmed.startsWith('+');
    const digits = trimmed.replace(/\D/g, '');
    return hasPlusPrefix ? `+${digits}` : digits;
  }

  private normalizeDate(value: unknown): unknown {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      return `${year}-${month}-${day}`;
    }

    return trimmed;
  }

  private normalizeCurrency(value: unknown): unknown {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value !== 'string') {
      return value;
    }

    const normalized = value.replace(/,/g, '').replace(/\s/g, '');
    if (!normalized.length) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : value;
  }
}
