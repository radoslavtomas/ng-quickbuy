import type { AbstractControl } from '@angular/forms';
import { bdVehicleEngineValidator, bdVehicleYearValidator } from './form-validators';

function control(value: unknown): AbstractControl {
  return { value } as AbstractControl;
}

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
