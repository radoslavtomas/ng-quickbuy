import { Component, ViewChild, computed, effect, input, output, signal } from '@angular/core';
import { AddressLookupMatch } from '../../../../core/services/address-lookup.service';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form';
import {
  AddressSearchCriteria,
  MOTOR_FIRST_STEP_PERSONAL_FIELDS,
  PROPERTY_FIRST_STEP_PERSONAL_FIELDS,
  asString,
  hasAddressState,
} from '../config';
import { AddressSearchComponent } from '../components/address-search.component';

@Component({
  selector: 'app-motor-your-details-step',
  imports: [AddressSearchComponent, DynamicFormComponent],
  template: `
    <p class="module-code">Step: your-details</p>

    <app-address-search
      [initialPostcode]="addressCriteria().postcode"
      [initialNumberOrName]="addressCriteria().numberOrName"
      (criteriaChanged)="onCriteriaChanged($event)"
      (addressCleared)="onAddressCleared()"
      (resolved)="onAddressResolved($event)"
    />

    @if (hasResolvedAddress()) {
      <div class="mt-5 border-t border-slate-200 pt-5">
        <app-dynamic-form
          [fields]="fields"
          [initialValue]="formInitialValue()"
          [showSubmitButton]="false"
          (submitted)="onSubmitted($event)"
        />
      </div>
    }

    @if (addressRequiredError()) {
      <p class="mt-2 text-[0.82rem] text-red-700" role="alert">
        Please resolve your address using lookup or complete manual address entry before continuing.
      </p>
    }
  `,
})
export class MotorYourDetailsStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();

  readonly fields = MOTOR_FIRST_STEP_PERSONAL_FIELDS;

  readonly addressCriteria = signal<AddressSearchCriteria>({ postcode: '', numberOrName: '' });
  readonly resolvedAddress = signal<AddressLookupMatch | null>(null);
  readonly addressRequiredError = signal(false);

  readonly hasResolvedAddress = computed(() => this.resolvedAddress() !== null || hasAddressState(this.initialValue()));

  readonly formInitialValue = computed(() => ({
    ...this.initialValue(),
    ...this.resolvedAddress(),
    ...this.addressCriteria(),
  }));

  @ViewChild(DynamicFormComponent) private dynamicForm?: DynamicFormComponent;

  constructor() {
    effect(() => {
      const value = this.initialValue();
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
    if (!this.hasResolvedAddress()) {
      this.addressRequiredError.set(true);
      return;
    }

    this.dynamicForm?.submitFromParent();
  }
}

@Component({
  selector: 'app-property-your-details-step',
  imports: [AddressSearchComponent, DynamicFormComponent],
  template: `
    <p class="module-code">Step: your-details</p>

    <app-address-search
      [initialPostcode]="addressCriteria().postcode"
      [initialNumberOrName]="addressCriteria().numberOrName"
      (criteriaChanged)="onCriteriaChanged($event)"
      (addressCleared)="onAddressCleared()"
      (resolved)="onAddressResolved($event)"
    />

    <div class="mt-5 border-t border-slate-200 pt-5">
      <app-dynamic-form
        [fields]="fields"
        [initialValue]="formInitialValue()"
        [showSubmitButton]="false"
        (submitted)="onSubmitted($event)"
      />
    </div>

    @if (addressRequiredError()) {
      <p class="mt-2 text-[0.82rem] text-red-700" role="alert">
        Please resolve your address using lookup, or complete manual address entry before continuing.
      </p>
    }
  `,
})
export class PropertyYourDetailsStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();

  readonly fields = PROPERTY_FIRST_STEP_PERSONAL_FIELDS;

  readonly addressCriteria = signal<AddressSearchCriteria>({ postcode: '', numberOrName: '' });
  readonly resolvedAddress = signal<AddressLookupMatch | null>(null);
  readonly addressRequiredError = signal(false);

  readonly hasResolvedAddress = computed(() => this.resolvedAddress() !== null || hasAddressState(this.initialValue()));

  readonly formInitialValue = computed(() => ({
    ...this.initialValue(),
    ...this.resolvedAddress(),
    ...this.addressCriteria(),
  }));

  @ViewChild(DynamicFormComponent) private dynamicForm?: DynamicFormComponent;

  constructor() {
    effect(() => {
      const value = this.initialValue();
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
    this.dynamicForm?.submitFromParent();
  }
}
