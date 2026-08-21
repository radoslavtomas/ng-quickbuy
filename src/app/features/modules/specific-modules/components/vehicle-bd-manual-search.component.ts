import { Component, computed, input, output, viewChild } from '@angular/core';
import { SignalFormComponent } from '../../../../shared/components/signal-form/signal-form';
import { asString } from '../config/shared/common';
import { BD_MANUAL_VEHICLE_FIELDS } from '../config/motor/steps/vehicle-manual-bd.fields';

/** BD's manual vehicle answer: freeform text, no lookup involved. */
export interface BdManualVehicleValue {
  readonly makeandmodel: string;
  readonly year: string;
  readonly engine: number | null;
}

/**
 * Breakdown insurance's manual vehicle search: three freeform fields, no card,
 * because there is no lookup result to display. `collect()` mirrors the section
 * contract so the parent can treat this the same way it treats a resolved search.
 */
@Component({
  selector: 'app-vehicle-bd-manual-search',
  imports: [SignalFormComponent],
  template: `
    <app-signal-form
      [fields]="fields"
      [initialValue]="initialValue()"
      (valueChanged)="onValueChanged($event)"
    />

    <button
      type="button"
      class="mt-2 text-sm font-semibold text-sky-700 underline decoration-sky-400 underline-offset-2 hover:text-sky-800"
      (click)="switchToVrm.emit()"
    >
      Search by registration instead
    </button>
  `,
})
export class VehicleBdManualSearchComponent {
  readonly initialMakeAndModel = input('');
  readonly initialYear = input('');
  readonly initialEngine = input<number | null>(null);

  readonly valueChanged = output<BdManualVehicleValue>();
  readonly switchToVrm = output<void>();

  readonly fields = BD_MANUAL_VEHICLE_FIELDS;

  readonly initialValue = computed(() => ({
    makeandmodel: this.initialMakeAndModel(),
    year: this.initialYear(),
    engine: this.initialEngine() !== null ? `${this.initialEngine()}` : '',
  }));

  private readonly form = viewChild(SignalFormComponent);

  onValueChanged(values: Record<string, unknown>): void {
    this.valueChanged.emit(this.toValue(values));
  }

  /** Section contract delegate: valid only when all three fields validate. */
  collect(): { valid: boolean; values: BdManualVehicleValue } {
    const result = this.form()?.collect() ?? { valid: true, values: {} };
    return { valid: result.valid, values: this.toValue(result.values) };
  }

  private toValue(values: Record<string, unknown>): BdManualVehicleValue {
    return {
      makeandmodel: asString(values['makeandmodel']),
      year: asString(values['year']),
      engine: this.normalizeEngine(asString(values['engine'])),
    };
  }

  /**
   * Litres typed as a decimal (`1.6`) become cc (`1600`); a value with no decimal
   * point is assumed to already be in cc and is passed through unchanged.
   */
  private normalizeEngine(raw: string): number | null {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }

    const value = Number(trimmed);
    if (!Number.isFinite(value)) {
      return null;
    }

    return trimmed.includes('.') ? Math.round(value * 1000) : value;
  }
}
