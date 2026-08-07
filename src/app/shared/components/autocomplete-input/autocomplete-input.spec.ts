import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AutocompleteInputComponent, type AutocompleteOption } from './autocomplete-input';

@Component({
  imports: [AutocompleteInputComponent],
  template: `
    <app-autocomplete-input
      label="Occupation"
      name="occupation"
      [searchFn]="searchFn"
      [initialCode]="initialCode()"
      [initialDescription]="initialDescription()"
      [disabled]="false"
      [invalid]="false"
      [valid]="false"
      (selected)="onSelected($event)"
      (cleared)="onCleared()"
    />
  `,
})
class TestHostComponent {
  searchFn = (keyword: string) =>
    of<AutocompleteOption[]>([
      { code: '394', description: 'Applications Programmer' },
      { code: 'C57', description: 'Computer Programmer' },
      { code: '51D', description: 'Web Programmer' },
    ]);

  initialCode = signal('');
  initialDescription = signal('');
  selectedOption: AutocompleteOption | null = null;
  cleared = false;

  onSelected(option: AutocompleteOption): void {
    this.selectedOption = option;
  }

  onCleared(): void {
    this.cleared = true;
  }
}

describe('AutocompleteInputComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function getInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[role="combobox"]');
  }

  function getListbox(): HTMLUListElement | null {
    return fixture.nativeElement.querySelector('[role="listbox"]');
  }

  function typeValue(value: string): void {
    const input = getInput();
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('renders a combobox input', () => {
    const input = getInput();
    expect(input).toBeTruthy();
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
  });

  it('does not search when keyword is shorter than 4 characters', () => {
    typeValue('pro');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(getListbox()).toBeNull();
  });

  it('searches after 300ms debounce with 4+ characters', () => {
    typeValue('prog');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(getListbox()).toBeTruthy();
    const options = fixture.nativeElement.querySelectorAll('[role="option"]');
    expect(options.length).toBe(3);
  });

  it('limits displayed results to 5', () => {
    host.searchFn = () =>
      of(
        Array.from({ length: 8 }, (_, i) => ({
          code: `${i}`,
          description: `Option ${i}`,
        })),
      );
    typeValue('test');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('[role="option"]');
    expect(options.length).toBe(5);
  });

  it('selects option on click', () => {
    typeValue('prog');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    const firstOption = fixture.nativeElement.querySelector('[role="option"]');
    firstOption.dispatchEvent(new Event('mousedown'));
    fixture.detectChanges();

    expect(host.selectedOption?.code).toBe('394');
    expect(getInput().value).toBe('Applications Programmer');
  });

  it('shows error message on search failure', () => {
    host.searchFn = () => throwError(() => new Error('Network error'));
    typeValue('fail');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('[role="alert"]');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Search unavailable');
  });

  it('clears error on next input', () => {
    host.searchFn = () => throwError(() => new Error('Network error'));
    fixture.detectChanges();
    typeValue('fail');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    // Confirm error is shown
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();

    // Typing clears the error immediately
    typeValue('test');
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('[role="alert"]');
    expect(errorEl).toBeNull();
  });

  it('emits cleared when user types after selection', () => {
    typeValue('prog');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    const firstOption = fixture.nativeElement.querySelector('[role="option"]');
    firstOption.dispatchEvent(new Event('mousedown'));
    fixture.detectChanges();
    host.cleared = false;

    typeValue('new');
    fixture.detectChanges();
    expect(host.cleared).toBe(true);
  });

  it('populates input with initial description', () => {
    host.initialCode.set('394');
    host.initialDescription.set('Applications Programmer');
    fixture.detectChanges();

    expect(getInput().value).toBe('Applications Programmer');
  });
});
