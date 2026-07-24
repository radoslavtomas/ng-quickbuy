import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { BrandService } from '../../core/services/brand.service';
import { adultOnlyValidator, licenseYearsByAgeValidator, validDateValidator } from '../../core/validators/form-validators';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form';
import { FormFieldConfig } from '../../core/models/form-field.model';
import { FormWorkflowService } from '../../core/services/form-workflow.service';

const PC_FORM_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'select',
    label: 'Title',
    name: 'title',
    validators: [{ type: 'required', message: 'Please select a title.' }],
    options: [
      { label: 'Mr', value: 'mr' },
      { label: 'Mrs', value: 'mrs' },
      { label: 'Ms', value: 'ms' },
      { label: 'Miss', value: 'miss' },
      { label: 'Dr', value: 'dr' },
      { label: 'Mx', value: 'mx' },
    ],
  },
  {
    type: 'text',
    label: 'First name',
    name: 'firstName',
    helpText: 'Use your legal first name.',
    validators: [
      { type: 'required' },
      { type: 'maxLength', value: 60 },
      { type: 'pattern', value: /^[A-Za-z .'-]+$/, message: 'First name contains unsupported characters.' },
    ],
    normalization: ['trim'],
    metadata: {
      autocomplete: 'given-name',
      placeholder: 'Jane',
      maxLengthCounter: true,
    },
  },
  {
    type: 'text',
    label: 'Surname',
    name: 'lastName',
    validators: [
      { type: 'required' },
      { type: 'maxLength', value: 60 },
    ],
    normalization: ['trim'],
    metadata: {
      autocomplete: 'family-name',
      placeholder: 'Doe',
      maxLengthCounter: true,
    },
  },
  {
    type: 'email',
    label: 'Email',
    name: 'email',
    validators: [
      { type: 'required' },
      { type: 'email' },
    ],
    normalization: ['trim', 'lowercase'],
    metadata: {
      autocomplete: 'email',
      placeholder: 'name@example.com',
    },
  },
  {
    type: 'tel',
    label: 'Main number (mobile if possible)',
    name: 'mainPhone',
    icon: 'fa-solid fa-mobile-screen-button',
    validators: [
      { type: 'required' },
      { type: 'minLength', value: 10 },
      { type: 'maxLength', value: 15 },
    ],
    normalization: ['trim', 'phone'],
    metadata: {
      autocomplete: 'tel',
      placeholder: '07123456789',
      maskPattern: '[0-9+ ]*',
    },
  },
  {
    type: 'tel',
    label: 'Alternative number (optional)',
    name: 'altPhone',
    icon: 'fa-solid fa-phone',
    validators: [{ type: 'maxLength', value: 15 }],
    normalization: ['trim', 'phone'],
    metadata: {
      autocomplete: 'tel-national',
      placeholder: 'Optional',
      maskPattern: '[0-9+ ]*',
    },
  },
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
      {
        type: 'custom',
        name: 'adultOnly',
        message: 'You must be at least 18 years old to continue.',
        validatorFn: adultOnlyValidator,
      },
    ],
    normalization: ['trim', 'date'],
    metadata: {
      autocomplete: 'bday',
    },
  },
  {
    type: 'radio',
    label: 'Gender',
    name: 'gender',
    validators: [{ type: 'required' }],
    metadata: {
      radioLayout: 'row',
    },
    options: [
      { label: 'Male', value: 'male' },
      { label: 'Female', value: 'female' },
      { label: 'Unspecified', value: 'unspecified' },
    ],
  },
  {
    type: 'select',
    label: 'Marital status',
    name: 'maritalStatus',
    validators: [{ type: 'required' }],
    options: [
      { label: 'Divorced', value: 'divorced' },
      { label: 'Married', value: 'married' },
      { label: 'Single', value: 'single' },
      { label: 'Widowed', value: 'widowed' },
      { label: 'Civil Partnered', value: 'civil_partnered' },
    ],
  },
  {
    type: 'text',
    label: 'Partner full name',
    name: 'partnerName',
    helpText: 'Required when marital status is married or civil partnered.',
    visibleWhen: [{ field: 'maritalStatus', operator: 'in', value: ['married', 'civil_partnered'] }],
    enabledWhen: [{ field: 'maritalStatus', operator: 'in', value: ['married', 'civil_partnered'] }],
    validators: [
      { type: 'maxLength', value: 80 },
      { type: 'pattern', value: /^[A-Za-z .'-]+$/, message: 'Partner name contains unsupported characters.' },
    ],
    normalization: ['trim'],
    metadata: {
      placeholder: 'Partner name',
      maxLengthCounter: true,
    },
  },
  {
    type: 'select',
    label: 'Driving licence type',
    name: 'drivingLicenseType',
    validators: [{ type: 'required' }],
    options: [
      { label: 'Full UK', value: 'full_uk' },
      { label: 'Provisional', value: 'provisional' },
      { label: 'EU', value: 'eu' },
      { label: 'International', value: 'international' },
    ],
  },
  {
    type: 'number',
    label: 'Licence years held',
    name: 'licenseYearsHeld',
    validators: [
      { type: 'required' },
      { type: 'min', value: 0 },
      { type: 'max', value: 80 },
      {
        type: 'custom',
        name: 'licenseYearsByAge',
        message: 'Licence years held cannot exceed the years since you turned 18.',
        validatorFn: licenseYearsByAgeValidator,
      },
    ],
    normalization: ['currency'],
    metadata: {
      placeholder: '0',
      suffix: 'years',
    },
  },
  {
    type: 'radio',
    label: 'Do you own your own home?',
    name: 'ownsHome',
    validators: [{ type: 'required' }],
    metadata: {
      radioLayout: 'row',
    },
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    type: 'checkbox',
    label: 'I confirm the details above are accurate',
    name: 'declarationAccepted',
    validators: [{ type: 'required', message: 'You must confirm your details before continuing.' }],
  },
  {
    type: 'toggle',
    label: 'Contact me with renewal reminders',
    name: 'renewalReminders',
    helpText: 'Optional reminder by email before policy renewal.',
  },
  {
    type: 'textarea',
    label: 'Additional details',
    name: 'additionalDetails',
    helpText: 'Optional notes related to your quote.',
    normalization: ['trim'],
    metadata: {
      placeholder: 'Tell us anything that may affect your quote',
    },
    reviewFormatter: (value) => (typeof value === 'string' && value.trim().length ? value : 'No additional details provided.'),
  },
];

const GV_STEP_FORM_FIELDS: Readonly<Record<string, readonly FormFieldConfig[]>> = {
  'your-details': [
    {
      type: 'text',
      label: 'First name',
      name: 'firstName',
      validators: [{ type: 'required' }],
      normalization: ['trim'],
      metadata: { autocomplete: 'given-name', placeholder: 'Alex' },
    },
    {
      type: 'text',
      label: 'Surname',
      name: 'lastName',
      validators: [{ type: 'required' }],
      normalization: ['trim'],
      metadata: { autocomplete: 'family-name', placeholder: 'Taylor' },
    },
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
        {
          type: 'custom',
          name: 'adultOnly',
          message: 'You must be at least 18 years old to continue.',
          validatorFn: adultOnlyValidator,
        },
      ],
      normalization: ['trim', 'date'],
      metadata: { autocomplete: 'bday' },
    },
    {
      type: 'email',
      label: 'Email',
      name: 'email',
      validators: [{ type: 'required' }, { type: 'email' }],
      normalization: ['trim', 'lowercase'],
      metadata: { autocomplete: 'email', placeholder: 'alex.taylor@example.com' },
    },
    {
      type: 'tel',
      label: 'Mobile number',
      name: 'mobilePhone',
      validators: [{ type: 'required' }, { type: 'minLength', value: 10 }, { type: 'maxLength', value: 15 }],
      normalization: ['trim', 'phone'],
      metadata: { autocomplete: 'tel', placeholder: '07123456789', maskPattern: '[0-9+ ]*' },
    },
  ],
  'your-vehicle': [
    {
      type: 'text',
      label: 'Vehicle registration',
      name: 'registration',
      validators: [{ type: 'required' }, { type: 'maxLength', value: 10 }],
      normalization: ['trim', 'uppercase'],
      metadata: { placeholder: 'AB12CDE' },
    },
    {
      type: 'select',
      label: 'Van use',
      name: 'vanUse',
      validators: [{ type: 'required' }],
      options: [
        { label: 'Social, domestic and pleasure', value: 'sdp' },
        { label: 'Business use', value: 'business' },
        { label: 'Carriage of own goods', value: 'own_goods' },
      ],
    },
    {
      type: 'number',
      label: 'Estimated annual mileage',
      name: 'annualMileage',
      validators: [{ type: 'required' }, { type: 'min', value: 1000 }, { type: 'max', value: 100000 }],
      normalization: ['currency'],
      metadata: { suffix: 'miles', placeholder: '12000' },
    },
    {
      type: 'radio',
      label: 'Where is the van kept overnight?',
      name: 'overnightLocation',
      validators: [{ type: 'required' }],
      options: [
        { label: 'Driveway', value: 'driveway' },
        { label: 'Garage', value: 'garage' },
        { label: 'Roadside', value: 'roadside' },
      ],
      metadata: { radioLayout: 'row' },
    },
  ],
  'additional-drivers': [
    {
      type: 'radio',
      label: 'Any additional drivers?',
      name: 'hasAdditionalDrivers',
      validators: [{ type: 'required' }],
      options: [
        { label: 'No', value: 'no' },
        { label: 'Yes', value: 'yes' },
      ],
      metadata: { radioLayout: 'row' },
    },
    {
      type: 'number',
      label: 'How many additional drivers?',
      name: 'additionalDriverCount',
      validators: [{ type: 'min', value: 0 }, { type: 'max', value: 4 }],
      visibleWhen: [{ field: 'hasAdditionalDrivers', operator: 'equals', value: 'yes' }],
      enabledWhen: [{ field: 'hasAdditionalDrivers', operator: 'equals', value: 'yes' }],
      metadata: { placeholder: '1' },
    },
    {
      type: 'select',
      label: 'Main driver no-claims bonus',
      name: 'noClaimsBonus',
      validators: [{ type: 'required' }],
      options: [
        { label: '0 years', value: '0' },
        { label: '1 year', value: '1' },
        { label: '2 years', value: '2' },
        { label: '3 years', value: '3' },
        { label: '4 years', value: '4' },
        { label: '5+ years', value: '5_plus' },
      ],
    },
  ],
  'your-policy': [
    {
      type: 'date',
      label: 'Policy start date',
      name: 'policyStartDate',
      validators: [
        { type: 'required' },
        {
          type: 'custom',
          name: 'validDate',
          message: 'Enter a valid date in DD/MM/YYYY format.',
          validatorFn: validDateValidator,
        },
      ],
      normalization: ['trim', 'date'],
    },
    {
      type: 'radio',
      label: 'Level of cover',
      name: 'coverType',
      validators: [{ type: 'required' }],
      options: [
        { label: 'Third party only', value: 'tpo' },
        { label: 'Third party, fire and theft', value: 'tpft' },
        { label: 'Comprehensive', value: 'comprehensive' },
      ],
      metadata: { radioLayout: 'column' },
    },
    {
      type: 'number',
      label: 'Voluntary excess',
      name: 'voluntaryExcess',
      validators: [{ type: 'required' }, { type: 'min', value: 0 }, { type: 'max', value: 1000 }],
      normalization: ['currency'],
      metadata: { prefix: 'GBP', placeholder: '250' },
    },
    {
      type: 'checkbox',
      label: 'I confirm the details are correct',
      name: 'declarationAccepted',
      validators: [{ type: 'required', message: 'You must confirm details before requesting quotes.' }],
    },
  ],
};

