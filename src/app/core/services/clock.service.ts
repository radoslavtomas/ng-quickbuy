import { Injectable } from '@angular/core';

/** Formats a date as `DD/MM/YYYY`, the format the quote APIs expect. */
export function formatAsDayMonthYear(date: Date): string {
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

/**
 * The only place the application reads the current time.
 *
 * Everything that needs "now" injects this rather than calling `new Date()`
 * directly, so date-dependent behaviour — the policy inception default, request
 * timestamps — can be asserted in tests instead of being untestable.
 */
@Injectable({ providedIn: 'root' })
export class ClockService {
  now(): Date {
    return new Date();
  }

  /** Today as `DD/MM/YYYY`. */
  today(): string {
    return formatAsDayMonthYear(this.now());
  }

  timestamp(): string {
    return this.now().toISOString();
  }
}
