import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import type { AutocompleteOption } from '../../../core/models/autocomplete-option.model';
import type { FormFieldConfig } from '../../../core/models/form-field.model';
import {
  AutocompleteSourceService,
  type AutocompleteSource,
} from '../../../core/services/autocomplete-source.service';
import {
  DynamicOptionsSourceService,
  type DynamicOptionsSource,
} from '../../../core/services/dynamic-options-source.service';
import { createOccupationFields } from '../../../features/modules/specific-modules/config/shared/occupation.fields';
import { SEARCH_DEBOUNCE_MS } from './autocomplete-input/autocomplete-input';
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
      providers: [{ provide: AutocompleteSourceService, useClass: StubAutocompleteSourceService }],
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
    expect(shown.map((box) => box.value)).toEqual(['Applications Programmer', 'Computing']);

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

const DYNAMIC_SELECT_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'dynamic-select',
    label: 'Make',
    name: 'make',
    validators: [{ type: 'required' }],
    metadata: { dynamicSelectConfig: { endpoint: 'iris-make', context: {} } },
  },
  {
    type: 'dynamic-select',
    label: 'Model',
    name: 'model',
    validators: [{ type: 'required' }],
    visibleWhen: [{ field: 'make', operator: 'truthy' }],
    metadata: { dynamicSelectConfig: { endpoint: 'iris-model', dependsOn: ['make'], context: {} } },
  },
];

/** Fakes a make -> model cascade: models are named after whichever make loaded them. */
class StubDynamicOptionsSourceService {
  readonly modelRequests: Readonly<Record<string, unknown>>[] = [];
  forEndpointError = false;

  forEndpoint(endpoint: string): DynamicOptionsSource {
    if (endpoint === 'iris-model') {
      return {
        loadOptions: (request) => {
          this.modelRequests.push(request.dependsOn);
          if (this.forEndpointError) {
            return throwError(() => new Error('boom'));
          }

          const make = request.dependsOn['make'];
          if (!make) {
            return of([]);
          }

          return of([
            { label: `${make} A`, value: 'A' },
            { label: `${make} B`, value: 'B' },
          ]);
        },
      };
    }

    return {
      loadOptions: () =>
        of([
          { label: 'FORD', value: 'FORD' },
          { label: 'AUDI', value: 'AUDI' },
        ]),
    };
  }
}

@Component({
  imports: [SignalFormComponent],
  template: ` <app-signal-form [fields]="fields()" [initialValue]="initialValue()" /> `,
})
class DynamicSelectHostComponent {
  readonly fields = signal<readonly FormFieldConfig[]>(DYNAMIC_SELECT_FIELDS);
  readonly initialValue = signal<Record<string, unknown>>({});
  readonly form = viewChild.required(SignalFormComponent);
}

describe('SignalFormComponent with a dynamic-select field', () => {
  let fixture: ComponentFixture<DynamicSelectHostComponent>;
  let sourceService: StubDynamicOptionsSourceService;

  beforeEach(async () => {
    sourceService = new StubDynamicOptionsSourceService();

    await TestBed.configureTestingModule({
      imports: [DynamicSelectHostComponent],
      providers: [{ provide: DynamicOptionsSourceService, useValue: sourceService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicSelectHostComponent);
    fixture.detectChanges();
  });

  function select(name: string): HTMLSelectElement | null {
    return fixture.nativeElement.querySelector(`[data-field="${name}"]`);
  }

  function chooseOption(name: string, value: string): void {
    const control = select(name) as HTMLSelectElement;
    control.value = value;
    // Signal Forms reads native controls on `input`; a browser fires it for selects.
    control.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('hides the dependent field until its dependency is answered', () => {
    expect(select('model')).toBeNull();

    chooseOption('make', 'FORD');

    expect(select('model')).not.toBeNull();
  });

  it("loads the dependent field's options from its own dependency", () => {
    chooseOption('make', 'FORD');

    const options = Array.from(select('model')?.querySelectorAll('option') ?? []).map((option) =>
      option.textContent?.trim(),
    );
    expect(options).toContain('FORD A');
    expect(options).toContain('FORD B');
  });

  it('clears the dependent answer when the dependency changes after it was answered', () => {
    chooseOption('make', 'FORD');
    chooseOption('model', 'A');
    expect(fixture.componentInstance.form().collect().values['model']).toBe('A');

    chooseOption('make', 'AUDI');

    expect(select('model')?.value).toBe('');
    expect(fixture.componentInstance.form().collect().values['model']).toBe('');
  });

  it('restores a persisted answer without clearing it on first load', async () => {
    const recalled = TestBed.createComponent(DynamicSelectHostComponent);
    recalled.componentInstance.initialValue.set({ make: 'FORD', model: 'A' });
    recalled.detectChanges();
    // A brand-new effect's first run is scheduled rather than flushed inline, so
    // this component needs one microtask before its dynamic-select options land.
    await recalled.whenStable();
    recalled.detectChanges();

    const modelSelect = recalled.nativeElement.querySelector(
      '[data-field="model"]',
    ) as HTMLSelectElement;
    expect(modelSelect.value).toBe('A');
    expect(recalled.componentInstance.form().collect().values['model']).toBe('A');
  });

  it('shows an error and empty options when the source fails', () => {
    sourceService.forEndpointError = true;
    chooseOption('make', 'FORD');

    const modelSelect = select('model');
    const modelHost = modelSelect?.closest('.relative');
    expect(modelHost?.textContent).toContain('Unable to load options');
  });
});
