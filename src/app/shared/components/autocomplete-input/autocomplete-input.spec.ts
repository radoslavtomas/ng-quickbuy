import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import type { AutocompleteOption } from '../../../core/models/autocomplete-option.model';
import type { AutocompleteSource } from '../../../core/services/autocomplete-source.service';
import {
  AutocompleteInputComponent,
  MIN_KEYWORD_LENGTH,
  SEARCH_DEBOUNCE_MS,
} from './autocomplete-input';

const MATCHES: readonly AutocompleteOption[] = [
  { code: '394', description: 'Applications Programmer' },
  { code: 'C57', description: 'Computer Programmer' },
  { code: '51D', description: 'Web Programmer' },
];

@Component({
  imports: [AutocompleteInputComponent],
  template: `
    <app-autocomplete-input
      [(value)]="value"
      [source]="source()"
      controlId="occupation"
      describedBy="occupation-messages"
      [showInvalid]="false"
      [showValid]="false"
      (touch)="touched = true"
    />
  `,
})
class TestHostComponent {
  readonly value = signal<AutocompleteOption | null>(null);

  search: (keyword: string) => Observable<AutocompleteOption[]> = () => of([...MATCHES]);
  describe: (code: string) => Observable<string> = () => of('');

  readonly source = signal<AutocompleteSource>({
    search: keyword => this.search(keyword),
    describe: code => this.describe(code),
  });

  touched = false;
}

describe('AutocompleteInputComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function input(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[role="combobox"]');
  }

  function listbox(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[role="listbox"]');
  }

  function optionElements(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('[role="option"]'));
  }

  function statusText(): string {
    return fixture.nativeElement.querySelector('[role="status"]')?.textContent?.trim() ?? '';
  }

  function type(value: string): void {
    const element = input();
    element.value = value;
    element.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function search(keyword = 'prog'): void {
    type(keyword);
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    fixture.detectChanges();
  }

  function press(key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, cancelable: true });
    input().dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  it('renders a combobox described by the section messages and its own status', () => {
    const element = input();

    expect(element.getAttribute('role')).toBe('combobox');
    expect(element.getAttribute('aria-autocomplete')).toBe('list');
    expect(element.getAttribute('autocomplete')).toBe('off');
    expect(element.getAttribute('aria-describedby')).toBe(
      'occupation-messages occupation-status',
    );
  });

  it('derives every element id from the control id, so repeated sections cannot collide', () => {
    search();

    expect(input().id).toBe('occupation');
    expect(listbox()?.id).toBe('occupation-listbox');
    expect(optionElements()[0].id).toBe('occupation-option-0');
    expect(input().getAttribute('aria-controls')).toBe('occupation-listbox');
  });

  it('does not search below the minimum keyword length, and says why', () => {
    search('pro');

    expect(listbox()).toBeNull();
    expect(statusText()).toBe(`Type at least ${MIN_KEYWORD_LENGTH} characters to search.`);
  });

  it('searches once typing settles and announces how many matches there are', () => {
    search();

    expect(optionElements()).toHaveLength(3);
    expect(statusText()).toContain('3 results available');
  });

  it('shows at most five matches', () => {
    host.search = () =>
      of(Array.from({ length: 8 }, (_, i) => ({ code: `${i}`, description: `Option ${i}` })));

    search('test');

    expect(optionElements()).toHaveLength(5);
  });

  it('says so when nothing matched', () => {
    host.search = () => of([]);

    search('zzzz');

    expect(statusText()).toBe('No matches found.');
  });

  it('records the whole option when one is chosen with the mouse', () => {
    search();
    optionElements()[0].dispatchEvent(new MouseEvent('mousedown', { cancelable: true }));
    fixture.detectChanges();

    expect(host.value()).toEqual({ code: '394', description: 'Applications Programmer' });
    expect(input().value).toBe('Applications Programmer');
    expect(listbox()).toBeNull();
  });

  it('keeps focus in the box when a match is clicked', () => {
    search();

    const event = new MouseEvent('mousedown', { cancelable: true });
    optionElements()[0].dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('moves through matches with the arrow keys and chooses with Enter', () => {
    search();

    press('ArrowDown');
    expect(input().getAttribute('aria-activedescendant')).toBe('occupation-option-0');

    press('ArrowDown');
    expect(input().getAttribute('aria-activedescendant')).toBe('occupation-option-1');

    press('ArrowUp');
    expect(input().getAttribute('aria-activedescendant')).toBe('occupation-option-0');

    press('Enter');
    expect(host.value()).toEqual({ code: '394', description: 'Applications Programmer' });
  });

  it('jumps to the first and last match with Home and End', () => {
    search();
    press('ArrowDown');

    press('End');
    expect(input().getAttribute('aria-activedescendant')).toBe('occupation-option-2');

    press('Home');
    expect(input().getAttribute('aria-activedescendant')).toBe('occupation-option-0');
  });

  it('closes the list on Escape without choosing anything', () => {
    search();
    press('ArrowDown');
    press('Escape');

    expect(listbox()).toBeNull();
    expect(host.value()).toBeNull();
  });

  it('does not choose a match on Enter when none is highlighted', () => {
    search();

    const event = press('Enter');

    expect(host.value()).toBeNull();
    expect(event.defaultPrevented).toBe(false);
  });

  /**
   * The heart of it: an unresolved answer must stay unresolved. Choosing the first
   * match for the customer could record an occupation they never saw.
   */
  it('never chooses a match on blur', () => {
    search();

    input().dispatchEvent(new Event('blur'));
    // Generously past any delay a deferred auto-select might have used.
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();

    expect(host.value()).toBeNull();
    expect(listbox()).toBeNull();
  });

  it('reports blur so the field can be marked touched', () => {
    input().dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(host.touched).toBe(true);
  });

  it('unresolves the answer when the text is edited, keeping what was typed', () => {
    search();
    optionElements()[0].dispatchEvent(new MouseEvent('mousedown', { cancelable: true }));
    fixture.detectChanges();

    type('Applications Programme');

    expect(host.value()).toBeNull();
    expect(input().value).toBe('Applications Programme');
  });

  it('shows a recalled option once the backend says what its code means', () => {
    host.describe = () => of('Retired');
    host.value.set({ code: 'R09', description: '' });
    fixture.detectChanges();

    expect(host.value()).toEqual({ code: 'R09', description: 'Retired' });
    expect(input().value).toBe('Retired');
  });

  it('reports a failed search rather than pretending there were no matches', () => {
    host.search = () => throwError(() => new Error('Network error'));

    search('fail');

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Search unavailable');
  });

  it('clears the failure as soon as the customer types again', () => {
    host.search = () => throwError(() => new Error('Network error'));
    search('fail');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();

    type('test');

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });
});
