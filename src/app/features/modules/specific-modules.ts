import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import {
  AddressLookupMatch,
  AddressLookupMockService,
} from '../../core/services/address-lookup-mock.service';
import { BrandService } from '../../core/services/brand.service';
import { FormFieldConfig } from '../../core/models/form-field.model';
import { FormWorkflowService } from '../../core/services/form-workflow.service';
import {
  adultOnlyValidator,
  licenseYearsByAgeValidator,
  validDateValidator,
} from '../../core/validators/form-validators';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form';

const MOTOR_STEP_ORDER = [
  'your-details',
  'your-vehicle',
  'additional-drivers',
  'your-policy',
  'your-quotes',
] as const;

const PROPERTY_STEP_ORDER = [
  'your-details',
  'your-property',
  'joint-proposer',
  'your-policy',
  'assumptions',
  'your-quotes',
] as const;

const MOTOR_YOUR_VEHICLE_FIELDS: readonly FormFieldConfig[] = [
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
    label: 'Vehicle use',
    name: 'vehicleUse',
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
    label: 'Where is the vehicle kept overnight?',
    name: 'overnightLocation',
    validators: [{ type: 'required' }],
    options: [
      { label: 'Driveway', value: 'driveway' },
      { label: 'Garage', value: 'garage' },
      { label: 'Roadside', value: 'roadside' },
    ],
    metadata: { radioLayout: 'row' },
  },
];

const MOTOR_ADDITIONAL_DRIVERS_FIELDS: readonly FormFieldConfig[] = [
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
];

const MOTOR_YOUR_POLICY_FIELDS: readonly FormFieldConfig[] = [
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
    type: 'checkbox',
    label: 'I confirm the details are correct',
    name: 'declarationAccepted',
    validators: [{ type: 'required', message: 'You must confirm details before requesting quotes.' }],
  },
];

const PROPERTY_YOUR_PROPERTY_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'select',
    label: 'Property type',
    name: 'propertyType',
    validators: [{ type: 'required' }],
    options: [
      { label: 'Detached', value: 'detached' },
      { label: 'Semi-detached', value: 'semi_detached' },
      { label: 'Terraced', value: 'terraced' },
      { label: 'Flat', value: 'flat' },
      { label: 'Bungalow', value: 'bungalow' },
    ],
  },
  {
    type: 'number',
    label: 'Number of bedrooms',
    name: 'bedrooms',
    validators: [{ type: 'required' }, { type: 'min', value: 1 }, { type: 'max', value: 12 }],
    metadata: { placeholder: '3' },
  },
  {
    type: 'select',
    label: 'Occupancy',
    name: 'occupancy',
    validators: [{ type: 'required' }],
    options: [
      { label: 'Owner occupied', value: 'owner_occupied' },
      { label: 'Tenanted', value: 'tenanted' },
      { label: 'Holiday home', value: 'holiday_home' },
      { label: 'Unoccupied', value: 'unoccupied' },
    ],
  },
  {
    type: 'number',
    label: 'Year built (approx.)',
    name: 'yearBuilt',
    validators: [{ type: 'required' }, { type: 'min', value: 1800 }, { type: 'max', value: 2026 }],
    metadata: { placeholder: '1998' },
  },
];

const PROPERTY_JOINT_PROPOSER_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'radio',
    label: 'Do you have a joint proposer?',
    name: 'hasJointProposer',
    validators: [{ type: 'required' }],
    options: [
      { label: 'No', value: 'no' },
      { label: 'Yes', value: 'yes' },
    ],
    metadata: { radioLayout: 'row' },
  },
  {
    type: 'text',
    label: 'Joint proposer full name',
    name: 'jointProposerName',
    validators: [{ type: 'maxLength', value: 80 }],
    visibleWhen: [{ field: 'hasJointProposer', operator: 'equals', value: 'yes' }],
    enabledWhen: [{ field: 'hasJointProposer', operator: 'equals', value: 'yes' }],
    normalization: ['trim'],
    metadata: { placeholder: 'Jordan Taylor' },
  },
  {
    type: 'date',
    label: 'Joint proposer date of birth',
    name: 'jointProposerDob',
    validators: [
      {
        type: 'custom',
        name: 'validDate',
        message: 'Enter a valid date in DD/MM/YYYY format.',
        validatorFn: validDateValidator,
      },
      {
        type: 'custom',
        name: 'adultOnly',
        message: 'Joint proposer must be at least 18 years old.',
        validatorFn: adultOnlyValidator,
      },
    ],
    normalization: ['trim', 'date'],
    visibleWhen: [{ field: 'hasJointProposer', operator: 'equals', value: 'yes' }],
    enabledWhen: [{ field: 'hasJointProposer', operator: 'equals', value: 'yes' }],
  },
];

