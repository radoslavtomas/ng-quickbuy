import { Component, computed, inject, input, signal } from '@angular/core';
import type { AddressLookupMatch } from '../../../../core/services/address-lookup.service';
import { JourneyStateService } from '../../../../core/services/journey-state.service';
import {
  type AddressSearchCriteria,
  asString,
  hasAddressState,
} from '../../specific-modules/config/shared/common';
import { AddressSearchComponent } from '../../specific-modules/components/address-search.component';

/**
 * Section wrapper around the address lookup, adapting it to the section contract
 * the journey shell expects: values are written to journey state as they change,
 * and `collect()` reports whether the customer has resolved an address.
 */
@Component({
  selector: 'app-address-section',
  imports: [AddressSearchComponent],
  template: `
    <app-address-search
      [initialPostcode]="criteria().postcode"
      [initialNumberOrName]="criteria().numberOrName"
      [initialAddress]="resolvedAddress()"
      (criteriaChanged)="onCriteriaChanged($event)"
      (addressCleared)="onAddressCleared()"
      (resolved)="onResolved($event)"
    />

    @if (showRequiredError()) {
      <p class="mt-2 text-[0.82rem] text-red-700" role="alert">
        Please resolve your address using lookup, or complete manual address entry before
        continuing.
      </p>
    }
  `,
})
export class AddressSectionComponent {
  readonly moduleCode = input.required<string>();
  readonly stepName = input.required<string>();
  readonly sectionId = input.required<string>();

  private readonly journeyState = inject(JourneyStateService);
  private readonly requiredErrorVisible = signal(false);

  private readonly storedValues = computed(() =>
    this.journeyState.sectionAnswers(this.moduleCode(), this.stepName(), this.sectionId()),
  );

  readonly criteria = computed<AddressSearchCriteria>(() => {
    const values = this.storedValues();
    return {
      postcode: asString(values['postcode']),
      numberOrName: asString(values['houseNameNumber']) || asString(values['addressLine1']),
    };
  });

  readonly resolvedAddress = computed<AddressLookupMatch | null>(() => {
    const values = this.storedValues();
    if (!hasAddressState(values)) {
      return null;
    }

    return {
      postcode: asString(values['postcode']),
      addressLine1: asString(values['addressLine1']),
      houseNameNumber: asString(values['houseNameNumber']),
      addressLine2: asString(values['addressLine2']),
      addressLine3: asString(values['addressLine3']),
      addressLine4: asString(values['addressLine4']),
    };
  });

  readonly showRequiredError = computed(
    () => this.requiredErrorVisible() && !hasAddressState(this.storedValues()),
  );

  onCriteriaChanged(criteria: AddressSearchCriteria): void {
    // Keep what the customer typed so returning to the step does not lose it, but
    // do not treat a partially typed postcode as a resolved address.
    const current = this.storedValues();
    this.store({
      ...current,
      postcode: criteria.postcode,
      houseNameNumber: criteria.numberOrName || asString(current['houseNameNumber']),
    });
  }

  onResolved(match: AddressLookupMatch): void {
    this.requiredErrorVisible.set(false);
    this.store({ ...match });
  }

  onAddressCleared(): void {
    this.requiredErrorVisible.set(false);
    const current = this.storedValues();
    this.store({ postcode: asString(current['postcode']) });
  }

  /** Section contract: validate and hand back the values to persist. */
  collect(): { valid: boolean; values: Record<string, unknown> } {
    const values = this.storedValues();
    const valid = hasAddressState(values);
    this.requiredErrorVisible.set(!valid);
    return { valid, values: { ...values } };
  }

  private store(values: Record<string, unknown>): void {
    this.journeyState.setSectionAnswers(
      this.moduleCode(),
      this.stepName(),
      this.sectionId(),
      values,
    );
  }
}
