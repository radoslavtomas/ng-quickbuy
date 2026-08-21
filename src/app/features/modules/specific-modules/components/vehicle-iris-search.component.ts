import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  IrisMatch,
  IrisModule,
  NormalizedVehicle,
} from '../../../../core/models/vehicle-search.model';
import { VehicleIrisService } from '../../../../core/services/vehicle-iris.service';
import {
  VEHICLE_NOT_FOUND_FALLBACK_MESSAGE,
  VehicleLookupService,
  dataErrorMessage,
  transportErrorMessage,
} from '../../../../core/services/vehicle-lookup.service';
import { resolveIrisModule } from '../config/motor/vehicle-field-map';

/** The customer's make/model/year/edition picks, restored on reload and persisted UI-only. */
export interface IrisSelectionChange {
  readonly make: string;
  readonly model: string;
  readonly year: number | null;
  readonly abicode: string;
}

const FUEL_LABELS: Readonly<Record<string, string>> = {
  P: 'Petrol',
  D: 'Diesel',
  E: 'Electric',
  H: 'Hybrid',
};

/**
 * Manual vehicle search for PC, TX and GV: cascading make -> model -> year -> edition
 * selects backed by the IRIS catalogue. Not built on `SignalFormComponent` /
 * `FormFieldConfig`, because its options are loaded asynchronously and each
 * selection resets and reloads the next, which the static `FieldsProvider` model
 * has no way to express.
 */
