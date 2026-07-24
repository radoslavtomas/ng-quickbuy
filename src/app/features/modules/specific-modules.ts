import { Component, computed, inject, signal } from '@angular/core';
import { BrandService } from '../../core/services/brand.service';
import { adultOnlyValidator, licenseYearsByAgeValidator, validDateValidator } from '../../core/validators/form-validators';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form';
import { FormFieldConfig } from '../../core/models/form-field.model';

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
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>Van Insurance</h1>
      <p>Start a van cover quote and compare options in minutes.</p>
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class GvModuleComponent extends BaseModuleComponent {}

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
