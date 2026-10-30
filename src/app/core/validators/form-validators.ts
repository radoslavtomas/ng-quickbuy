import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import type { FieldValidationError } from '../models/form-field.model';

const DEFAULT_MINIMUM_DRIVER_AGE = 18;
const MONTH_YEAR_MINIMUM_YEAR = 1900;
const MONTH_YEAR_MAXIMUM_YEAR = 2100;

function toValidatedDate(year: number, month: number, day: number): Date | null {
  const candidate = new Date(year, month - 1, day);
  return candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day
    ? candidate
    : null;
}

function parseDateInput(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, yearRaw, monthRaw, dayRaw] = isoMatch;
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    return toValidatedDate(year, month, day);
  }

  const slashMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, dayRaw, monthRaw, yearRaw] = slashMatch;
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    return toValidatedDate(year, month, day);
  }

  const noSpacesMatch = value.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (noSpacesMatch) {
    const [, dayRaw, monthRaw, yearRaw] = noSpacesMatch;
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);
    return toValidatedDate(year, month, day);
  }

  return null;
}

function calculateAge(birthDate: Date, today = new Date()): number {
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

export const validDateValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return parseDateInput(value) ? null : { validDate: true };
};

/**
 * Structural check for the `month-year` control's `YYYYMM` value: a plausible
 * year between 1900 and 2100 followed by a month between 01 and 12. Like `validDateValidator`,
 * this only checks shape, not whether the month/year combination makes sense for
 * whatever the field represents (that's for a field-specific custom validator).
 */
export const validMonthYearValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return { validMonthYear: true };
  }

  const match = value.match(/^(\d{4})(0[1-9]|1[0-2])$/);
  if (!match) {
    return { validMonthYear: true };
  }

  const year = Number(match[1]);
  return year >= MONTH_YEAR_MINIMUM_YEAR && year <= MONTH_YEAR_MAXIMUM_YEAR
    ? null
    : { validMonthYear: true };
};

function createAdultOnlyValidator(minimumDriverAge = DEFAULT_MINIMUM_DRIVER_AGE): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const birthDate = parseDateInput(control.value);
    if (!birthDate) {
      return null;
    }

    const age = calculateAge(birthDate);
    return age >= minimumDriverAge ? null : { adultOnly: true };
  };
}

export const adultOnlyValidator = createAdultOnlyValidator();

function createLicenseYearsByAgeValidator(options?: {
  dateOfBirthField?: string;
  minimumDriverAge?: number;
}): ValidatorFn {
  const dateOfBirthField = options?.dateOfBirthField ?? 'dateOfBirth';
  const minimumDriverAge = options?.minimumDriverAge ?? DEFAULT_MINIMUM_DRIVER_AGE;

  return (control: AbstractControl): ValidationErrors | null => {
    const rawYearsHeld = control.value;
    if (rawYearsHeld === null || rawYearsHeld === undefined || rawYearsHeld === '') {
      return null;
    }

    const yearsHeld = Number(rawYearsHeld);
    if (!Number.isFinite(yearsHeld)) {
      return null;
    }

    const birthDateRaw = control.parent?.get(dateOfBirthField)?.value;
    const birthDate = parseDateInput(birthDateRaw);
    if (!birthDate) {
      return null;
    }

    const age = calculateAge(birthDate);
    const maxPossibleYearsHeld = Math.max(0, age - minimumDriverAge);
    return yearsHeld <= maxPossibleYearsHeld
      ? null
      : { licenseYearsByAge: { maxPossibleYearsHeld, age } };
  };
}

export const licenseYearsByAgeValidator = createLicenseYearsByAgeValidator();
/** Pure cross-page check; the renderer supplies the clock and scoped DOB answer. */
export function validateLicenseYearsByAge(
  value: unknown,
  dependencies: Readonly<Record<string, unknown>>,
  today: Date,
): FieldValidationError | undefined {
  const birthDate = parseDateInput(dependencies['dateOfBirth']);
  if (!birthDate) {
    return {
      kind: 'dependencyRequired',
      message: 'Enter a valid date of birth in Your details before continuing.',
    };
  }

  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const yearsHeld = Number(value);
  const maxYears = Math.max(0, calculateAge(birthDate, today) - DEFAULT_MINIMUM_DRIVER_AGE);
  return Number.isFinite(yearsHeld) && yearsHeld > maxYears
    ? { kind: 'licenseYearsByAge' }
    : undefined;
}

/** How far back a breakdown vehicle's year of manufacture may be from the current year. */
const BD_VEHICLE_MAX_YEARS_IN_PAST = 13;

/**
 * BD's freeform "year of manufacture" field: a plausible 4-digit year, not in the
 * future, and no more than 13 years old. All three checks describe one question
 * — "is this year acceptable?" — so they share a single error kind rather than
 * being split into `pattern`/`max`/`custom` rules that would each need their own
 * message.
 */
export const bdVehicleYearValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const raw = control.value;
  if (raw === null || raw === undefined || `${raw}`.trim() === '') {
    return null;
  }

  const value = `${raw}`.trim();
  if (!/^\d{4}$/.test(value)) {
    return { bdVehicleYear: true };
  }

  const year = Number(value);
  const currentYear = new Date().getFullYear();
  const isValid = year <= currentYear && currentYear - year <= BD_VEHICLE_MAX_YEARS_IN_PAST;

  return isValid ? null : { bdVehicleYear: true };
};

/** BD's freeform engine size field, expressed in whole cc. */
export const bdVehicleEngineValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const raw = control.value;
  if (raw === null || raw === undefined || `${raw}`.trim() === '') {
    return null;
  }

  const value = Number(`${raw}`.trim());
  const isValid = Number.isFinite(value) && value > 0 && value < 9999;

  return isValid ? null : { bdVehicleEngine: true };
};
