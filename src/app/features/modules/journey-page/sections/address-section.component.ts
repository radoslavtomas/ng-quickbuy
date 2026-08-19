import { Component, computed, inject, input, signal } from '@angular/core';
import type { AddressLookupMatch } from '../../../../core/services/address-lookup.service';
import { JourneyStateService } from '../../../../core/services/journey-state.service';
import {
  type AddressSearchCriteria,
  RISK_ADDRESS_HOUSE_NAME_NUMBER_FIELD,
  RISK_ADDRESS_KEYS,
  RISK_ADDRESS_MATCHES_FIELD,
  RISK_ADDRESS_QUESTION_FIELD,
  asString,
  hasAddressState,
} from '../../specific-modules/config/shared/common';
import { AddressSearchComponent } from '../../specific-modules/components/address-search.component';
import { SignalFormComponent } from '../../../../shared/components/signal-form/signal-form';

/**
 * Section wrapper around the address lookup, adapting it to the section contract
 * the journey shell expects: values are written to journey state as they change,
 * and `collect()` reports whether the customer has resolved an address.
 *
 * When `riskAddress` is on (property journeys only), resolving the correspondence
 * address reveals a yes/no question — is this also the property being insured? A
 * "yes" derives the risk address fields from the correspondence address in the
 * background; a "no" reveals a second, independent address search that writes to
 * those same fields instead. Both the answer and any risk address values are
 * cleared whenever the customer edits the correspondence address, so a stale risk
 * address can never survive a change to the address it was copied or judged
 * against.
 */
@Component({
  selector: 'app-address-section',
  imports: [AddressSearchComponent, SignalFormComponent],
  template: `
    @if (riskAddress() && resolvedAddress()) {
      <h3 class="my-4 text-md font-semibold text-slate-700 text-center">Your address</h3>
    }

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

    @if (riskAddress() && resolvedAddress()) {
      <div class="mt-4 border-t border-slate-200 pt-4">
        <app-signal-form
          [fields]="riskAddressQuestionFields"
          [initialValue]="riskAddressQuestionInitialValue()"
          (valueChanged)="onRiskAddressMatchesChanged($event)"
        />

        @if (riskAddressMatches() === 'no' && riskAddressResolved()) {
          <h3 class="my-4 text-md font-semibold text-slate-700 text-center">Risk address</h3>
        }

        @if (riskAddressMatches() === 'no') {
          <app-address-search
            [initialPostcode]="riskCriteria().postcode"
            [initialNumberOrName]="riskCriteria().numberOrName"
            [initialAddress]="resolvedRiskAddress()"
            (criteriaChanged)="onRiskCriteriaChanged($event)"
            (addressCleared)="onRiskAddressCleared()"
            (resolved)="onRiskResolved($event)"
          />
        }

        @if (showRiskAddressRequiredError()) {
          <p class="mt-2 text-[0.82rem] text-red-700" role="alert">
            Please tell us whether this is the address of the property you want to insure, and
            resolve that address before continuing.
          </p>
        }
      </div>
    }
  `,
})
export class AddressSectionComponent {
  readonly moduleCode = input.required<string>();
  readonly stepName = input.required<string>();
  readonly sectionId = input.required<string>();
  /** Whether to ask if the correspondence address is also the risk address. */
  readonly riskAddress = input(false);

  private readonly journeyState = inject(JourneyStateService);
  private readonly requiredErrorVisible = signal(false);

  readonly riskAddressQuestionFields = RISK_ADDRESS_QUESTION_FIELD;

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

  readonly riskAddressMatches = computed(() =>
    asString(this.storedValues()[RISK_ADDRESS_MATCHES_FIELD]),
  );

  readonly riskAddressQuestionInitialValue = computed(() => ({
    [RISK_ADDRESS_MATCHES_FIELD]: this.riskAddressMatches(),
  }));

  readonly riskCriteria = computed<AddressSearchCriteria>(() => {
    const values = this.storedValues();
    return {
      postcode: asString(values['riskPostcode']),
      numberOrName:
        asString(values[RISK_ADDRESS_HOUSE_NAME_NUMBER_FIELD]) ||
        asString(values['riskAddressLine1']),
    };
  });

  readonly resolvedRiskAddress = computed<AddressLookupMatch | null>(() => {
    const values = this.storedValues();
    if (
      !hasAddressState({
        addressLine1: values['riskAddressLine1'],
        postcode: values['riskPostcode'],
      })
    ) {
      return null;
    }

    return {
      postcode: asString(values['riskPostcode']),
      addressLine1: asString(values['riskAddressLine1']),
      houseNameNumber: asString(values[RISK_ADDRESS_HOUSE_NAME_NUMBER_FIELD]),
      addressLine2: asString(values['riskAddressLine2']),
      addressLine3: asString(values['riskAddressLine3']),
      addressLine4: asString(values['riskAddressLine4']),
    };
  });

