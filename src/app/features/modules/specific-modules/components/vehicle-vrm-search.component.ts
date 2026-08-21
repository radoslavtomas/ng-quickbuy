import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { FormFieldConfig } from '../../../../core/models/form-field.model';
import type { NormalizedVehicle } from '../../../../core/models/vehicle-search.model';
import { BrandService } from '../../../../core/services/brand.service';
import {
  VEHICLE_NOT_FOUND_FALLBACK_MESSAGE,
  VehicleLookupService,
  dataErrorMessage,
  transportErrorMessage,
} from '../../../../core/services/vehicle-lookup.service';
import { SignalFormComponent } from '../../../../shared/components/signal-form/signal-form';
import { asString } from '../config/shared/common';

/** How far back a vehicle's year of manufacture may be for breakdown cover. */
const BD_MAX_VEHICLE_AGE_YEARS = 13;

const REGISTRATION_FIELDS: readonly FormFieldConfig[] = [
  {
    type: 'text',
    label: 'Vehicle registration',
    name: 'registration',
    validators: [{ type: 'required', message: 'Vehicle registration is required.' }],
    normalization: ['trim', 'uppercase'],
    metadata: { placeholder: 'AB12CDE' },
  },
];

/**
 * VRM search, used as the default mode for PC, TX and BD. A matched registration is
 * only provisional until the ABI code lookup confirms and normalizes it, so the two
 * calls are always chained: `vrmFailed` covers the registration not resolving to
 * anything at all, while an ABI code failure is shown inline without changing mode,
 * since the registration itself was valid.
 */
@Component({
  selector: 'app-vehicle-vrm-search',
  imports: [SignalFormComponent],
  template: `
    @if (resolvedVehicle(); as vehicle) {
      <article class="rounded-md border border-slate-200 bg-slate-50 p-3">
        <p class="text-sm font-semibold text-slate-900">Vehicle found</p>
        <div class="mt-2 space-y-1 text-sm text-slate-700">
          <p>{{ vehicle.make }} {{ vehicle.model }}</p>
          @if (vehicle.year) {
            <p>Year: {{ vehicle.year }}</p>
          }
          @if (vehicle.regnumber) {
            <p>Registration: {{ vehicle.regnumber }}</p>
          }
        </div>

        <button
          type="button"
          class="mt-3 text-sm font-semibold text-sky-700 underline decoration-sky-400 underline-offset-2 hover:text-sky-800"
          (click)="editVehicle()"
        >
          Edit vehicle
        </button>
      </article>
    } @else {
      <app-signal-form
        [fields]="registrationFields"
        [initialValue]="registrationInitialValue()"
        (valueChanged)="onRegistrationValueChanged($event)"
      />

      <div class="flex justify-center md:justify-end">
        <button
          type="button"
          class="mt-3 inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-slate-200"
          [style.background-color]="accentAlt"
          [disabled]="loading()"
          (click)="search()"
        >
          {{ loading() ? 'Searching...' : 'Find vehicle' }}
          <i class="fa-solid fa-car" aria-hidden="true"></i>
        </button>
      </div>

      @if (ageError(); as message) {
        <p class="mt-2 text-[0.82rem] text-red-700" role="alert">{{ message }}</p>
      }

      @if (error(); as message) {
        <p class="mt-2 text-[0.82rem] text-red-700" role="alert">{{ message }}</p>
      }

      <button
        type="button"
        class="mt-4 block text-sm font-semibold text-sky-700 underline decoration-sky-400 underline-offset-2 hover:text-sky-800"
        (click)="switchToManual.emit()"
      >
        I don't know my registration number
      </button>
    }
  `,
})
export class VehicleVrmSearchComponent {
  private readonly brandService = inject(BrandService);

  /** The Find vehicle button is white on this, so it cannot be a pale brand colour. */
  readonly accentAlt = this.brandService.accentAlt;

  readonly moduleCode = input.required<string>();
  readonly initialRegistration = input('');
  readonly initialVehicle = input<NormalizedVehicle | null>(null);

  readonly resolved = output<NormalizedVehicle>();
  readonly vrmFailed = output<string>();
  readonly cleared = output<void>();
  /** Fires as the customer types, before any search runs, so it can be persisted. */
  readonly registrationChanged = output<string>();
  /** The customer chose manual search themselves, without a VRM search failing first. */
  readonly switchToManual = output<void>();

  readonly registrationFields = REGISTRATION_FIELDS;

  readonly registrationInitialValue = computed(() => ({
    registration: this.initialRegistration(),
  }));

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly ageError = signal<string | null>(null);
  readonly resolvedVehicle = signal<NormalizedVehicle | null>(null);

  private readonly lookup = inject(VehicleLookupService);
  private readonly registrationForm = viewChild(SignalFormComponent);

  constructor() {
    effect(() => {
      const initial = this.initialVehicle();
      if (initial) {
        this.resolvedVehicle.set(initial);
      }
    });
  }

  onRegistrationValueChanged(value: Record<string, unknown>): void {
    this.registrationChanged.emit(asString(value['registration']));
  }

  async search(): Promise<void> {
    const result = this.registrationForm()?.collect();
    if (!result?.valid) {
      return;
    }

    await this.runVrmSearch(asString(result.values['registration']));
  }

  /** Runs the VRM search directly, used both by the search button and by recall auto-resolution. */
  async runVrmSearch(registration: string): Promise<void> {
    if (this.loading() || !registration) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.ageError.set(null);

    try {
      const response = await firstValueFrom(this.lookup.getByVrm(this.moduleCode(), registration));
      const firstVehicle = response.vehicles?.[0];

      if (dataErrorMessage(response.error) || !firstVehicle) {
        this.vrmFailed.emit(registration);
        return;
      }

      if (this.isOverAgeLimitForBreakdown(firstVehicle.year)) {
        this.ageError.set('Cover is only available for vehicles no more than 13 years old');
        return;
      }

      await this.resolveAbicode(firstVehicle.registration, firstVehicle.year, firstVehicle.abicode);
    } catch {
      // A transport failure is treated the same as no match: the customer cannot
      // tell the difference, and the DVLA-delay explanation applies either way.
      this.vrmFailed.emit(registration);
    } finally {
      this.loading.set(false);
    }
  }

  editVehicle(): void {
    this.resolvedVehicle.set(null);
    this.error.set(null);
    this.ageError.set(null);
    this.cleared.emit();
  }

  private isOverAgeLimitForBreakdown(year: number): boolean {
    if (this.moduleCode().toUpperCase() !== 'BD') {
      return false;
    }

    return new Date().getFullYear() - year >= BD_MAX_VEHICLE_AGE_YEARS;
  }

  private async resolveAbicode(
    regnumber: string,
    year: number | null,
    abicode: string,
  ): Promise<void> {
    try {
      const response = await firstValueFrom(this.lookup.getByAbicode(this.moduleCode(), abicode));
      const dataError = dataErrorMessage(response.error);

      if (dataError || !response.vehicle) {
        this.error.set(dataError ?? VEHICLE_NOT_FOUND_FALLBACK_MESSAGE);
        return;
      }

      const normalized = this.lookup.normalizeFromAbicode(response.vehicle, {
        regnumber,
        year,
        abicode,
      });
      this.resolvedVehicle.set(normalized);
      this.resolved.emit(normalized);
    } catch (err) {
      this.error.set(transportErrorMessage(err));
    }
  }
}
