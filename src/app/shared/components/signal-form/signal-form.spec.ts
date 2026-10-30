import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import type { FormFieldConfig } from '../../../core/models/form-field.model';
import {
  DynamicOptionsSourceService,
  type DynamicOptionsSource,
} from '../../../core/services/dynamic-options-source.service';
import { validDateValidator } from '../../../core/validators/form-validators';
import { SignalFormComponent } from './signal-form';

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

const DATE_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'date',
    label: 'Date of birth',
    name: 'dateOfBirth',
    validators: [
      { type: 'required' },
      {
        type: 'custom',
        name: 'validDate',
        message: 'Enter a valid date in DD/MM/YYYY format.',
        validatorFn: validDateValidator,
      },
    ],
  },
];

@Component({
  imports: [SignalFormComponent],
  template: `<app-signal-form [fields]="fields()" [initialValue]="initialValue()"></app-signal-form>`,
})
class DateFieldHostComponent {
  readonly fields = signal<readonly FormFieldConfig[]>(DATE_FIELDS);
  readonly initialValue = signal<Record<string, unknown>>({});
  readonly form = viewChild.required(SignalFormComponent);
}

describe('SignalFormComponent with a date field', () => {
  let fixture: ComponentFixture<DateFieldHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateFieldHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DateFieldHostComponent);
    fixture.detectChanges();
  });

  function boxes(): HTMLInputElement[] {
    const wrapper = fixture.nativeElement.querySelector('[data-field="dateOfBirth"]');
    return Array.from(wrapper?.querySelectorAll('input') ?? []);
  }

  function type(element: HTMLInputElement, value: string): void {
    element.value = value;
    element.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('renders the split date control under the field data-field wrapper', () => {
    expect(fixture.nativeElement.querySelector('app-date-input')).not.toBeNull();
    expect(boxes()).toHaveLength(3);
  });

  it('drives collect() from the three boxes and validates the composed date', () => {
    const [day, month, year] = boxes();
    type(day, '01');
    type(month, '09');
    type(year, '1990');

    const result = fixture.componentInstance.form().collect();

    expect(result.valid).toBe(true);
    expect(result.values['dateOfBirth']).toBe('01/09/1990');
  });
  it('collects an ISO-hydrated date in the canonical DD/MM/YYYY format without a blur', async () => {
    const recalled = TestBed.createComponent(DateFieldHostComponent);
    recalled.componentInstance.initialValue.set({ dateOfBirth: '2026-09-05' });
    recalled.detectChanges();
    await recalled.whenStable();

    const shown = Array.from(
      recalled.nativeElement.querySelectorAll('app-date-input input'),
    ) as HTMLInputElement[];
    expect(shown.map((box) => box.value)).toEqual(['05', '09', '2026']);
    expect(recalled.componentInstance.form().collect()).toEqual({
      valid: true,
      values: { dateOfBirth: '05/09/2026' },
    });
  });

  it('canonicalizes a calendar-invalid ISO answer without making it valid', async () => {
    const recalled = TestBed.createComponent(DateFieldHostComponent);
    recalled.componentInstance.initialValue.set({ dateOfBirth: '2026-02-31' });
    recalled.detectChanges();
    await recalled.whenStable();

    expect(recalled.componentInstance.form().collect()).toEqual({
      valid: false,
      values: { dateOfBirth: '31/02/2026' },
    });
  });

  it('blocks an unanswered date with the same required message any other field would get', () => {
    const result = fixture.componentInstance.form().collect();
    fixture.detectChanges();

    expect(result.valid).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Date of birth is required.');
  });

  it('surfaces the bridged custom validator message for a calendar-invalid date', () => {
    const [day, month, year] = boxes();
    type(day, '31');
    type(month, '02');
    type(year, '2026');

    const result = fixture.componentInstance.form().collect();
    fixture.detectChanges();

    expect(result.valid).toBe(false);
    expect(fixture.nativeElement.textContent).toContain(
      'Enter a valid date in DD/MM/YYYY format.',
    );
  });
});