const PROPERTY_YOUR_POLICY_FIELDS: readonly FormFieldConfig[] = [
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
    type: 'number',
    label: 'Buildings sum insured',
    name: 'buildingsSumInsured',
    validators: [{ type: 'required' }, { type: 'min', value: 50000 }, { type: 'max', value: 2000000 }],
    normalization: ['currency'],
    metadata: { prefix: 'GBP', placeholder: '250000' },
  },
  {
    type: 'number',
    label: 'Contents sum insured',
    name: 'contentsSumInsured',
    validators: [{ type: 'required' }, { type: 'min', value: 10000 }, { type: 'max', value: 500000 }],
    normalization: ['currency'],
    metadata: { prefix: 'GBP', placeholder: '60000' },
  },
  {
    type: 'number',
    label: 'Voluntary excess',
    name: 'voluntaryExcess',
    validators: [{ type: 'required' }, { type: 'min', value: 0 }, { type: 'max', value: 1000 }],
    normalization: ['currency'],
    metadata: { prefix: 'GBP', placeholder: '250' },
  },
];

const PROPERTY_ASSUMPTIONS_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'checkbox',
    label: 'I confirm all information provided is accurate',
    name: 'declarationAccepted',
    validators: [{ type: 'required', message: 'You must confirm details before requesting quotes.' }],
  },
  {
    type: 'checkbox',
    label: 'I confirm there are no known claims not disclosed above',
    name: 'claimsDisclosureAccepted',
    validators: [{ type: 'required', message: 'Please confirm claims disclosure.' }],
  },
];

const FIRST_STEP_ADDRESS_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'text',
    label: 'House Name/Number',
    name: 'houseNameNumber',
    validators: [{ type: 'required' }],
    normalization: ['trim'],
    metadata: { placeholder: '1' },
  },
  {
    type: 'text',
    label: 'Address Line 2',
    name: 'addressLine2',
    normalization: ['trim'],
    metadata: { placeholder: 'District or locality (optional)' },
  },
  {
    type: 'text',
    label: 'Address Line 3',
    name: 'addressLine3',
    normalization: ['trim'],
    metadata: { placeholder: 'Town (optional)' },
  },
  {
    type: 'text',
    label: 'Address Line 4',
    name: 'addressLine4',
    normalization: ['trim'],
    metadata: { placeholder: 'County (optional)' },
  },
];

const MOTOR_FIRST_STEP_PERSONAL_FIELDS: readonly FormFieldConfig[] = [
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
];

const PROPERTY_FIRST_STEP_PERSONAL_FIELDS: readonly FormFieldConfig[] = [
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
    label: 'Main number',
    name: 'mainPhone',
    validators: [{ type: 'required' }, { type: 'minLength', value: 10 }, { type: 'maxLength', value: 15 }],
    normalization: ['trim', 'phone'],
    metadata: { autocomplete: 'tel', placeholder: '07123456789', maskPattern: '[0-9+ ]*' },
  },
];

const MOTOR_STEP_DEFAULT_VALUES: Readonly<Record<string, Record<string, unknown>>> = {
  'your-details': {
    postcode: '',
    addressLine1: '',
    houseNameNumber: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    mobilePhone: '',
  },
  'your-vehicle': {
    registration: '',
    vehicleUse: '',
    annualMileage: 0,
    overnightLocation: '',
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
    licenseYearsHeld: 8,
    declarationAccepted: true,
  },
};

