import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import type { AutocompleteOption } from '../../../core/models/autocomplete-option.model';
import type { FormFieldConfig } from '../../../core/models/form-field.model';
import {
  AutocompleteSourceService,
  type AutocompleteSource,
} from '../../../core/services/autocomplete-source.service';
import { createOccupationFields } from '../../../features/modules/specific-modules/config/shared/occupation.fields';
import { SEARCH_DEBOUNCE_MS } from '../autocomplete-input/autocomplete-input';
import { SignalFormComponent } from './signal-form';

const OCCUPATIONS: readonly AutocompleteOption[] = [
  { code: '394', description: 'Applications Programmer' },
];

const INDUSTRIES: readonly AutocompleteOption[] = [{ code: '021', description: 'Computing' }];

class StubAutocompleteSourceService {
  forEndpoint(endpoint: 'occupation' | 'industry'): AutocompleteSource {
    const matches = endpoint === 'industry' ? INDUSTRIES : OCCUPATIONS;
    return {
      search: () => of([...matches]),
      describe: () => of(''),
    };
  }
}

@Component({
  imports: [SignalFormComponent],
  template: `
    <app-signal-form
      [fields]="fields()"
      [initialValue]="initialValue()"
      (valueChanged)="latest = $event"
    />
  `,
})
class TestHostComponent {
  readonly fields = signal<readonly FormFieldConfig[]>(createOccupationFields());
  readonly initialValue = signal<Record<string, unknown>>({});
  readonly form = viewChild.required(SignalFormComponent);

  latest: Record<string, unknown> = {};
}

describe('SignalFormComponent with a search field', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        { provide: AutocompleteSourceService, useClass: StubAutocompleteSourceService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function control(name: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(`[data-field="${name}"]`);
  }

  function comboboxes(): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('input[role="combobox"]'));
  }

  function chooseStatus(value: string): void {
    const select = control('employmentStatus') as HTMLSelectElement;
    select.value = value;
    // Signal Forms reads native controls on `input`; a browser fires it for selects.
    select.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function searchAndChoose(combobox: HTMLInputElement): void {
    combobox.value = 'prog';
    combobox.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    fixture.detectChanges();

    const option = combobox
      .closest('app-autocomplete-input')
      ?.querySelector('[role="option"]') as HTMLElement;
    option.dispatchEvent(new MouseEvent('mousedown', { cancelable: true }));
    fixture.detectChanges();
  }

  it('gives every control an id of its own, distinct from the field name', () => {
    // Field names are only unique within a section, so ids must be scoped.
    expect(control('employmentStatus')?.id).not.toBe('employmentStatus');
    expect(control('employmentStatus')?.id).toMatch(/-employmentStatus$/);
  });

  it('reveals the searches once the status calls for them', () => {
    expect(comboboxes()).toHaveLength(0);

    chooseStatus('E');

    expect(comboboxes()).toHaveLength(2);
  });

  it('records a chosen option in the model and derives the insurer code from it', () => {
    chooseStatus('E');
    const [occupation, industry] = comboboxes();

    searchAndChoose(occupation);
    searchAndChoose(industry);

    const result = host.form().collect();

    expect(result.valid).toBe(true);
    expect(result.values['occupation']).toEqual({
      code: '394',
      description: 'Applications Programmer',
    });
    expect(result.values['occupationCode']).toBe('394');
    expect(result.values['industryCode']).toBe('021');
  });

  it('treats typed text that matched nothing as no answer at all', () => {
    chooseStatus('E');
    const [occupation] = comboboxes();

    occupation.value = 'something the backend never heard of';
    occupation.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    fixture.detectChanges();

    const result = host.form().collect();

    expect(result.valid).toBe(false);
    expect(result.values['occupationCode']).toBe('');
  });

  it('does not block the step on a question the status never raised', () => {
    chooseStatus('R');

    const result = host.form().collect();

    // No occupation search and no student list were shown, so neither can object.
    expect(result.valid).toBe(true);
    expect(result.values['occupationCode']).toBe('R09');
  });

  it('shows a recalled answer without asking the customer again', () => {
    // Seeded before the first render, as the section outlet does on return visits.
    const recalled = TestBed.createComponent(TestHostComponent);
    recalled.componentInstance.initialValue.set({
      employmentStatus: 'E',
      occupation: { code: '394', description: 'Applications Programmer' },
      industry: { code: '021', description: 'Computing' },
    });
    recalled.detectChanges();

    const shown = Array.from(
      recalled.nativeElement.querySelectorAll('input[role="combobox"]'),
    ) as HTMLInputElement[];
    expect(shown.map(box => box.value)).toEqual(['Applications Programmer', 'Computing']);

    const values = recalled.componentInstance.form().collect().values;
    expect(values['occupationCode']).toBe('394');
    expect(values['industryCode']).toBe('021');
  });

  it('reports derived values as the answers change, not only on collect', () => {
    chooseStatus('R');
    expect(host.latest['occupationCode']).toBe('R09');

    chooseStatus('U');
    expect(host.latest['occupationCode']).toBe('U03');
  });
});
