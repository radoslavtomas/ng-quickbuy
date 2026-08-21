import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type {
  NormalizedVehicle,
  VehicleSearchMode,
} from '../../../../core/models/vehicle-search.model';
import { JourneyStateService } from '../../../../core/services/journey-state.service';
import {
  VehicleLookupService,
  buildDvlaDelayWarning,
  dataErrorMessage,
} from '../../../../core/services/vehicle-lookup.service';
import {
  VEHICLE_SEARCH_UI_ONLY_FIELDS,
  fromVehicleWireAnswers,
  toVehicleWireAnswers,
  vehicleFieldKeys,
} from '../../specific-modules/config/motor/vehicle-field-map';
import type { BdManualVehicleValue } from '../../specific-modules/components/vehicle-bd-manual-search.component';
import { VehicleBdManualSearchComponent } from '../../specific-modules/components/vehicle-bd-manual-search.component';
import type { IrisSelectionChange } from '../../specific-modules/components/vehicle-iris-search.component';
import { VehicleIrisSearchComponent } from '../../specific-modules/components/vehicle-iris-search.component';
import { VehicleVrmSearchComponent } from '../../specific-modules/components/vehicle-vrm-search.component';

/**
 * Vehicle search custom section: orchestrates the VRM/manual mode switch, the
 * per-module manual UX (IRIS for PC/TX/GV, freeform for BD), the DVLA-delay
 * warning, recall auto-resolution and the section's own validity contract.
 *
 * Follows `AddressSectionComponent`'s shape: everything is derived from journey
 * state via `computed()`, and every meaningful child event writes straight back
 * to journey state, so `collect()` only has to read what is already there.
 */
@Component({
  selector: 'app-vehicle-search-section',
  imports: [VehicleVrmSearchComponent, VehicleIrisSearchComponent, VehicleBdManualSearchComponent],
  template: `
    @if (dvlaWarningHtml(); as warning) {
      <div
        class="mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        role="status"
        [innerHTML]="warning"
      ></div>
    }

    @if (mode() === 'vrm') {
      <app-vehicle-vrm-search
        [moduleCode]="moduleCode()"
        [initialRegistration]="initialRegistration()"
        [initialVehicle]="currentVehicle()"
        (resolved)="onVehicleResolved($event)"
        (vrmFailed)="onVrmFailed($event)"
        (cleared)="onVrmCleared()"
        (registrationChanged)="onRegistrationChanged($event)"
        (switchToManual)="onSwitchToManual()"
      />
    } @else if (isBd()) {
      <app-vehicle-bd-manual-search
        [initialMakeAndModel]="bdInitialValue().makeandmodel"
        [initialYear]="bdInitialValue().year"
        [initialEngine]="bdInitialValue().engine"
        (valueChanged)="onBdValueChanged($event)"
        (switchToVrm)="onSwitchToVrm()"
      />
    } @else {
      <app-vehicle-iris-search
        [moduleCode]="moduleCode()"
        [initialMake]="irisSelections().make"
        [initialModel]="irisSelections().model"
        [initialYear]="irisSelections().year"
        [initialAbicode]="irisSelections().abicode"
        [initialVehicle]="currentVehicle()"
        (resolved)="onVehicleResolved($event)"
        (selectionChanged)="onIrisSelectionChanged($event)"
        (switchToVrm)="onSwitchToVrm()"
      />
    }

    @if (showValidationError()) {
      <p class="mt-2 text-[0.82rem] text-red-700" role="alert">
        There's no valid vehicle or you haven't searched for it
      </p>
    }
  `,
})
export class VehicleSearchSectionComponent {
  readonly moduleCode = input.required<string>();
  readonly stepName = input.required<string>();
  readonly sectionId = input.required<string>();

  private readonly journeyState = inject(JourneyStateService);
  private readonly lookup = inject(VehicleLookupService);
  private readonly bdManualSearch = viewChild(VehicleBdManualSearchComponent);

  private readonly triedToContinue = signal(false);
  private readonly recallChecked = signal(false);

  readonly isBd = computed(() => this.moduleCode().toUpperCase() === 'BD');

  private readonly storedWireValues = computed<Record<string, unknown>>(() =>
    this.journeyState.sectionAnswers(this.moduleCode(), this.stepName(), this.sectionId()),
  );