const PROPERTY_STEP_DEFAULT_VALUES: Readonly<Record<string, Record<string, unknown>>> = {
  'your-details': {
    postcode: 'M16 0PQ',
    addressLine1: 'Talbot Road',
    houseNameNumber: '17',
    addressLine2: '',
    addressLine3: 'Old Trafford',
    addressLine4: 'MANCHESTER',
    firstName: 'Alex',
    lastName: 'Taylor',
    dateOfBirth: '14/02/1987',
    email: 'alex.taylor@example.com',
    mainPhone: '07123456789',
  },
  'your-property': {
    propertyType: 'semi_detached',
    bedrooms: 3,
    occupancy: 'owner_occupied',
    yearBuilt: 1995,
  },
  'joint-proposer': {
    hasJointProposer: 'no',
  },
  'your-policy': {
    policyStartDate: '01/09/2026',
    buildingsSumInsured: 250000,
    contentsSumInsured: 60000,
    voluntaryExcess: 250,
  },
  assumptions: {
    declarationAccepted: true,
    claimsDisclosureAccepted: true,
  },
};

interface DemoQuote {
  insurer: string;
  plan: string;
  monthlyPremium: number;
  annualPremium: number;
  excess: number;
}

interface AddressSearchCriteria {
  postcode: string;
  addressLine1: string;
}

