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

/** `YYYYMM`, the only format this control hydrates from or exposes. */
const YYYYMM_FORMAT = /^(\d{4})(\d{2})$/;

/**
 * A month/year question rendered as two inputs that read as one, exposing a
 * single `YYYYMM` string.
 *
 * Implements `FormValueControl<string>`, following the same contract as
 * `DateInputComponent`, so `[formField]` binds `YYYYMM` like any other string
 * field and every validator — built-in or custom — works against it unchanged.
 */
@Component({
  selector: 'app-month-year-input',
  templateUrl: './month-year-input.html',
})
export class MonthYearInputComponent implements FormValueControl<string> {
  /** Bound by `[formField]`; `YYYYMM`, or `''` while nothing has been answered. */
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

  readonly month = signal('');
  readonly year = signal('');

  private readonly monthInput = viewChild<ElementRef<HTMLInputElement>>('monthInput');
  private readonly yearInput = viewChild<ElementRef<HTMLInputElement>>('yearInput');
  private readonly group = viewChild<ElementRef<HTMLElement>>('group');

  constructor() {
    // See `DateInputComponent` for why this guards against re-hydrating values
    // this component wrote itself.
    effect(() => {
      const external = this.value();
      untracked(() => this.syncFromExternal(external));
    });
  }

  private syncFromExternal(external: string): void {
    if (external === this.compose(this.month(), this.year())) {
      return;
    }

    this.hydrate(external);
  }

  private hydrate(raw: string): void {
    if (raw === '') {
      this.month.set('');
      this.year.set('');
      return;
    }

    const match = raw.match(YYYYMM_FORMAT);
    if (match) {
      const [, year, month] = match;
      this.month.set(month);
      this.year.set(year);
      return;
    }

    console.warn(
      `[app-month-year-input] Ignoring default value for field "${this.fieldName()}": "${raw}" is not in YYYYMM format.`,
    );
  }

  private compose(month: string, year: string): string {
    if (month === '' && year === '') {
      return '';
    }

    const normalizedMonth = month.length === 1 ? month.padStart(2, '0') : month;
    return `${year}${normalizedMonth}`;
  }

  private emitValue(): void {
    this.value.set(this.compose(this.month(), this.year()));
  }

  private digitsOnly(raw: string, maxLength: number): string {
    return raw.replace(/\D/g, '').slice(0, maxLength);
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

  onMonthBlur(): void {
    if (this.month().length === 1) {
      this.month.set(this.month().padStart(2, '0'));
      this.emitValue();
    }
  }

  /** See `DateInputComponent.onGroupFocusOut` for why this checks `relatedTarget`. */
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
    this.monthInput()?.nativeElement.focus(options);
  }
}