@Component({
  selector: 'app-vehicle-iris-search',
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
      <div class="space-y-3">
        <label class="block text-sm font-semibold text-slate-900">
          Make
          <select
            class="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm"
            [disabled]="loadingMakes()"
            [value]="selectedMake()"
            (change)="onMakeChange($any($event.target).value)"
          >
            <option value="">Select a make</option>
            @for (make of makes(); track make) {
              <option [value]="make">{{ make }}</option>
            }
          </select>
        </label>

        @if (selectedMake()) {
          <label class="block text-sm font-semibold text-slate-900">
            Model
            <select
              class="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm"
              [disabled]="loadingModels()"
              [value]="selectedModel()"
              (change)="onModelChange($any($event.target).value)"
            >
              <option value="">Select a model</option>
              @for (model of models(); track model) {
                <option [value]="model">{{ model }}</option>
              }
            </select>
          </label>
        }

        @if (selectedModel()) {
          <label class="block text-sm font-semibold text-slate-900">
            Year
            <select
              class="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm"
              [disabled]="loadingSearch()"
              [value]="selectedYear() ?? ''"
              (change)="onYearChange($any($event.target).value)"
            >
              <option value="">Select a year</option>
              @for (year of years(); track year) {
                <option [value]="year">{{ year }}</option>
              }
            </select>
          </label>
        }

        @if (selectedYear() !== null) {
          <label class="block text-sm font-semibold text-slate-900">
            Edition
            <select
              class="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm"
              [disabled]="loadingAbicode()"
              [value]="selectedAbicode()"
              (change)="onEditionChange($any($event.target).value)"
            >
              <option value="">Select an edition</option>
              @for (edition of editions(); track edition['@attributes'].ABI_code) {
                <option [value]="edition['@attributes'].ABI_code">
                  {{ editionLabel(edition) }}
                </option>
              }
            </select>
          </label>
        }
      </div>

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
export class VehicleIrisSearchComponent implements OnInit {
  readonly moduleCode = input.required<string>();
  readonly initialMake = input('');
  readonly initialModel = input('');
  readonly initialYear = input<number | null>(null);
  readonly initialAbicode = input('');
  readonly initialVehicle = input<NormalizedVehicle | null>(null);

  readonly resolved = output<NormalizedVehicle>();
  readonly selectionChanged = output<IrisSelectionChange>();
  readonly switchToVrm = output<void>();

  readonly irisModule = computed<IrisModule>(() => resolveIrisModule(this.moduleCode()));

  readonly makes = signal<readonly string[]>([]);
  readonly models = signal<readonly string[]>([]);
  readonly years = signal<readonly number[]>([]);
  readonly matches = signal<readonly IrisMatch[]>([]);

  readonly selectedMake = signal('');
  readonly selectedModel = signal('');
  readonly selectedYear = signal<number | null>(null);
  readonly selectedAbicode = signal('');

  readonly loadingMakes = signal(false);
  readonly loadingModels = signal(false);
  readonly loadingSearch = signal(false);
  readonly loadingAbicode = signal(false);
  readonly error = signal<string | null>(null);
  readonly resolvedVehicle = signal<NormalizedVehicle | null>(null);

  readonly editions = computed(() => {
    const year = this.selectedYear();
    if (year === null) {
      return [] as readonly IrisMatch[];
    }

    return this.matches().filter((match) => {
      const attributes = match['@attributes'];
      const from = Number(attributes.From);
      const to = Number(attributes.To);
      return year >= from && year <= to;
    });
  });

  private readonly iris = inject(VehicleIrisService);
  private readonly lookup = inject(VehicleLookupService);

  async ngOnInit(): Promise<void> {
    const initialVehicle = this.initialVehicle();
    if (initialVehicle) {
      this.resolvedVehicle.set(initialVehicle);
    }

    await this.loadMakes();
    await this.restoreInitialSelections();
  }

  editionLabel(match: IrisMatch): string {
    const attributes = match['@attributes'];
    const fuel = FUEL_LABELS[attributes.Fuel] ?? attributes.Fuel;
    return `${attributes.Make} ${attributes.Model} - ${attributes.Type} - ${attributes.Engine_CC}cc - ${fuel}`;
  }

  onMakeChange(make: string): void {
    this.selectedMake.set(make);
    this.resetFrom('model');
    this.emitSelectionChanged();

    if (make) {
      void this.loadModels(make);
    }
  }

  onModelChange(model: string): void {
    this.selectedModel.set(model);
    this.resetFrom('year');
    this.emitSelectionChanged();

    if (model) {
      void this.loadSearch(model);
    }
  }

  onYearChange(rawYear: string): void {
    this.selectedYear.set(rawYear ? Number(rawYear) : null);
    this.selectedAbicode.set('');
    this.resolvedVehicle.set(null);
    this.error.set(null);
    this.emitSelectionChanged();
  }

  async onEditionChange(abicode: string): Promise<void> {
    this.selectedAbicode.set(abicode);
    this.resolvedVehicle.set(null);
    this.emitSelectionChanged();

    if (abicode) {
      await this.resolveAbicode(abicode);
    }
  }

  editVehicle(): void {
    this.resolvedVehicle.set(null);
    this.error.set(null);
  }

  private async loadMakes(): Promise<void> {
    this.loadingMakes.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(this.iris.getMakes(this.irisModule()));
      this.makes.set([...(response.Make ?? [])].sort());
    } catch (err) {
      this.error.set(transportErrorMessage(err));
    } finally {
      this.loadingMakes.set(false);
    }
  }

  private async loadModels(make: string): Promise<void> {
    this.loadingModels.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(this.iris.getModels(this.irisModule(), make));
      this.models.set([...(response.Model ?? [])].sort());
    } catch (err) {
      this.error.set(transportErrorMessage(err));
    } finally {
      this.loadingModels.set(false);
    }
  }

  private async loadSearch(model: string): Promise<void> {
    this.loadingSearch.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.iris.search(this.irisModule(), this.selectedMake(), model),
      );
      this.matches.set(this.iris.matchesOf(this.irisModule(), response));
      this.years.set([...(response.years ?? [])].sort((a, b) => b - a));
    } catch (err) {
      this.error.set(transportErrorMessage(err));
    } finally {
      this.loadingSearch.set(false);
    }
  }

  private async resolveAbicode(abicode: string): Promise<void> {
    this.loadingAbicode.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(this.lookup.getByAbicode(this.moduleCode(), abicode));
      const dataError = dataErrorMessage(response.error);

      if (dataError || !response.vehicle) {
        this.error.set(dataError ?? VEHICLE_NOT_FOUND_FALLBACK_MESSAGE);
        return;
      }

      const normalized = this.lookup.normalizeFromAbicode(response.vehicle, {
        year: this.selectedYear(),
        abicode,
      });
      this.resolvedVehicle.set(normalized);
      this.resolved.emit(normalized);
    } catch (err) {
      this.error.set(transportErrorMessage(err));
    } finally {
      this.loadingAbicode.set(false);
    }
  }

  /** Restores a prior visit's selections, re-fetching each cascade level in turn. */
  private async restoreInitialSelections(): Promise<void> {
    const make = this.initialMake();
    if (!make || !this.makes().includes(make)) {
      return;
    }

    this.selectedMake.set(make);
    await this.loadModels(make);

    const model = this.initialModel();
    if (!model || !this.models().includes(model)) {
      return;
    }

    this.selectedModel.set(model);
    await this.loadSearch(model);

    const year = this.initialYear();
    if (year === null || !this.years().includes(year)) {
      return;
    }

    this.selectedYear.set(year);

    const abicode = this.initialAbicode();
    if (abicode) {
      this.selectedAbicode.set(abicode);
    }
  }

  private resetFrom(level: 'model' | 'year'): void {
    if (level === 'model') {
      this.selectedModel.set('');
      this.models.set([]);
    }

    this.selectedYear.set(null);
    this.selectedAbicode.set('');
    this.years.set([]);
    this.matches.set([]);
    this.resolvedVehicle.set(null);
    this.error.set(null);
  }

  private emitSelectionChanged(): void {
    this.selectionChanged.emit({
      make: this.selectedMake(),
      model: this.selectedModel(),
      year: this.selectedYear(),
      abicode: this.selectedAbicode(),
    });
  }
}