const DEMO_QUOTES: readonly DemoQuote[] = [
  {
    insurer: 'AXA Demo',
    plan: 'Comprehensive Plus',
    monthlyPremium: 68.42,
    annualPremium: 786.34,
    excess: 250,
  },
  {
    insurer: 'Aviva Demo',
    plan: 'Comprehensive',
    monthlyPremium: 72.18,
    annualPremium: 829.12,
    excess: 200,
  },
  {
    insurer: 'Allianz Demo',
    plan: 'TPFT',
    monthlyPremium: 59.75,
    annualPremium: 687.1,
    excess: 300,
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

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function hasAddressState(value: Record<string, unknown>): boolean {
  return Boolean(asString(value['addressLine1']) || asString(value['houseNameNumber']) || asString(value['postcode']));
}

@Component({
  selector: 'app-address-search',
  imports: [ReactiveFormsModule],
  template: `
    <form class="grid grid-cols-1 gap-4" [formGroup]="form" (ngSubmit)="onSearch()" novalidate>
      <div>
        <label for="postcode" class="block text-[0.95rem] font-bold text-slate-900">Postcode:</label>
        <input
          id="postcode"
          type="text"
          formControlName="postcode"
          autocomplete="postal-code"
          placeholder="eg. M16 0PQ"
          [attr.aria-invalid]="showError('postcode')"
          class="mt-2 h-11 w-full rounded-md border px-2.5 text-[0.95rem]"
          [class.border-red-500]="showError('postcode')"
          [class.bg-red-50]="showError('postcode')"
          [class.border-slate-400]="!showError('postcode')"
        />
        @if (showError('postcode')) {
          <p class="mt-1 text-[0.82rem] text-red-700">Postcode is required.</p>
        }
      </div>

      <div>
        <label for="address-line-1" class="block text-[0.95rem] font-bold text-slate-900">Address Line 1:</label>
        <input
          id="address-line-1"
          type="text"
          formControlName="addressLine1"
          autocomplete="address-line1"
          placeholder="eg. Talbot Road"
          [attr.aria-invalid]="showError('addressLine1')"
          class="mt-2 h-11 w-full rounded-md border px-2.5 text-[0.95rem]"
          [class.border-red-500]="showError('addressLine1')"
          [class.bg-red-50]="showError('addressLine1')"
          [class.border-slate-400]="!showError('addressLine1')"
        />
        @if (showError('addressLine1')) {
          <p class="mt-1 text-[0.82rem] text-red-700">Address line 1 is required.</p>
        }
      </div>

      <p class="mt-0 text-slate-700">
        Please be advised that we are unable to provide a quotation for postcodes located in Northern Ireland and the Channel Islands.
      </p>

      <div class="flex justify-end">
        <button
          type="submit"
          class="inline-flex min-w-32 items-center justify-center gap-2 rounded-md bg-sky-500 px-4 py-2.5 font-bold text-white transition hover:bg-sky-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          {{ loading() ? 'Searching...' : 'Search' }}
          <i class="fa-solid fa-magnifying-glass text-sm" aria-hidden="true"></i>
        </button>
      </div>

      @if (lookupError(); as error) {
        <p class="mt-1 text-[0.82rem] text-red-700" role="alert">{{ error }}</p>
      }
    </form>
  `,
})
export class AddressSearchComponent {
  readonly initialPostcode = input('');
  readonly initialAddressLine1 = input('');

  readonly criteriaChanged = output<AddressSearchCriteria>();
  readonly resolved = output<AddressLookupMatch>();

  readonly form = new FormGroup({
    postcode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    addressLine1: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly lookupError = signal<string | null>(null);

  private readonly destroyRef = inject(DestroyRef);
  private readonly lookupService = inject(AddressLookupMockService);

  constructor() {
    effect(() => {
      this.form.patchValue(
        {
          postcode: this.initialPostcode(),
          addressLine1: this.initialAddressLine1(),
        },
        { emitEvent: false },
      );
    });

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.criteriaChanged.emit({
        postcode: value.postcode ?? '',
        addressLine1: value.addressLine1 ?? '',
      });
    });
  }

  showError(controlName: 'postcode' | 'addressLine1'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched || this.submitted());
  }

  async onSearch(): Promise<void> {
    this.submitted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.lookupError.set(null);

    const criteria = this.form.getRawValue();
    try {
      const response = await firstValueFrom(this.lookupService.lookupByPostcode({
        postcode: criteria.postcode,
        numberOrNameForSearch: criteria.addressLine1,
      }));

      const mapped = this.lookupService.mapToFormValue(response);
      mapped.addressLine1 = criteria.addressLine1.trim();
      this.criteriaChanged.emit({ postcode: mapped.postcode, addressLine1: mapped.addressLine1 });
      this.resolved.emit(mapped);
    } catch (error) {
      this.lookupError.set(error instanceof Error ? error.message : 'Unable to search this address.');
    } finally {
      this.loading.set(false);
    }
  }
}

@Component({
  selector: 'app-motor-your-details-step',
  imports: [AddressSearchComponent, DynamicFormComponent],
  template: `
    <p class="module-code">Step: your-details</p>

    <app-address-search
      [initialPostcode]="addressCriteria().postcode"
      [initialAddressLine1]="addressCriteria().addressLine1"
      (criteriaChanged)="onCriteriaChanged($event)"
      (resolved)="onAddressResolved($event)"
    />

    @if (hasResolvedAddress()) {
      <div class="mt-5 border-t border-slate-200 pt-5">
        <app-dynamic-form
          [fields]="fields"
          [initialValue]="formInitialValue()"
          submitLabel="Save and continue"
          (submitted)="onSubmitted($event)"
        />
      </div>
    }
  `,
})
export class MotorYourDetailsStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();

  readonly fields = [...FIRST_STEP_ADDRESS_FIELDS, ...MOTOR_FIRST_STEP_PERSONAL_FIELDS];

  readonly addressCriteria = signal<AddressSearchCriteria>({ postcode: '', addressLine1: '' });
  readonly resolvedAddress = signal<AddressLookupMatch | null>(null);

  readonly hasResolvedAddress = computed(() => this.resolvedAddress() !== null || hasAddressState(this.initialValue()));

  readonly formInitialValue = computed(() => ({
    ...this.initialValue(),
    ...this.resolvedAddress(),
    ...this.addressCriteria(),
  }));

  constructor() {
    effect(() => {
      const value = this.initialValue();
      this.addressCriteria.set({
        postcode: asString(value['postcode']),
        addressLine1: asString(value['addressLine1']),
      });

      if (hasAddressState(value)) {
        this.resolvedAddress.set({
          postcode: asString(value['postcode']),
          addressLine1: asString(value['addressLine1']),
          houseNameNumber: asString(value['houseNameNumber']),
          addressLine2: asString(value['addressLine2']),
          addressLine3: asString(value['addressLine3']),
          addressLine4: asString(value['addressLine4']),
        });
      }
    });
  }

  onCriteriaChanged(criteria: AddressSearchCriteria): void {
    this.addressCriteria.set(criteria);
  }

  onAddressResolved(match: AddressLookupMatch): void {
    this.resolvedAddress.set(match);
  }

  onSubmitted(value: Record<string, unknown>): void {
    this.saved.emit({
      ...value,
      ...this.addressCriteria(),
      ...this.resolvedAddress(),
    });
  }
}

