import {
  Component,
  type ElementRef,
  effect,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

/** `DD/MM/YYYY`. */
const SLASH_FORMAT = /^(\d{2})\/(\d{2})\/(\d{4})$/;
/** `YYYY-MM-DD`, the format hydrated answers may also arrive in. */
const ISO_FORMAT = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A day/month/year date question rendered as three inputs that read as one.
 *
 * Implements `FormValueControl<string>`, so `[formField]` two-way binds a plain
 * `DD/MM/YYYY` string exactly like a text field would — every existing and future
 * validator (`required`, a custom `validatorFn`, and so on) keeps working against
 * that string without knowing this control has three boxes instead of one.
 *
 * The three boxes are kept in sync with the external value in both directions:
 * typing composes a new `DD/MM/YYYY` string outward, and an externally supplied
 * value (an initial answer, or one recalled after a saved quote) is split back
 * into the three boxes. See `syncFromExternal` for how that avoids fighting its
 * own writes.
 */
@Component({
  selector: 'app-date-input',
  templateUrl: './date-input.html',
})
export class DateInputComponent implements FormValueControl<string> {
  /** Bound by `[formField]`; `DD/MM/YYYY`, or `''` while nothing has been answered. */
  readonly value = model<string>('');

  /** Bound by `[formField]` from the field's disabled state. */
  readonly disabled = input(false);

  readonly controlId = input.required<string>();
  /** Internal field name, used only to name the field in a hydration warning. */
  readonly fieldName = input<string>('');
  /** The question's own label, used to build each box's accessible name. */
  readonly label = input<string>('Date');
  /** Ids of anything else describing this control, such as the message list. */
  readonly describedBy = input<string | null>(null);
  readonly showInvalid = input(false);
  readonly showValid = input(false);

  /** Read by `[formField]` to mark the field touched when focus leaves the group. */
  readonly touch = output<void>();

  readonly day = signal('');
  readonly month = signal('');
  readonly year = signal('');

  private readonly dayInput = viewChild<ElementRef<HTMLInputElement>>('dayInput');
  private readonly monthInput = viewChild<ElementRef<HTMLInputElement>>('monthInput');
  private readonly yearInput = viewChild<ElementRef<HTMLInputElement>>('yearInput');
  private readonly group = viewChild<ElementRef<HTMLElement>>('group');

  constructor() {
    // Reacts to externally supplied values (the initial answer, or one written back
    // by a parent) without re-running for changes this component made itself: if the
    // three boxes already compose to the incoming value, there is nothing to hydrate.
    effect(() => {
      const external = this.value();
      untracked(() => this.syncFromExternal(external));
    });
  }

  private syncFromExternal(external: string): void {
    if (external === this.compose(this.day(), this.month(), this.year())) {
      return;
    }

    this.hydrate(external);
  }

  /**
   * Splits an externally supplied value into the three boxes.
   *
   * Only the shape is checked here — `31/02/2026` still hydrates to its three
   * parts so the field's own custom validator (`validDateValidator` and similar)
   * can flag it as a real but invalid date. A value in neither known shape leaves
   * the boxes exactly as they were, empty or otherwise, and is reported with the
   * field's name so a bad default is noticed rather than silently swallowed.
   */
  private hydrate(raw: string): void {
    if (raw === '') {
      this.day.set('');
      this.month.set('');
      this.year.set('');
      return;
    }

    const slashMatch = raw.match(SLASH_FORMAT);
    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      this.day.set(day);
      this.month.set(month);
      this.year.set(year);
      return;
    }

    const isoMatch = raw.match(ISO_FORMAT);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      this.day.set(day);
      this.month.set(month);
      this.year.set(year);
      return;
    }

    console.warn(
      `[app-date-input] Ignoring default value for field "${this.fieldName()}": "${raw}" is not in DD/MM/YYYY or YYYY-MM-DD format.`,
    );
  }

  private compose(day: string, month: string, year: string): string {
    if (day === '' || month === '' || year === '') {
      return '';
    }

    const normalizedDay = day.length === 1 ? day.padStart(2, '0') : day;
    const normalizedMonth = month.length === 1 ? month.padStart(2, '0') : month;
    return `${normalizedDay}/${normalizedMonth}/${year}`;
  }

  private emitValue(): void {
    this.value.set(this.compose(this.day(), this.month(), this.year()));
  }

  private digitsOnly(raw: string, maxLength: number): string {
    return raw.replace(/\D/g, '').slice(0, maxLength);
  }

  onDayInput(event: Event): void {
    const digits = this.digitsOnly((event.target as HTMLInputElement).value, 2);
    this.day.set(digits);
    this.emitValue();

    if (digits.length === 2) {
      this.monthInput()?.nativeElement.focus();
    }
  }

  onMonthInput(event: Event): void {
    const digits = this.digitsOnly((event.target as HTMLInputElement).value, 2);
    this.month.set(digits);
    this.emitValue();

    if (digits.length === 2) {
      this.yearInput()?.nativeElement.focus();
    }
  }

  onYearInput(event: Event): void {
    const digits = this.digitsOnly((event.target as HTMLInputElement).value, 4);
    this.year.set(digits);
    this.emitValue();
  }

  onDayBlur(): void {
    if (this.day().length === 1) {
      this.day.set(this.day().padStart(2, '0'));
      this.emitValue();
    }
  }

  onMonthBlur(): void {
    if (this.month().length === 1) {
      this.month.set(this.month().padStart(2, '0'));
      this.emitValue();
    }
  }

  /**
   * Marks the whole control touched once focus actually leaves it.
   *
   * The day and month boxes move focus onward programmatically as the customer
   * types, which itself fires a native blur; without checking where focus landed,
   * that would mark the field touched — and reveal validation messages — before
   * the customer has finished typing the date at all.
   */
  onGroupFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    const host = this.group()?.nativeElement;

    if (next && host?.contains(next)) {
      return;
    }

    this.touch.emit();
  }

  /** Part of the `FormUiControl` contract: focus the first box, not the host element. */
  focus(options?: FocusOptions): void {
    this.dayInput()?.nativeElement.focus(options);
  }
}
