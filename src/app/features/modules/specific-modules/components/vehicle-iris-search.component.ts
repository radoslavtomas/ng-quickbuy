import { Component, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { NormalizedVehicle } from '../../../../core/models/vehicle-search.model';
import {
  VEHICLE_NOT_FOUND_FALLBACK_MESSAGE,
  VehicleLookupService,
  dataErrorMessage,
  transportErrorMessage,
} from '../../../../core/services/vehicle-lookup.service';
import { SignalFormComponent } from '../../../../shared/components/signal-form/signal-form';
import { asString } from '../config/shared/common';
import { createVehicleIrisFields } from '../config/motor/vehicle-iris.fields';

/** The customer's make/model/year/edition picks, restored on reload and persisted UI-only. */
export interface IrisSelectionChange {
  readonly make: string;
  readonly model: string;
  readonly year: number | null;
  readonly abicode: string;
}

/**
 * Manual vehicle search for PC, TX and GV: cascading make -> model -> year ->
 * edition, backed by the same `SignalFormComponent` (and `dynamic-select` field
 * type) as every other question in the journey. This component only owns what a
 * generic form cannot: turning a chosen edition into a confirmed vehicle via the
 * ABI code lookup, and the "vehicle found" card that replaces the selects once
 * one is confirmed.
 */
@Component({
  selector: 'app-vehicle-iris-search',
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
        [fields]="fields()"
        [initialValue]="initialValue()"
        (valueChanged)="onValueChanged($event)"
      />

      @if (error(); as message) {
        <p class="mt-2 text-[0.82rem] text-red-700" role="alert">{{ message }}</p>
      }
    }

    <button
      type="button"
      class="mt-4 block text-sm font-semibold text-sky-700 underline decoration-sky-400 underline-offset-2 hover:text-sky-800"
      (click)="switchToVrm.emit()"
    >
      Search by registration instead
    </button>
  `,
})
export class VehicleIrisSearchComponent {
  readonly moduleCode = input.required<string>();
  readonly initialMake = input('');
  readonly initialModel = input('');
  readonly initialYear = input<number | null>(null);
  readonly initialAbicode = input('');
  readonly initialVehicle = input<NormalizedVehicle | null>(null);

  readonly resolved = output<NormalizedVehicle>();
  readonly selectionChanged = output<IrisSelectionChange>();
  readonly switchToVrm = output<void>();

  readonly fields = computed(() => createVehicleIrisFields(this.moduleCode()));

  readonly initialValue = computed(() => ({
    make: this.initialMake(),
    model: this.initialModel(),
    year: this.initialYear() !== null ? `${this.initialYear()}` : '',
    edition: this.initialAbicode(),
  }));

  readonly error = signal<string | null>(null);
  readonly resolvedVehicle = signal<NormalizedVehicle | null>(null);

  private readonly lookup = inject(VehicleLookupService);
  private readonly signalForm = viewChild(SignalFormComponent);

  /**
   * The ABI code a resolution is already in flight or complete for, so a
   * restored or repeated selection does not trigger the lookup again.
   */
  private lastHandledAbicode: string | null = null;

  constructor() {
    effect(() => {
      const initial = this.initialVehicle();
      if (initial) {
        this.resolvedVehicle.set(initial);
        this.lastHandledAbicode = initial.abicode;
      }
    });
  }

  onValueChanged(values: Record<string, unknown>): void {
    const make = asString(values['make']);
    const model = asString(values['model']);
    const yearText = asString(values['year']);
    const abicode = asString(values['edition']);
    const year = yearText ? Number(yearText) : null;

    this.selectionChanged.emit({ make, model, year, abicode });

    if (!abicode) {
      this.resolvedVehicle.set(null);
      this.error.set(null);
      this.lastHandledAbicode = null;
      return;
    }

    // The persisted answer from a previous visit already has a normalized
    // vehicle via `initialVehicle`, so there is nothing to fetch.
    if (abicode === this.initialAbicode() && this.initialVehicle()) {
      this.resolvedVehicle.set(this.initialVehicle());
      this.lastHandledAbicode = abicode;
      return;
    }

    if (abicode !== this.lastHandledAbicode) {
      this.lastHandledAbicode = abicode;
      void this.resolveAbicode(abicode, year);
    }
  }

  editVehicle(): void {
    this.resolvedVehicle.set(null);
    this.error.set(null);
  }

  /**
   * Section contract delegate: reveals "Make is required." (or whichever field is
   * currently visible) the same as pressing Continue does for every other field,
   * instead of leaving the customer with only the section-level summary.
   */
  touch(): void {
    this.signalForm()?.collect();
  }

  private async resolveAbicode(abicode: string, year: number | null): Promise<void> {
    this.error.set(null);

    try {
      const response = await firstValueFrom(this.lookup.getByAbicode(this.moduleCode(), abicode));
      const dataError = dataErrorMessage(response.error);

      if (dataError || !response.vehicle) {
        this.error.set(dataError ?? VEHICLE_NOT_FOUND_FALLBACK_MESSAGE);
        return;
      }

      const normalized = this.lookup.normalizeFromAbicode(response.vehicle, { year, abicode });
      this.resolvedVehicle.set(normalized);
      this.resolved.emit(normalized);
    } catch (err) {
      this.error.set(transportErrorMessage(err));
    }
  }
}