@Component({
  selector: 'app-property-your-details-step',
  imports: [AddressSearchComponent, DynamicFormComponent],
  template: `
    <p class="module-code">Step: your-details</p>

    <app-address-search
      [initialPostcode]="addressCriteria().postcode"
      [initialAddressLine1]="addressCriteria().addressLine1"
      (criteriaChanged)="onCriteriaChanged($event)"
      (resolved)="onAddressResolved($event)"
    />

    @if (hasResolvedAddress()) {
      <div class="mt-5 border-t border-slate-200 pt-5">
        <app-dynamic-form
          [fields]="fields"
          [initialValue]="formInitialValue()"
          submitLabel="Save and continue"
          (submitted)="onSubmitted($event)"
        />
      </div>
    }
  `,
})
export class PropertyYourDetailsStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();

  readonly fields = [...FIRST_STEP_ADDRESS_FIELDS, ...PROPERTY_FIRST_STEP_PERSONAL_FIELDS];

  readonly addressCriteria = signal<AddressSearchCriteria>({ postcode: '', addressLine1: '' });
  readonly resolvedAddress = signal<AddressLookupMatch | null>(null);

  readonly hasResolvedAddress = computed(() => this.resolvedAddress() !== null || hasAddressState(this.initialValue()));

  readonly formInitialValue = computed(() => ({
    ...this.initialValue(),
    ...this.resolvedAddress(),
    ...this.addressCriteria(),
  }));

  constructor() {
    effect(() => {
      const value = this.initialValue();
      this.addressCriteria.set({
        postcode: asString(value['postcode']),
        addressLine1: asString(value['addressLine1']),
      });

      if (hasAddressState(value)) {
        this.resolvedAddress.set({
          postcode: asString(value['postcode']),
          addressLine1: asString(value['addressLine1']),
          houseNameNumber: asString(value['houseNameNumber']),
          addressLine2: asString(value['addressLine2']),
          addressLine3: asString(value['addressLine3']),
          addressLine4: asString(value['addressLine4']),
        });
      }
    });
  }

  onCriteriaChanged(criteria: AddressSearchCriteria): void {
    this.addressCriteria.set(criteria);
  }

  onAddressResolved(match: AddressLookupMatch): void {
    this.resolvedAddress.set(match);
  }

  onSubmitted(value: Record<string, unknown>): void {
    this.saved.emit({
      ...value,
      ...this.addressCriteria(),
      ...this.resolvedAddress(),
    });
  }
}

