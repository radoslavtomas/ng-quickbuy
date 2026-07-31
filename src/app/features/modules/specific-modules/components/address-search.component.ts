import { Component, ViewChild, computed, effect, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  AddressLookupMatch,
  AddressLookupService,
} from '../../../../core/services/address-lookup.service';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form';
import {
  ADDRESS_LOOKUP_FIELDS,
  ADDRESS_MANUAL_FIELDS,
  AddressSearchCriteria,
  asString,
} from '../config/shared/common';

@Component({
  selector: 'app-address-search',
  imports: [DynamicFormComponent],
  template: `
    @if (selectedAddress(); as address) {
      <article class="rounded-md border border-slate-200 bg-slate-50 p-3">
        <p class="text-sm font-semibold text-slate-900">Selected address</p>
        <div class="mt-2 space-y-1 text-sm text-slate-700">
          @for (line of selectedAddressLines(); track line) {
            <p>{{ line }}</p>
          }
        </div>

        <button
          type="button"
          class="mt-3 text-sm font-semibold text-sky-700 underline decoration-sky-400 underline-offset-2 hover:text-sky-800"
          (click)="changeAddress()"
        >
          Change address
        </button>
      </article>
    } @else {
      @if (mode() === 'lookup') {
        <app-dynamic-form
          [fields]="lookupFields"
          [initialValue]="lookupInitialValue()"
          [submitLabel]="loading() ? 'Searching...' : 'Find address'"
          submitIcon="fa-solid fa-house"
          (valueChanged)="onCriteriaChanged($event)"
          (submitted)="onLookupSearch($event)"
        />

        <button
          type="button"
          class="mt-2 text-sm font-semibold text-sky-700 underline decoration-sky-400 underline-offset-2 hover:text-sky-800"
          (click)="useManualEntry()"
        >
          Enter the full address manually
        </button>
      } @else {
        <app-dynamic-form
          [fields]="manualFields"
          [initialValue]="manualInitialValue()"
          [showSubmitButton]="false"
          (valueChanged)="onManualAddressChanged($event)"
        />

        <button
          type="button"
          class="mt-2 text-sm font-semibold text-sky-700 underline decoration-sky-400 underline-offset-2 hover:text-sky-800"
          (click)="useAddressLookup()"
        >
          Use address lookup
        </button>
      }
    }

    @if (lookupError(); as error) {
      <p class="mt-1 text-[0.82rem] text-red-700" role="alert">We couldn't find the address. Please, try again.</p>
    }
  `,
})
export class AddressSearchComponent {
  readonly initialPostcode = input('');
  readonly initialNumberOrName = input('');
  readonly initialAddress = input<AddressLookupMatch | null>(null);

  readonly criteriaChanged = output<AddressSearchCriteria>();
  readonly resolved = output<AddressLookupMatch>();
  readonly addressCleared = output<void>();

  readonly lookupFields = ADDRESS_LOOKUP_FIELDS;
  readonly manualFields = ADDRESS_MANUAL_FIELDS;

  readonly mode = signal<'lookup' | 'manual'>('lookup');
  readonly selectedAddress = signal<AddressLookupMatch | null>(null);

  readonly lookupInitialValue = computed(() => ({
    numberOrName: this.initialNumberOrName(),
    postcode: this.initialPostcode(),
  }));

  readonly manualInitialValue = computed(() => {
    const selected = this.selectedAddress();
    return {
      addressLine1: selected?.addressLine1 ?? '',
      addressLine2: selected?.addressLine2 ?? '',
      addressLine3: selected?.addressLine3 ?? '',
      addressLine4: selected?.addressLine4 ?? '',
      postcode: selected?.postcode ?? this.initialPostcode(),
    };
  });

  readonly selectedAddressLines = computed(() => {
    const selected = this.selectedAddress();
    if (!selected) {
      return [] as string[];
    }

    return [
      selected.addressLine1,
      selected.addressLine2,
      selected.addressLine3,
      selected.addressLine4,
      selected.postcode,
    ].filter(line => line.trim().length > 0);
  });

  readonly loading = signal(false);
  readonly lookupError = signal<string | null>(null);

  private readonly lookupService = inject(AddressLookupService);
  @ViewChild(DynamicFormComponent) private addressForm?: DynamicFormComponent;

  constructor() {
    effect(() => {
      const initialAddress = this.initialAddress();
      if (!initialAddress || this.mode() !== 'lookup') {
        return;
      }

      this.selectedAddress.set(initialAddress);
    });
  }

  validateCurrentInput(): void {
    if (this.selectedAddress()) {
      return;
    }

    this.addressForm?.validateFromParent();
  }

  onCriteriaChanged(value: Record<string, unknown>): void {
    this.criteriaChanged.emit({
      postcode: asString(value['postcode']),
      numberOrName: asString(value['numberOrName']),
    });
  }

  useManualEntry(): void {
    this.lookupError.set(null);
    this.mode.set('manual');
    this.selectedAddress.set(null);
    this.addressCleared.emit();
  }

  useAddressLookup(): void {
    this.lookupError.set(null);
    this.mode.set('lookup');
    this.selectedAddress.set(null);
    this.addressCleared.emit();
  }

  changeAddress(): void {
    this.lookupError.set(null);
    this.mode.set('lookup');
    this.selectedAddress.set(null);
    this.addressCleared.emit();
  }

  async onLookupSearch(value: Record<string, unknown>): Promise<void> {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.lookupError.set(null);

    const criteria = {
      numberOrName: asString(value['numberOrName']),
      postcode: asString(value['postcode']),
    };

    this.criteriaChanged.emit(criteria);

    try {
      const response = await firstValueFrom(this.lookupService.lookupByPostcode({
        postcode: criteria.postcode,
        numberOrNameForSearch: criteria.numberOrName,
      }));

      const mapped = this.lookupService.mapToFormValue(response);
      this.criteriaChanged.emit({ postcode: mapped.postcode, numberOrName: mapped.houseNameNumber });
      this.selectedAddress.set(mapped);
      this.resolved.emit(mapped);
    } catch (error) {
      this.lookupError.set(error instanceof Error ? error.message : 'Unable to search this address.');
    } finally {
      this.loading.set(false);
    }
  }

  onManualAddressChanged(value: Record<string, unknown>): void {
    const manualAddress: AddressLookupMatch = {
      houseNameNumber: '',
      addressLine1: asString(value['addressLine1']),
      addressLine2: asString(value['addressLine2']),
      addressLine3: asString(value['addressLine3']),
      addressLine4: asString(value['addressLine4']),
      postcode: asString(value['postcode']),
    };

    const isComplete =
      manualAddress.addressLine1.trim().length > 0 &&
      manualAddress.addressLine4.trim().length > 0 &&
      manualAddress.postcode.trim().length > 0;

    if (!isComplete) {
      this.selectedAddress.set(null);
      this.addressCleared.emit();
      return;
    }

    this.criteriaChanged.emit({ postcode: manualAddress.postcode, numberOrName: '' });
    this.resolved.emit(manualAddress);
  }
}