  /**
   * Whether the risk address itself has a value: derived automatically on "yes",
   * or found through the second search on "no".
   */
  readonly riskAddressResolved = computed(
    () => this.riskAddressMatches() === 'yes' || this.resolvedRiskAddress() !== null,
  );

  /** Whether the risk-address question, when asked, has been resolved. */
  private readonly riskAddressValid = computed(() => {
    if (!this.riskAddress() || !this.resolvedAddress()) {
      return true;
    }

    const matches = this.riskAddressMatches();
    if (matches === 'yes') {
      return true;
    }

    if (matches === 'no') {
      return hasAddressState({
        addressLine1: this.storedValues()['riskAddressLine1'],
        postcode: this.storedValues()['riskPostcode'],
      });
    }

    return false;
  });

  readonly showRiskAddressRequiredError = computed(
    () =>
      this.requiredErrorVisible() &&
      hasAddressState(this.storedValues()) &&
      !this.riskAddressValid(),
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
    // A newly resolved correspondence address replaces the whole section, which
    // also drops any risk address answered against the address it is replacing.
    this.store({ ...match });
  }

  onAddressCleared(): void {
    this.requiredErrorVisible.set(false);
    const current = this.storedValues();
    // Editing the correspondence address invalidates any risk address derived from
    // or judged against it, so only the postcode the customer typed survives.
    this.store({ postcode: asString(current['postcode']) });
  }

  onRiskAddressMatchesChanged(value: Record<string, unknown>): void {
    const matches = asString(value[RISK_ADDRESS_MATCHES_FIELD]);
    if (matches !== 'yes' && matches !== 'no') {
      return;
    }

    const current = this.withoutRiskAddress(this.storedValues());

    if (matches === 'no') {
      // Switching away from "yes" must drop the copied address rather than leave it
      // behind for the fresh search below to silently inherit.
      this.store({ ...current, [RISK_ADDRESS_MATCHES_FIELD]: 'no' });
      return;
    }

    const address = this.resolvedAddress();
    this.store({
      ...current,
      [RISK_ADDRESS_MATCHES_FIELD]: 'yes',
      riskAddressLine1: address?.addressLine1 ?? '',
      riskAddressLine2: address?.addressLine2 ?? '',
      riskAddressLine3: address?.addressLine3 ?? '',
      riskAddressLine4: address?.addressLine4 ?? '',
      riskPostcode: address?.postcode ?? '',
    });
  }

  onRiskCriteriaChanged(criteria: AddressSearchCriteria): void {
    const current = this.storedValues();
    this.store({
      ...current,
      riskPostcode: criteria.postcode,
      [RISK_ADDRESS_HOUSE_NAME_NUMBER_FIELD]:
        criteria.numberOrName || asString(current[RISK_ADDRESS_HOUSE_NAME_NUMBER_FIELD]),
    });
  }

  onRiskResolved(match: AddressLookupMatch): void {
    const current = this.storedValues();
    this.store({
      ...current,
      riskAddressLine1: match.addressLine1,
      riskAddressLine2: match.addressLine2,
      riskAddressLine3: match.addressLine3,
      riskAddressLine4: match.addressLine4,
      riskPostcode: match.postcode,
      [RISK_ADDRESS_HOUSE_NAME_NUMBER_FIELD]: match.houseNameNumber,
    });
  }

  onRiskAddressCleared(): void {
    const current = this.storedValues();
    this.store({
      ...current,
      riskAddressLine1: '',
      riskAddressLine2: '',
      riskAddressLine3: '',
      riskAddressLine4: '',
      [RISK_ADDRESS_HOUSE_NAME_NUMBER_FIELD]: '',
      riskPostcode: asString(current['riskPostcode']),
    });
  }

  /** Section contract: validate and hand back the values to persist. */
  collect(): { valid: boolean; values: Record<string, unknown> } {
    const values = this.storedValues();
    const valid = hasAddressState(values) && this.riskAddressValid();
    this.requiredErrorVisible.set(!valid);
    return { valid, values: { ...values } };
  }

  private withoutRiskAddress(values: Record<string, unknown>): Record<string, unknown> {
    const result = { ...values };
    for (const key of RISK_ADDRESS_KEYS) {
      delete result[key];
    }
    return result;
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