@Component({
  selector: 'app-motor-your-vehicle-step',
  imports: [DynamicFormComponent],
  template: `
    <p class="module-code">Step: your-vehicle</p>
    <app-dynamic-form
      [fields]="fields"
      [initialValue]="initialValue()"
      submitLabel="Save and continue"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class MotorYourVehicleStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = MOTOR_YOUR_VEHICLE_FIELDS;
}

@Component({
  selector: 'app-motor-additional-drivers-step',
  imports: [DynamicFormComponent],
  template: `
    <p class="module-code">Step: additional-drivers</p>
    <app-dynamic-form
      [fields]="fields"
      [initialValue]="initialValue()"
      submitLabel="Save and continue"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class MotorAdditionalDriversStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = MOTOR_ADDITIONAL_DRIVERS_FIELDS;
}

@Component({
  selector: 'app-motor-your-policy-step',
  imports: [DynamicFormComponent],
  template: `
    <p class="module-code">Step: your-policy</p>
    <app-dynamic-form
      [fields]="fields"
      [initialValue]="initialValue()"
      submitLabel="Request quotes"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class MotorYourPolicyStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = MOTOR_YOUR_POLICY_FIELDS;
}

@Component({
  selector: 'app-property-your-property-step',
  imports: [DynamicFormComponent],
  template: `
    <p class="module-code">Step: your-property</p>
    <app-dynamic-form
      [fields]="fields"
      [initialValue]="initialValue()"
      submitLabel="Save and continue"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class PropertyYourPropertyStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = PROPERTY_YOUR_PROPERTY_FIELDS;
}

@Component({
  selector: 'app-property-joint-proposer-step',
  imports: [DynamicFormComponent],
  template: `
    <p class="module-code">Step: joint-proposer</p>
    <app-dynamic-form
      [fields]="fields"
      [initialValue]="initialValue()"
      submitLabel="Save and continue"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class PropertyJointProposerStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = PROPERTY_JOINT_PROPOSER_FIELDS;
}

@Component({
  selector: 'app-property-your-policy-step',
  imports: [DynamicFormComponent],
  template: `
    <p class="module-code">Step: your-policy</p>
    <app-dynamic-form
      [fields]="fields"
      [initialValue]="initialValue()"
      submitLabel="Save and continue"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class PropertyYourPolicyStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = PROPERTY_YOUR_POLICY_FIELDS;
}

@Component({
  selector: 'app-property-assumptions-step',
  imports: [DynamicFormComponent],
  template: `
    <p class="module-code">Step: assumptions</p>
    <app-dynamic-form
      [fields]="fields"
      [initialValue]="initialValue()"
      submitLabel="Request quotes"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class PropertyAssumptionsStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = PROPERTY_ASSUMPTIONS_FIELDS;
}

@Component({
  selector: 'app-motor-your-quotes-step',
  template: `
    <p class="module-code">Demo quotes generated from your submitted journey data.</p>

    <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      @for (quote of quotes(); track quote.insurer + quote.plan) {
        <article class="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h2 class="text-base font-semibold text-slate-900">{{ quote.insurer }}</h2>
          <p class="text-sm text-slate-600">{{ quote.plan }}</p>
          <p class="mt-2 text-2xl font-bold text-slate-900">
            GBP {{ quote.monthlyPremium.toFixed(2) }}
            <span class="text-sm font-medium text-slate-500">/month</span>
          </p>
          <p class="text-sm text-slate-700">Annual: GBP {{ quote.annualPremium.toFixed(2) }}</p>
          <p class="text-sm text-slate-700">Excess: GBP {{ quote.excess }}</p>
        </article>
      }
    </div>

    <details class="mt-4 rounded-lg border border-slate-200 bg-white p-3">
      <summary class="cursor-pointer text-sm font-semibold text-slate-900">
        View submitted journey payload
      </summary>
      <pre class="mt-3 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">{{ payloadPretty() }}</pre>
    </details>
  `,
})
export class MotorYourQuotesStepComponent {
  readonly payloadPretty = input.required<string>();
  readonly quotes = input.required<readonly DemoQuote[]>();
}

@Component({
  selector: 'app-property-your-quotes-step',
  template: `
    <p class="module-code">Demo quotes generated from your submitted journey data.</p>

    <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      @for (quote of quotes(); track quote.insurer + quote.plan) {
        <article class="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h2 class="text-base font-semibold text-slate-900">{{ quote.insurer }}</h2>
          <p class="text-sm text-slate-600">{{ quote.plan }}</p>
          <p class="mt-2 text-2xl font-bold text-slate-900">
            GBP {{ quote.monthlyPremium.toFixed(2) }}
            <span class="text-sm font-medium text-slate-500">/month</span>
          </p>
          <p class="text-sm text-slate-700">Annual: GBP {{ quote.annualPremium.toFixed(2) }}</p>
          <p class="text-sm text-slate-700">Excess: GBP {{ quote.excess }}</p>
        </article>
      }
    </div>

    <details class="mt-4 rounded-lg border border-slate-200 bg-white p-3">
      <summary class="cursor-pointer text-sm font-semibold text-slate-900">
        View submitted journey payload
      </summary>
      <pre class="mt-3 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">{{ payloadPretty() }}</pre>
    </details>
  `,
})
export class PropertyYourQuotesStepComponent {
  readonly payloadPretty = input.required<string>();
  readonly quotes = input.required<readonly DemoQuote[]>();
}

@Component({
  selector: 'app-motor-quote-journey',
  imports: [
    MotorYourDetailsStepComponent,
    MotorYourVehicleStepComponent,
    MotorAdditionalDriversStepComponent,
    MotorYourPolicyStepComponent,
    MotorYourQuotesStepComponent,
  ],
  template: `
    @switch (currentStepName()) {
      @case ('your-details') {
        <app-motor-your-details-step [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('your-vehicle') {
        <app-motor-your-vehicle-step [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('additional-drivers') {
        <app-motor-additional-drivers-step [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('your-policy') {
        <app-motor-your-policy-step [initialValue]="currentStepInitialValue()" (saved)="onPolicySubmitted($event)" />
      }
      @case ('your-quotes') {
        <app-motor-your-quotes-step [payloadPretty]="payloadPretty()" [quotes]="quotes()" />
      }
      @default {
        <p>This step does not have a demo form yet.</p>
      }
    }
  `,
})
export class MotorQuoteJourneyComponent {
  readonly moduleCode = input.required<string>();

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly workflowService = inject(FormWorkflowService);

  readonly currentStepName = toSignal(
    this.route.paramMap.pipe(map(params => params.get('stepName')?.toLowerCase() ?? MOTOR_STEP_ORDER[0])),
    { initialValue: this.route.snapshot.paramMap.get('stepName')?.toLowerCase() ?? MOTOR_STEP_ORDER[0] },
  );

  readonly payload = computed(() => {
    const moduleCode = this.moduleCode();
    return {
      moduleCode,
      requestedAt: new Date().toISOString(),
      inputs: MOTOR_STEP_ORDER.filter((step) => step !== 'your-quotes').reduce<Record<string, unknown>>(
        (acc, step) => ({ ...acc, ...this.workflowService.getStepValue(this.stepKey(step)) }),
        {},
      ),
    };
  });

  readonly payloadPretty = computed(() => JSON.stringify(this.payload(), null, 2));
  readonly quotes = computed(() => DEMO_QUOTES);

  currentStepInitialValue(): Record<string, unknown> {
    const stepName = this.currentStepName();
    const saved = this.workflowService.getStepValue(this.stepKey(stepName));
    if (Object.keys(saved).length) {
      return saved;
    }

    return MOTOR_STEP_DEFAULT_VALUES[stepName] ?? {};
  }

  saveAndNext(value: Record<string, unknown>): void {
    const stepName = this.currentStepName();
    this.workflowService.setStepValue(this.stepKey(stepName), value);
    this.navigateToNext(stepName);
  }

  onPolicySubmitted(value: Record<string, unknown>): void {
    this.workflowService.setStepValue(this.stepKey('your-policy'), value);
    this.workflowService.setStepValue(this.stepKey('your-quotes'), {
      payload: this.payload(),
      quotes: DEMO_QUOTES,
    });

    void this.router.navigate(['/', this.moduleCode(), 'your-quotes']);
  }

  private stepKey(stepName: string): string {
    return `${this.moduleCode()}:${stepName}`;
  }

  private navigateToNext(stepName: string): void {
    const index = MOTOR_STEP_ORDER.indexOf(stepName as (typeof MOTOR_STEP_ORDER)[number]);
    const nextStep = index >= 0 ? MOTOR_STEP_ORDER[index + 1] : null;
    if (!nextStep) {
      return;
    }

    void this.router.navigate(['/', this.moduleCode(), nextStep]);
  }
}

@Component({
  selector: 'app-property-quote-journey',
  imports: [
    PropertyYourDetailsStepComponent,
    PropertyYourPropertyStepComponent,
    PropertyJointProposerStepComponent,
    PropertyYourPolicyStepComponent,
    PropertyAssumptionsStepComponent,
    PropertyYourQuotesStepComponent,
  ],
  template: `
    @switch (currentStepName()) {
      @case ('your-details') {
        <app-property-your-details-step [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('your-property') {
        <app-property-your-property-step [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('joint-proposer') {
        <app-property-joint-proposer-step [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('your-policy') {
        <app-property-your-policy-step [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('assumptions') {
        <app-property-assumptions-step [initialValue]="currentStepInitialValue()" (saved)="onAssumptionsSubmitted($event)" />
      }
      @case ('your-quotes') {
        <app-property-your-quotes-step [payloadPretty]="payloadPretty()" [quotes]="quotes()" />
      }
      @default {
        <p>This step does not have a demo form yet.</p>
      }
    }
  `,
})
export class PropertyQuoteJourneyComponent {
  readonly moduleCode = input.required<string>();

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly workflowService = inject(FormWorkflowService);

  readonly currentStepName = toSignal(
    this.route.paramMap.pipe(map(params => params.get('stepName')?.toLowerCase() ?? PROPERTY_STEP_ORDER[0])),
    { initialValue: this.route.snapshot.paramMap.get('stepName')?.toLowerCase() ?? PROPERTY_STEP_ORDER[0] },
  );

  readonly payload = computed(() => {
    const moduleCode = this.moduleCode();
    return {
      moduleCode,
      requestedAt: new Date().toISOString(),
      inputs: PROPERTY_STEP_ORDER.filter((step) => step !== 'your-quotes').reduce<Record<string, unknown>>(
        (acc, step) => ({ ...acc, ...this.workflowService.getStepValue(this.stepKey(step)) }),
        {},
      ),
    };
  });

  readonly payloadPretty = computed(() => JSON.stringify(this.payload(), null, 2));
  readonly quotes = computed(() => DEMO_QUOTES);

  currentStepInitialValue(): Record<string, unknown> {
    const stepName = this.currentStepName();
    const saved = this.workflowService.getStepValue(this.stepKey(stepName));
    if (Object.keys(saved).length) {
      return saved;
    }

    return PROPERTY_STEP_DEFAULT_VALUES[stepName] ?? {};
  }

  saveAndNext(value: Record<string, unknown>): void {
    const stepName = this.currentStepName();
    this.workflowService.setStepValue(this.stepKey(stepName), value);
    this.navigateToNext(stepName);
  }

  onAssumptionsSubmitted(value: Record<string, unknown>): void {
    this.workflowService.setStepValue(this.stepKey('assumptions'), value);
    this.workflowService.setStepValue(this.stepKey('your-quotes'), {
      payload: this.payload(),
      quotes: DEMO_QUOTES,
    });

    void this.router.navigate(['/', this.moduleCode(), 'your-quotes']);
  }

  private stepKey(stepName: string): string {
    return `${this.moduleCode()}:${stepName}`;
  }

  private navigateToNext(stepName: string): void {
    const index = PROPERTY_STEP_ORDER.indexOf(stepName as (typeof PROPERTY_STEP_ORDER)[number]);
    const nextStep = index >= 0 ? PROPERTY_STEP_ORDER[index + 1] : null;
    if (!nextStep) {
      return;
    }

    void this.router.navigate(['/', this.moduleCode(), nextStep]);
  }
}

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
  imports: [MotorQuoteJourneyComponent],
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>{{ module()?.description ?? 'Car Insurance' }}</h1>
      <p>Build your quote with {{ brand.fullName }} one step at a time.</p>
      <p class="module-code">Code: {{ module()?.code ?? 'PC' }}</p>
      <app-motor-quote-journey [moduleCode]="module()?.code ?? 'PC'" />
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class PcModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-gv-module',
  imports: [MotorQuoteJourneyComponent],
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>{{ module()?.description ?? 'Van Insurance' }}</h1>
      <p>Build your quote with {{ brand.fullName }} one step at a time.</p>
      <p class="module-code">Code: {{ module()?.code ?? 'GV' }}</p>
      <app-motor-quote-journey [moduleCode]="module()?.code ?? 'GV'" />
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class GvModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-bd-module',
  imports: [MotorQuoteJourneyComponent],
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>{{ module()?.description ?? 'Breakdown Insurance' }}</h1>
      <p>Build your quote with {{ brand.fullName }} one step at a time.</p>
      <p class="module-code">Code: {{ module()?.code ?? 'BD' }}</p>
      <app-motor-quote-journey [moduleCode]="module()?.code ?? 'BD'" />
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class BdModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-tx-module',
  imports: [MotorQuoteJourneyComponent],
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>{{ module()?.description ?? 'Taxi Insurance' }}</h1>
      <p>Build your quote with {{ brand.fullName }} one step at a time.</p>
      <p class="module-code">Code: {{ module()?.code ?? 'TX' }}</p>
      <app-motor-quote-journey [moduleCode]="module()?.code ?? 'TX'" />
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class TxModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-hc-module',
  imports: [PropertyQuoteJourneyComponent],
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>{{ module()?.description ?? 'House Insurance' }}</h1>
      <p>Build your quote with {{ brand.fullName }} one step at a time.</p>
      <p class="module-code">Code: {{ module()?.code ?? 'HC' }}</p>
      <app-property-quote-journey [moduleCode]="module()?.code ?? 'HC'" />
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class HcModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-hh-module',
  imports: [PropertyQuoteJourneyComponent],
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>{{ module()?.description ?? 'Holiday Home Insurance' }}</h1>
      <p>Build your quote with {{ brand.fullName }} one step at a time.</p>
      <p class="module-code">Code: {{ module()?.code ?? 'HH' }}</p>
      <app-property-quote-journey [moduleCode]="module()?.code ?? 'HH'" />
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class HhModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-ll-module',
  imports: [PropertyQuoteJourneyComponent],
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>{{ module()?.description ?? 'Landlord Insurance' }}</h1>
      <p>Build your quote with {{ brand.fullName }} one step at a time.</p>
      <p class="module-code">Code: {{ module()?.code ?? 'LL' }}</p>
      <app-property-quote-journey [moduleCode]="module()?.code ?? 'LL'" />
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class LlModuleComponent extends BaseModuleComponent {}
