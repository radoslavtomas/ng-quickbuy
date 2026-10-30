import type { AbstractControl } from '@angular/forms';
import {
  bdVehicleEngineValidator,
  bdVehicleYearValidator,
  validMonthYearValidator,
  validateLicenseYearsByAge,
} from './form-validators';

function control(value: unknown): AbstractControl {
  return { value } as AbstractControl;
}

describe('validateLicenseYearsByAge', () => {
  const today = new Date(2026, 9, 30);
  it('accepts the maximum and rejects another year, including on a birthday', () => {
    expect(validateLicenseYearsByAge(8, { dateOfBirth: '30/10/2000' }, today)).toBeUndefined();
    expect(validateLicenseYearsByAge(9, { dateOfBirth: '30/10/2000' }, today)?.kind).toBe('licenseYearsByAge');
    expect(validateLicenseYearsByAge(8, { dateOfBirth: '31/10/2000' }, today)?.kind).toBe('licenseYearsByAge');
    expect(validateLicenseYearsByAge(7, { dateOfBirth: '2000-10-31' }, today)).toBeUndefined();
    expect(validateLicenseYearsByAge(7, { dateOfBirth: '31102000' }, today)).toBeUndefined();
  });

  it('requires a usable DOB rather than silently bypassing the check', () => {
    for (const dateOfBirth of [undefined, '', '31/02/2000', 'not a date']) {
      const error = validateLicenseYearsByAge(8, { dateOfBirth }, today);
      expect(error?.kind).toBe('dependencyRequired');
      expect(error?.message).toContain('Your details');
    }
  });

  it('leaves missing target answers to required and allows zero years', () => {
    for (const value of [null, undefined, '', 0]) {
      expect(validateLicenseYearsByAge(value, { dateOfBirth: '30/10/2008' }, today)).toBeUndefined();
    }
  });
});

describe('validMonthYearValidator', () => {
  it('passes an empty value, leaving required to police presence', () => {
    expect(validMonthYearValidator(control(''))).toBeNull();
    expect(validMonthYearValidator(control(null))).toBeNull();
  });

  it('accepts valid months and the year range boundaries', () => {
    expect(validMonthYearValidator(control('190001'))).toBeNull();
    expect(validMonthYearValidator(control('202612'))).toBeNull();
    expect(validMonthYearValidator(control('210012'))).toBeNull();
  });

  it('rejects invalid months and years outside the plausible range', () => {
    expect(validMonthYearValidator(control('189912'))).toEqual({ validMonthYear: true });
    expect(validMonthYearValidator(control('210101'))).toEqual({ validMonthYear: true });
    expect(validMonthYearValidator(control('202600'))).toEqual({ validMonthYear: true });
    expect(validMonthYearValidator(control('202613'))).toEqual({ validMonthYear: true });
  });
});

describe('bdVehicleYearValidator', () => {
  const currentYear = new Date().getFullYear();

  it('passes an empty value, leaving required to police presence', () => {
    expect(bdVehicleYearValidator(control(''))).toBeNull();
    expect(bdVehicleYearValidator(control(null))).toBeNull();
  });

  it('rejects a value that is not a 4-digit year', () => {
    expect(bdVehicleYearValidator(control('15'))).toEqual({ bdVehicleYear: true });
    expect(bdVehicleYearValidator(control('abcd'))).toEqual({ bdVehicleYear: true });
  });

  it('rejects a year in the future', () => {
    expect(bdVehicleYearValidator(control(`${currentYear + 1}`))).toEqual({
      bdVehicleYear: true,
    });
  });

  it('rejects a year more than 13 years in the past', () => {
    expect(bdVehicleYearValidator(control(`${currentYear - 14}`))).toEqual({
      bdVehicleYear: true,
    });
  });

  it('accepts the current year and exactly 13 years ago', () => {
    expect(bdVehicleYearValidator(control(`${currentYear}`))).toBeNull();
    expect(bdVehicleYearValidator(control(`${currentYear - 13}`))).toBeNull();
  });
});

describe('bdVehicleEngineValidator', () => {
  it('passes an empty value, leaving required to police presence', () => {
    expect(bdVehicleEngineValidator(control(''))).toBeNull();
  });

  it('rejects non-numeric input', () => {
    expect(bdVehicleEngineValidator(control('abc'))).toEqual({ bdVehicleEngine: true });
  });

  it('rejects zero and negative values', () => {
    expect(bdVehicleEngineValidator(control('0'))).toEqual({ bdVehicleEngine: true });
    expect(bdVehicleEngineValidator(control('-100'))).toEqual({ bdVehicleEngine: true });
  });

  it('rejects a value that is not less than 9999', () => {
    expect(bdVehicleEngineValidator(control('9999'))).toEqual({ bdVehicleEngine: true });
  });

  it('accepts a plausible cc value or a decimal litres value', () => {
    expect(bdVehicleEngineValidator(control('1600'))).toBeNull();
    expect(bdVehicleEngineValidator(control('1.6'))).toBeNull();
  });
});
