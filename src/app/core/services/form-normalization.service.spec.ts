import { TestBed } from '@angular/core/testing';
import { FormNormalizationService } from './form-normalization.service';
import type { FormFieldConfig } from '../models/form-field.model';

describe('FormNormalizationService', () => {
  let service: FormNormalizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormNormalizationService);
  });

  it('applies chained trim and uppercase rules', () => {
    const field: FormFieldConfig = {
      type: 'text',
      name: 'registration',
      label: 'Vehicle registration',
      normalization: ['trim', 'uppercase'],
    };

    expect(service.normalizeFieldValue(field, '  ab12cde  ')).toBe('AB12CDE');
  });

  it('normalizes phone values and keeps leading plus', () => {
    const field: FormFieldConfig = {
      type: 'tel',
      name: 'mobilePhone',
      label: 'Mobile number',
      normalization: ['phone'],
    };

    expect(service.normalizeFieldValue(field, ' +44 7123 456 789 ')).toBe('+447123456789');
    expect(service.normalizeFieldValue(field, '07123 456 789')).toBe('07123456789');
  });

  it('normalizes date formats into DD/MM/YYYY', () => {
    const field: FormFieldConfig = {
      type: 'date',
      name: 'dateOfBirth',
      label: 'Date of birth',
      normalization: ['date'],
    };

    expect(service.normalizeFieldValue(field, '2026-09-01')).toBe('01/09/2026');
    expect(service.normalizeFieldValue(field, '01092026')).toBe('01/09/2026');
    expect(service.normalizeFieldValue(field, '01/09/2026')).toBe('01/09/2026');
  });

  it('normalizes numeric and string currency values', () => {
    const field: FormFieldConfig = {
      type: 'number',
      name: 'voluntaryExcess',
      label: 'Voluntary excess',
      normalization: ['currency'],
    };

    expect(service.normalizeFieldValue(field, 250)).toBe(250);
    expect(service.normalizeFieldValue(field, ' 1,250 ')).toBe(1250);
    expect(service.normalizeFieldValue(field, '')).toBeNull();
    expect(service.normalizeFieldValue(field, 'abc')).toBe('abc');
  });

  it('returns the original value when no normalization is configured', () => {
    const field: FormFieldConfig = {
      type: 'text',
      name: 'firstName',
      label: 'First name',
    };

    expect(service.normalizeFieldValue(field, ' Alex ')).toBe(' Alex ');
  });
});
