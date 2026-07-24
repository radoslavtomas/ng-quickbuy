import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const DEFAULT_MINIMUM_DRIVER_AGE = 18;

function toValidatedDate(year: number, month: number, day: number): Date | null {
  const candidate = new Date(year, month - 1, day);
  return candidate.getFullYear() === year && candidate.getMonth() === month - 1 && candidate.getDate() === day
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

export const validDateValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return parseDateInput(value) ? null : { validDate: true };
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