  private readonly storedVehicleFields = computed(() =>
    fromVehicleWireAnswers(this.moduleCode(), this.storedWireValues()),
  );

  readonly mode = computed<VehicleSearchMode>(() => {
    const stored = this.storedWireValues()['vehicleSearchMode'];
    if (stored === 'vrm' || stored === 'manual') {
      return stored;
    }

    // GV starts on manual search; PC, TX and BD start on the registration lookup.
    return this.moduleCode().toUpperCase() === 'GV' ? 'manual' : 'vrm';
  });

  readonly currentVehicle = computed<NormalizedVehicle | null>(() => {
    const stored = this.storedVehicleFields();
    if (!stored.make || !stored.model || !stored.abicode) {
      return null;
    }

    return {
      regnumber: typeof stored.regnumber === 'string' ? stored.regnumber : undefined,
      make: String(stored.make),
      model: String(stored.model),
      year: typeof stored.year === 'number' ? stored.year : null,
      fuel: typeof stored.fuel === 'string' ? stored.fuel : '',
      engine: typeof stored.engine === 'number' ? stored.engine : null,
      transmission: typeof stored.transmission === 'string' ? stored.transmission : '',
      abicode: String(stored.abicode),
      weight: typeof stored.weight === 'number' ? stored.weight : undefined,
    };
  });

  private readonly hasBdManualAnswer = computed(() => {
    const stored = this.storedVehicleFields();
    return Boolean(stored.makeandmodel) && Boolean(stored.year) && stored.engine != null;
  });

  readonly hasValidVehicle = computed(() =>
    this.mode() === 'manual' && this.isBd()
      ? this.hasBdManualAnswer()
      : this.currentVehicle() !== null,
  );

  readonly showValidationError = computed(() => this.triedToContinue() && !this.hasValidVehicle());

  readonly initialRegistration = computed(() => {
    const value = this.storedVehicleFields().regnumber;
    return typeof value === 'string' ? value : '';
  });

  readonly dvlaWarningHtml = computed<string | null>(() => {
    if (this.mode() !== 'manual') {
      return null;
    }

    const registration = this.storedWireValues()['vehicleVrmFailedFor'];
    return typeof registration === 'string' && registration
      ? buildDvlaDelayWarning(registration)
      : null;
  });

  readonly irisSelections = computed(() => {
    const values = this.storedWireValues();
    return {
      make: typeof values['irisMake'] === 'string' ? (values['irisMake'] as string) : '',
      model: typeof values['irisModel'] === 'string' ? (values['irisModel'] as string) : '',
      year: typeof values['irisYear'] === 'number' ? (values['irisYear'] as number) : null,
      abicode: typeof values['irisAbicode'] === 'string' ? (values['irisAbicode'] as string) : '',
    };
  });

  readonly bdInitialValue = computed(() => {
    const stored = this.storedVehicleFields();
    const year = stored.year;
    return {
      makeandmodel: typeof stored.makeandmodel === 'string' ? stored.makeandmodel : '',
      year: typeof year === 'string' ? year : year != null ? String(year) : '',
      engine: typeof stored.engine === 'number' ? stored.engine : null,
    };
  });

  constructor() {
    // A recalled quote arrives with a registration and ABI code but no make/model
    // (the recall response never carries those). That combination, seen exactly
    // once per section instance, means "resolve this like a fresh VRM search" so
    // the customer sees their vehicle without having to search again.
    effect(() => {
      const moduleCode = this.moduleCode();
      const stepName = this.stepName();
      const sectionId = this.sectionId();

      if (this.recallChecked()) {
        return;
      }
      this.recallChecked.set(true);

      const stored = untracked(() =>
        this.journeyState.sectionAnswers(moduleCode, stepName, sectionId),
      );
      const vehicle = fromVehicleWireAnswers(moduleCode, stored);

      // Both the registration and the ABI code must already be present, and the
      // make must not be: that combination only ever comes from a recall, since a
      // customer who merely typed a registration without searching has no ABI
      // code yet, and any completed search always has a make.
      if (
        typeof vehicle.regnumber === 'string' &&
        vehicle.regnumber &&
        typeof vehicle.abicode === 'string' &&
        vehicle.abicode &&
        !vehicle.make
      ) {
        void this.resolveRecall(moduleCode, vehicle.regnumber);
      }
    });
  }