const GV_STEP_DEFAULT_VALUES: Readonly<Record<string, Record<string, unknown>>> = {
  'your-details': {
    firstName: 'Alex',
    lastName: 'Taylor',
    dateOfBirth: '14/02/1987',
    email: 'alex.taylor@example.com',
    mobilePhone: '07123456789',
  },
  'your-vehicle': {
    registration: 'AB12 CDE',
    vanUse: 'business',
    annualMileage: 12000,
    overnightLocation: 'driveway',
  },
  'additional-drivers': {
    hasAdditionalDrivers: 'yes',
    additionalDriverCount: 1,
    noClaimsBonus: '3',
  },
  'your-policy': {
    policyStartDate: '01/09/2026',
    coverType: 'comprehensive',
    voluntaryExcess: 250,
    declarationAccepted: true,
  },
};

interface DemoQuote {
  insurer: string;
  plan: string;
  monthlyPremium: number;
  annualPremium: number;
  excess: number;
}

const MODULE_CONTENT_STYLES = `
  .module-page {
    border-width: 4px 1px 1px 1px;
    border-style: solid;
    border-color: var(--brand-primary);
    border-radius: 0.75rem;
    background: white;
    padding: 1.25rem;
  }

  .module-page h1 {
    font-size: clamp(1.25rem, 3.5vw, 1.75rem);
    font-weight: 700;
    color: #0f172a;
  }

  .module-page p {
    margin-top: 0.5rem;
    color: #334155;
    line-height: 1.6;
  }

  .module-page .module-code {
    margin-top: 0.75rem;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--brand-secondary);
  }
`;

