import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { DateInputComponent } from './date-input';

@Component({
  imports: [DateInputComponent],
  template: `
    <app-date-input
      [(value)]="value"
      controlId="dateOfBirth"
      fieldName="dateOfBirth"
      label="Date of birth"
      describedBy="dateOfBirth-messages"
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

describe('DateInputComponent', () => {
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

  function dayInput(): HTMLInputElement {
    return inputs()[0];
  }

  function monthInput(): HTMLInputElement {
    return inputs()[1];
  }

  function yearInput(): HTMLInputElement {
    return inputs()[2];
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
    expect(dayInput().value).toBe('');
    expect(monthInput().value).toBe('');
    expect(yearInput().value).toBe('');
    expect(host.value()).toBe('');
  });

  it('composes day/month/year as the customer types', () => {
    type(dayInput(), '5');
    type(monthInput(), '9');
    type(yearInput(), '2026');

    expect(host.value()).toBe('05/09/2026');
  });

  it('advances focus once the day, then month, box is full', () => {
    type(dayInput(), '01');
    expect(document.activeElement).toBe(monthInput());

    type(monthInput(), '09');
    expect(document.activeElement).toBe(yearInput());
  });

  it('keeps the year box focused once it reaches four digits', () => {
    yearInput().focus();
    type(yearInput(), '2026');

    expect(document.activeElement).toBe(yearInput());
  });

  it('strips non-digit characters and clamps to the field length', () => {
    type(dayInput(), 'a3b1c');
    expect(dayInput().value).toBe('31');

    type(yearInput(), '20a2b6c9');
    expect(yearInput().value).toBe('2026');
  });

  it('pads a single-digit day or month with a leading zero on blur', () => {
    type(dayInput(), '5');
    dayInput().dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    type(monthInput(), '9');
    monthInput().dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(dayInput().value).toBe('05');
    expect(monthInput().value).toBe('09');
  });

  it('keeps partial dates out of the model while a single-digit day or month is being edited', () => {
    type(dayInput(), '5');
    expect(host.value()).toBe('');

    type(monthInput(), '9');
    expect(host.value()).toBe('');
  });

  it('hydrates from a DD/MM/YYYY default value', () => {
    host.value.set('05/09/2026');
    fixture.detectChanges();

    expect(dayInput().value).toBe('05');
    expect(monthInput().value).toBe('09');
    expect(yearInput().value).toBe('2026');
  });

  it('hydrates from a YYYY-MM-DD default value', () => {
    host.value.set('2026-09-05');
    fixture.detectChanges();

    expect(dayInput().value).toBe('05');
    expect(monthInput().value).toBe('09');
    expect(yearInput().value).toBe('2026');
  });

  it('still hydrates a calendar-invalid but structurally valid date, leaving validation to the schema', () => {
    host.value.set('31/02/2026');
    fixture.detectChanges();

    expect(dayInput().value).toBe('31');
    expect(monthInput().value).toBe('02');
    expect(yearInput().value).toBe('2026');
  });

  it('warns and leaves the fields untouched when the default value is unparsable', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    host.value.set('not-a-date');
    fixture.detectChanges();

    expect(dayInput().value).toBe('');
    expect(monthInput().value).toBe('');
    expect(yearInput().value).toBe('');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('dateOfBirth'));

    warn.mockRestore();
  });

  it('does not mark the field touched while focus moves between its own boxes', () => {
    focusOut(dayInput(), monthInput());
    expect(host.touched).toBe(false);
  });

  it('marks the field touched once focus leaves the whole control', () => {
    focusOut(yearInput(), null);
    expect(host.touched).toBe(true);
  });
});
