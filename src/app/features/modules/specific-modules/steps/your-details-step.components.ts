import { Component, ViewChild, computed, effect, input, output, signal } from '@angular/core';
import { AddressLookupMatch } from '../../../../core/services/address-lookup.service';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form';
import { StepCardComponent } from '../../../../shared/components/step-card/step-card';
import {
  AddressSearchCriteria,
  applyFieldAliases,
  asString,
  hasAddressState,
} from '../config/shared/common';
import { getMotorYourDetailsFields } from '../config/motor';
import { getPropertyYourDetailsFields } from '../config/property';
import { AddressSearchComponent } from '../components/address-search.component';

@Component({
  selector: 'app-motor-your-details-step',
  imports: [AddressSearchComponent, DynamicFormComponent, StepCardComponent],
  template: `
    <div class="space-y-4">
      <app-step-card title="Privacy notice">
        <p class="text-sm text-gray-600">
          We use your personal data in accordance with our privacy policy.
          Please read our full privacy notice before proceeding.
        </p>
        <div class="flex items-start gap-2">
          <input type="checkbox" id="motor-privacy-accepted" class="mt-0.5 h-4 w-4 rounded border-gray-300" />
          <label for="motor-privacy-accepted" class="text-sm text-gray-700">
            I have read and understood the privacy notice.
          </label>
        </div>
      </app-step-card>

      <app-step-card title="Correspondence address">
        <app-address-search
          [initialPostcode]="addressCriteria().postcode"
          [initialNumberOrName]="addressCriteria().numberOrName"
          [initialAddress]="resolvedAddress()"
          (criteriaChanged)="onCriteriaChanged($event)"
          (addressCleared)="onAddressCleared()"
          (resolved)="onAddressResolved($event)"
        />
        @if (addressRequiredError()) {
          <p class="text-[0.82rem] text-red-700" role="alert">
            Please resolve your address using lookup or complete manual address entry before continuing.
          </p>
        }
      </app-step-card>

      @if (hasResolvedAddress()) {
        <app-step-card title="Your details">
          <app-dynamic-form
            [fields]="fields()"
            [initialValue]="formInitialValue()"
            [showSubmitButton]="false"
            (submitted)="onSubmitted($event)"
          />
        </app-step-card>
      }

      <app-step-card title="Your occupation">
        <div class="space-y-1">
          <label for="motor-occupation" class="block text-sm font-medium text-gray-700">Occupation</label>
          <input
            type="text"
            id="motor-occupation"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="e.g. Software Engineer"
          />
        </div>
        <div class="space-y-1">
          <label for="motor-employer" class="block text-sm font-medium text-gray-700">Employer name</label>
          <input
            type="text"
            id="motor-employer"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="e.g. Acme Ltd"
          />
        </div>
      </app-step-card>
    </div>
  `,
})
export class MotorYourDetailsStepComponent {
  readonly moduleCode = input.required<string>();
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();

  readonly fields = computed(() => getMotorYourDetailsFields(this.moduleCode()));

  readonly addressCriteria = signal<AddressSearchCriteria>({ postcode: '', numberOrName: '' });
  readonly resolvedAddress = signal<AddressLookupMatch | null>(null);
  readonly addressRequiredError = signal(false);

  readonly hasResolvedAddress = computed(() => this.resolvedAddress() !== null || hasAddressState(this.initialValue()));

  readonly formInitialValue = computed(() => ({
    ...applyFieldAliases(this.initialValue(), this.fields()),
    ...this.resolvedAddress(),
    ...this.addressCriteria(),
  }));

  @ViewChild(DynamicFormComponent) private dynamicForm?: DynamicFormComponent;
  @ViewChild(AddressSearchComponent) private addressSearch?: AddressSearchComponent;