class BaseModuleComponent {
  protected readonly brandService = inject(BrandService);
  protected readonly brand = this.brandService.config;

  protected readonly module = computed(() => {
    const code = this.brandService.currentModuleCode();
    return code ? this.brandService.getModuleByCode(code) : null;
  });
}

@Component({
  selector: 'app-pc-module',
  imports: [DynamicFormComponent],
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>Car Insurance</h1>
      <p>Build a tailored private car quote with {{ brand.fullName }}.</p>
      <p class="module-code">Code: {{ module()?.code ?? 'PC' }}</p>

      <app-dynamic-form
        [fields]="formFields"
        submitLabel="Save and continue"
        (submitted)="onSubmitted($event)"
      />

      @if (lastSubmissionPreview(); as summary) {
        <p class="module-code">Saved fields: {{ summary }}</p>
      }
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class PcModuleComponent extends BaseModuleComponent {
  readonly formFields = PC_FORM_FIELDS;
  readonly lastSubmissionPreview = signal<string | null>(null);

  onSubmitted(value: Record<string, unknown>): void {
    this.lastSubmissionPreview.set(Object.keys(value).join(', '));
  }
}

@Component({
  selector: 'app-gv-module',
  imports: [DynamicFormComponent],
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>Van Insurance</h1>
      <p>Start a van cover quote and compare options in minutes.</p>

      @if (isQuotesStep()) {
        <p class="module-code">Demo quotes generated from your submitted journey data.</p>

        <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          @for (quote of fakeQuotes(); track quote.insurer + quote.plan) {
            <article class="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h2 class="text-base font-semibold text-slate-900">{{ quote.insurer }}</h2>
              <p class="text-sm text-slate-600">{{ quote.plan }}</p>
              <p class="mt-2 text-2xl font-bold text-slate-900">GBP {{ quote.monthlyPremium.toFixed(2) }}<span class="text-sm font-medium text-slate-500">/month</span></p>
              <p class="text-sm text-slate-700">Annual: GBP {{ quote.annualPremium.toFixed(2) }}</p>
              <p class="text-sm text-slate-700">Excess: GBP {{ quote.excess }}</p>
            </article>
          }
        </div>

        <details class="mt-4 rounded-lg border border-slate-200 bg-white p-3">
          <summary class="cursor-pointer text-sm font-semibold text-slate-900">View submitted journey payload</summary>
          <pre class="mt-3 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">{{ quoteRequestPayloadPretty() }}</pre>
        </details>
      } @else if (currentStepFormFields().length > 0) {
        <p class="module-code">Step: {{ currentStepName() }}</p>
        <app-dynamic-form
          [fields]="currentStepFormFields()"
          [initialValue]="currentStepInitialValue()"
          [submitLabel]="submitLabel()"
          (submitted)="onStepSubmitted($event)"
        />
      } @else {
        <p>This step does not have a demo form yet.</p>
      }
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class GvModuleComponent extends BaseModuleComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly workflowService = inject(FormWorkflowService);

  readonly currentStepName = toSignal(
    this.route.paramMap.pipe(map(params => params.get('stepName')?.toLowerCase() ?? 'your-details')),
    { initialValue: this.route.snapshot.paramMap.get('stepName')?.toLowerCase() ?? 'your-details' },
  );

  readonly currentStepFormFields = computed(
    () => GV_STEP_FORM_FIELDS[this.currentStepName()] ?? [],
  );

  readonly currentStepInitialValue = computed(() => {
    const stepName = this.currentStepName();
    const saved = this.workflowService.getStepValue(this.stepKey(stepName));
    if (Object.keys(saved).length) {
      return saved;
    }

    return GV_STEP_DEFAULT_VALUES[stepName] ?? {};
  });

  readonly quoteRequestPayload = signal<Record<string, unknown> | null>(null);
  readonly fakeQuotes = signal<readonly DemoQuote[]>([]);

  readonly isQuotesStep = computed(() => this.currentStepName() === 'your-quotes');

  readonly submitLabel = computed(() =>
    this.currentStepName() === 'your-policy' ? 'Request quotes' : 'Save and continue',
  );

  readonly quoteRequestPayloadPretty = computed(() => {
    const payload = this.quoteRequestPayload();
    return payload ? JSON.stringify(payload, null, 2) : '{}';
  });

  onStepSubmitted(value: Record<string, unknown>): void {
    const stepName = this.currentStepName();
    this.workflowService.setStepValue(this.stepKey(stepName), value);

    if (stepName === 'your-policy') {
      this.simulateQuoteRequest();
      return;
    }

    this.goToNextStep(stepName);
  }

  private stepKey(stepName: string): string {
    return `GV:${stepName}`;
  }

  private goToNextStep(currentStepName: string): void {
    const stepOrder = ['your-details', 'your-vehicle', 'additional-drivers', 'your-policy', 'your-quotes'];
    const currentIndex = stepOrder.indexOf(currentStepName);
    const nextStep = currentIndex >= 0 ? stepOrder[currentIndex + 1] : null;

    if (!nextStep) {
      return;
    }

    void this.router.navigate(['/GV', nextStep]);
  }

  private simulateQuoteRequest(): void {
    const payload = {
      moduleCode: 'GV',
      requestedAt: new Date().toISOString(),
      inputs: {
        ...this.workflowService.getStepValue(this.stepKey('your-details')),
        ...this.workflowService.getStepValue(this.stepKey('your-vehicle')),
        ...this.workflowService.getStepValue(this.stepKey('additional-drivers')),
        ...this.workflowService.getStepValue(this.stepKey('your-policy')),
      },
    };

    this.quoteRequestPayload.set(payload);
    console.log('[GV Demo] Quote request payload:', payload);

    this.fakeQuotes.set([
      { insurer: 'AXA Demo', plan: 'Comprehensive Plus', monthlyPremium: 68.42, annualPremium: 786.34, excess: 250 },
      { insurer: 'Aviva Demo', plan: 'Comprehensive', monthlyPremium: 72.18, annualPremium: 829.12, excess: 200 },
      { insurer: 'Allianz Demo', plan: 'TPFT', monthlyPremium: 59.75, annualPremium: 687.10, excess: 300 },
    ]);

    void this.router.navigate(['/GV', 'your-quotes']);
  }
}

@Component({
  selector: 'app-bd-module',
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>Breakdown Insurance</h1>
      <p>Set up roadside and recovery protection for your journeys.</p>
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class BdModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-tx-module',
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>Taxi Insurance</h1>
      <p>Get cover designed for private hire and public hire drivers.</p>
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class TxModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-hc-module',
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>House Insurance</h1>
      <p>Protect your home and belongings with flexible cover levels.</p>
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class HcModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-hh-module',
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>Holiday Home Insurance</h1>
      <p>Arrange specialist protection for your holiday property.</p>
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class HhModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-ll-module',
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>Landlord Insurance</h1>
      <p>Cover rental properties against key risks and liabilities.</p>
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class LlModuleComponent extends BaseModuleComponent {}