  onVehicleResolved(vehicle: NormalizedVehicle): void {
    this.store({
      ...toVehicleWireAnswers(this.moduleCode(), vehicle),
      vehicleVrmFailedFor: undefined,
    });
  }

  onVrmFailed(registration: string): void {
    this.replaceVehicleAnswers({ vehicleSearchMode: 'manual', vehicleVrmFailedFor: registration });
  }

  onVrmCleared(): void {
    this.replaceVehicleAnswers({ vehicleSearchMode: 'vrm' });
  }

  /** The customer typed a registration but has not searched yet; keep it, nothing else. */
  onRegistrationChanged(registration: string): void {
    const key = vehicleFieldKeys(this.moduleCode()).regnumber;
    this.store({ [key]: registration });
  }

  onIrisSelectionChanged(selection: IrisSelectionChange): void {
    this.store({
      irisMake: selection.make,
      irisModel: selection.model,
      irisYear: selection.year,
      irisAbicode: selection.abicode,
    });
  }

  onBdValueChanged(value: BdManualVehicleValue): void {
    this.store(
      toVehicleWireAnswers(this.moduleCode(), {
        makeandmodel: value.makeandmodel,
        year: value.year,
        engine: value.engine,
      }),
    );
  }

  onSwitchToVrm(): void {
    this.replaceVehicleAnswers({ vehicleSearchMode: 'vrm' });
  }

  /** The customer chose manual search themselves; no DVLA warning applies here. */
  onSwitchToManual(): void {
    this.replaceVehicleAnswers({ vehicleSearchMode: 'manual' });
  }

  /** Section contract: validate and hand back the values the shell should persist. */
  collect(): { valid: boolean; values: Record<string, unknown> } {
    this.triedToContinue.set(true);

    if (this.mode() === 'manual' && this.isBd()) {
      const result = this.bdManualSearch()?.collect();
      if (result) {
        this.store(toVehicleWireAnswers(this.moduleCode(), result.values));
        return { valid: result.valid, values: { ...this.storedWireValues() } };
      }
    }

    return { valid: this.hasValidVehicle(), values: { ...this.storedWireValues() } };
  }

  private async resolveRecall(moduleCode: string, registration: string): Promise<void> {
    try {
      const vrmResponse = await firstValueFrom(this.lookup.getByVrm(moduleCode, registration));
      const firstVehicle = vrmResponse.vehicles?.[0];

      if (dataErrorMessage(vrmResponse.error) || !firstVehicle) {
        this.onVrmFailed(registration);
        return;
      }

      const abicodeResponse = await firstValueFrom(
        this.lookup.getByAbicode(moduleCode, firstVehicle.abicode),
      );

      if (dataErrorMessage(abicodeResponse.error) || !abicodeResponse.vehicle) {
        this.onVrmFailed(registration);
        return;
      }

      const normalized = this.lookup.normalizeFromAbicode(abicodeResponse.vehicle, {
        regnumber: firstVehicle.registration,
        year: firstVehicle.year ?? null,
        abicode: firstVehicle.abicode,
      });

      this.store({
        ...toVehicleWireAnswers(moduleCode, normalized),
        vehicleSearchMode: 'vrm',
      });
    } catch {
      this.onVrmFailed(registration);
    }
  }

  private store(patch: Record<string, unknown>): void {
    this.journeyState.setSectionAnswers(this.moduleCode(), this.stepName(), this.sectionId(), {
      ...this.storedWireValues(),
      ...patch,
    });
  }

  /**
   * Drops every vehicle-related key (wire and UI-only) before writing `patch`, so
   * switching mode cannot leave a stale answer from the mode being left behind.
   */
  private replaceVehicleAnswers(patch: Record<string, unknown>): void {
    const clearedKeys = new Set<string>([
      ...Object.values(vehicleFieldKeys(this.moduleCode())),
      ...VEHICLE_SEARCH_UI_ONLY_FIELDS,
    ]);

    const kept: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(this.storedWireValues())) {
      if (!clearedKeys.has(key)) {
        kept[key] = value;
      }
    }

    this.journeyState.setSectionAnswers(this.moduleCode(), this.stepName(), this.sectionId(), {
      ...kept,
      ...patch,
    });
  }
}
