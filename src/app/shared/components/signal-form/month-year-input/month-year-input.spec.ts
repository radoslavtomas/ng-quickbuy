import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MonthYearInputComponent } from './month-year-input';

@Component({
  imports: [MonthYearInputComponent],
  template: `
    <app-month-year-input
      [(value)]="value"
      controlId="cardExpiry"
      fieldName="cardExpiry"
      label="Card expiry"
      describedBy="cardExpiry-messages"
      [showInvalid]="false"
      [showValid]="false"
      (touch)="touched = true"
    />
  `,
})
class TestHostComponent {
  readonly value = signal('');
  touched = false;
}

describe('MonthYearInputComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    // Focus assertions need the fixture attached to the document.
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.nativeElement.remove();
  });

  function inputs(): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('input'));
  }

  function monthInput(): HTMLInputElement {
    return inputs()[0];
  }

  function yearInput(): HTMLInputElement {
    return inputs()[1];
  }

  function type(element: HTMLInputElement, value: string): void {
    element.value = value;
    element.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function focusOut(from: HTMLInputElement, relatedTarget: EventTarget | null): void {
    from.dispatchEvent(new FocusEvent('focusout', { relatedTarget, bubbles: true }));
    fixture.detectChanges();
  }

  it('starts empty and reports an empty string until anything is typed', () => {
    expect(monthInput().value).toBe('');
    expect(yearInput().value).toBe('');
    expect(host.value()).toBe('');
  });

  it('composes YYYYMM as the customer types', () => {
    type(monthInput(), '09');
    type(yearInput(), '2026');

    expect(host.value()).toBe('202609');
  });

  it('advances focus once the month box is full', () => {
    type(monthInput(), '09');
    expect(document.activeElement).toBe(yearInput());
  });

  it('blurs the year box once it reaches four digits', () => {
    yearInput().focus();
    type(yearInput(), '2026');

    expect(document.activeElement).not.toBe(yearInput());
  });

  it('strips non-digit characters and clamps to the field length', () => {
    type(monthInput(), 'a0b9');
    expect(monthInput().value).toBe('09');
  });

  it('pads a single-digit month with a leading zero on blur', () => {
    type(monthInput(), '9');
    monthInput().dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(monthInput().value).toBe('09');
  });

  it('hydrates from a YYYYMM default value', () => {
    host.value.set('202609');
    fixture.detectChanges();

    expect(monthInput().value).toBe('09');
    expect(yearInput().value).toBe('2026');
  });

  it('warns and leaves the fields untouched when the default value is unparsable', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    host.value.set('2026-09');
    fixture.detectChanges();

    expect(monthInput().value).toBe('');
    expect(yearInput().value).toBe('');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('cardExpiry'));

    warn.mockRestore();
  });

  it('does not mark the field touched while focus moves between its own boxes', () => {
    focusOut(monthInput(), yearInput());
    expect(host.touched).toBe(false);
  });

  it('marks the field touched once focus leaves the whole control', () => {
    focusOut(yearInput(), null);
    expect(host.touched).toBe(true);
  });
});