  constructor() {
    effect(() => {
      const value = applyFieldAliases(this.initialValue(), this.fields());
      this.addressCriteria.set({
        postcode: asString(value['postcode']),
        numberOrName: asString(value['houseNameNumber']) || asString(value['addressLine1']),
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
    this.addressRequiredError.set(false);
    this.resolvedAddress.set(match);
  }

  onAddressCleared(): void {
    this.addressRequiredError.set(false);
    this.resolvedAddress.set(null);
  }

  onSubmitted(value: Record<string, unknown>): void {
    const resolved = this.resolvedAddress();
    if (!resolved || !hasAddressState(resolved)) {
      this.addressRequiredError.set(true);
      return;
    }

    this.addressRequiredError.set(false);

    this.saved.emit({
      ...value,
      ...this.addressCriteria(),
      ...resolved,
    });
  }

  submitFromNavigation(): void {
    const detailsAreValid = this.dynamicForm?.validateFromParent() ?? true;
    const addressIsResolved = this.hasResolvedAddress();

    if (!addressIsResolved) {
      this.addressRequiredError.set(true);
      this.addressSearch?.validateCurrentInput();
    }

    if (!detailsAreValid || !addressIsResolved) {
      return;
    }

    this.dynamicForm?.submitFromParent();
  }
}

@Component({
  selector: 'app-property-your-details-step',
  imports: [AddressSearchComponent, DynamicFormComponent, StepCardComponent],
  template: `
    <div class="space-y-4">
      <app-step-card title="Privacy notice">
        <p class="text-sm text-gray-600">
          We use your personal data in accordance with our privacy policy.
          Please read our full privacy notice before proceeding.
        </p>
        <div class="flex items-start gap-2">
          <input type="checkbox" id="property-privacy-accepted" class="mt-0.5 h-4 w-4 rounded border-gray-300" />
          <label for="property-privacy-accepted" class="text-sm text-gray-700">
            I have read and understood the privacy notice.
          </label>
        </div>
      </app-step-card>

      <app-step-card title="Correspondence address">
        <app-address-search
          [initialPostcode]="addressCriteria().postcode"
          [initialNumberOrName]="addressCriteria().numberOrName"
          [initialAddress]="resolvedAddress()"
          (criteriaChanged)="onCriteriaChanged($event)"
          (addressCleared)="onAddressCleared()"
          (resolved)="onAddressResolved($event)"
        />
        @if (addressRequiredError()) {
          <p class="text-[0.82rem] text-red-700" role="alert">
            Please resolve your address using lookup, or complete manual address entry before continuing.
          </p>
        }
      </app-step-card>

      @if (hasResolvedAddress()) {
        <app-step-card title="Your details">
          <app-dynamic-form
            [fields]="fields()"
            [initialValue]="formInitialValue()"
            [showSubmitButton]="false"
            (submitted)="onSubmitted($event)"
          />
        </app-step-card>
      }

      <app-step-card title="Your occupation">
        <div class="space-y-1">
          <label for="property-occupation" class="block text-sm font-medium text-gray-700">Occupation</label>
          <input
            type="text"
            id="property-occupation"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="e.g. Software Engineer"
          />
        </div>
        <div class="space-y-1">
          <label for="property-employer" class="block text-sm font-medium text-gray-700">Employer name</label>
          <input
            type="text"
            id="property-employer"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="e.g. Acme Ltd"
          />
        </div>
      </app-step-card>
    </div>
  `,
})
export class PropertyYourDetailsStepComponent {
  readonly moduleCode = input.required<string>();
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();

  readonly fields = computed(() => getPropertyYourDetailsFields(this.moduleCode()));

  readonly addressCriteria = signal<AddressSearchCriteria>({ postcode: '', numberOrName: '' });
  readonly resolvedAddress = signal<AddressLookupMatch | null>(null);
  readonly addressRequiredError = signal(false);

  readonly hasResolvedAddress = computed(() => this.resolvedAddress() !== null || hasAddressState(this.initialValue()));

  readonly formInitialValue = computed(() => ({
    ...applyFieldAliases(this.initialValue(), this.fields()),
    ...this.resolvedAddress(),
    ...this.addressCriteria(),
  }));

  @ViewChild(DynamicFormComponent) private dynamicForm?: DynamicFormComponent;
  @ViewChild(AddressSearchComponent) private addressSearch?: AddressSearchComponent;

  constructor() {
    effect(() => {
      const value = applyFieldAliases(this.initialValue(), this.fields());
      this.addressCriteria.set({
        postcode: asString(value['postcode']),
        numberOrName: asString(value['houseNameNumber']) || asString(value['addressLine1']),
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
    this.addressRequiredError.set(false);
    this.resolvedAddress.set(match);
  }

  onAddressCleared(): void {
    this.addressRequiredError.set(false);
    this.resolvedAddress.set(null);
  }

  onSubmitted(value: Record<string, unknown>): void {
    const resolved = this.resolvedAddress();
    if (!resolved || !hasAddressState(resolved)) {
      this.addressRequiredError.set(true);
      return;
    }

    this.addressRequiredError.set(false);

    this.saved.emit({
      ...value,
      ...this.addressCriteria(),
      ...resolved,
    });
  }

  submitFromNavigation(): void {
    const detailsAreValid = this.dynamicForm?.validateFromParent() ?? true;
    const addressIsResolved = this.hasResolvedAddress();

    if (!addressIsResolved) {
      this.addressRequiredError.set(true);
      this.addressSearch?.validateCurrentInput();
    }

    if (!detailsAreValid || !addressIsResolved) {
      return;
    }

    this.dynamicForm?.submitFromParent();
  }
}
