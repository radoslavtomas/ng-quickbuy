import { Component, computed, inject, input, signal, viewChildren } from '@angular/core';
import type { JourneyRepeatSection } from '../../../../core/models/journey.model';
import { JourneyStateService } from '../../../../core/services/journey-state.service';
import { SignalFormComponent } from '../../../../shared/components/signal-form/signal-form';
import { resolveFields } from '../../journeys/journey-registry';

/** Values captured for one item of the list. */
type ItemValues = Record<string, unknown>;

/**
 * Renders a list of items that all answer the same questions.
 *
 * Each item is rendered by the ordinary field renderer, so the questions, validation
 * and accessibility behave exactly as they do anywhere else and no markup is
 * duplicated. Items are ordered and their wire slot comes from their position, so
 * removing one re-packs the rest.
 *
 * Cross-item rules — "no two drivers with the same date of birth", say — would need
 * the items to share one field tree via `applyEach`. Nothing asks for that yet, and
 * one form per item is a great deal simpler.
 */
@Component({
  selector: 'app-repeat-section',
  imports: [SignalFormComponent],
  template: `
    @for (item of items(); track $index) {
      <fieldset class="mb-4 border-0 p-0">
        <legend class="mb-2 flex w-full items-center justify-between gap-3">
          <span class="text-[0.95rem] font-bold text-slate-900">
            {{ section().itemLabel }} {{ $index + 1 }}
          </span>

          @if (canRemove()) {
            <button
              type="button"
              class="shrink-0 cursor-pointer text-sm font-semibold text-sky-700 underline decoration-sky-400 underline-offset-2 hover:text-sky-800"
              (click)="removeItem($index)"
            >
              Remove
            </button>
          }
        </legend>

        <app-signal-form
          [fields]="itemFields()"
          [initialValue]="item"
          (valueChanged)="onItemChanged($index, $event)"
        />
      </fieldset>
    }

    @if (canAdd()) {
      <button
        type="button"
        class="cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        (click)="addItem()"
      >
        Add another {{ section().itemLabel.toLowerCase() }}
      </button>
    } @else {
      <p class="text-sm text-slate-600">
        You can add up to {{ maxItems() }} {{ section().itemLabel.toLowerCase() }}s.
      </p>
    }
  `,
})
export class RepeatSectionComponent {
  readonly section = input.required<JourneyRepeatSection>();
  readonly moduleCode = input.required<string>();
  readonly stepName = input.required<string>();

  private readonly journeyState = inject(JourneyStateService);
  private readonly itemForms = viewChildren(SignalFormComponent);

  /** The per-item questions, which some products vary by module. */
  readonly itemFields = computed(() => resolveFields(this.section().itemFields, this.moduleCode()));

  /**
   * The list being edited.
   *
   * Seeded once from stored answers so that typing does not rebuild the item forms;
   * subsequent edits flow through `onItemChanged`.
   */
  private readonly workingItems = signal<readonly ItemValues[] | null>(null);

  readonly items = computed<readonly ItemValues[]>(() => {
    const working = this.workingItems();
    if (working) {
      return working;
    }

    const stored = this.journeyState.sectionAnswers(
      this.moduleCode(),
      this.stepName(),
      this.section().id,
    )['items'];

    const seeded = Array.isArray(stored) ? (stored as ItemValues[]) : [];
    return seeded.length > 0 ? seeded : [{}];
  });

  readonly maxItems = computed(() => this.section().slots.length);

  readonly canAdd = computed(() => this.items().length < this.maxItems());

  readonly canRemove = computed(() => this.items().length > (this.section().minItems ?? 1));

  addItem(): void {
    this.setItems([...this.items(), {}]);
  }

  removeItem(index: number): void {
    this.setItems(this.items().filter((_, itemIndex) => itemIndex !== index));
  }

  onItemChanged(index: number, values: ItemValues): void {
    this.setItems(this.items().map((item, itemIndex) => (itemIndex === index ? values : item)));
  }

  /** Section contract: every item must be valid for the list to be. */
  collect(): { valid: boolean; values: Record<string, unknown> } {
    const results = this.itemForms().map((form) => form.collect());
    const values = results.map((result) => result.values);

    // Keep whatever the customer typed even when invalid, so nothing is lost.
    this.setItems(values);

    return {
      valid: results.every((result) => result.valid),
      values: { items: values },
    };
  }

  private setItems(items: readonly ItemValues[]): void {
    this.workingItems.set(items);
    this.journeyState.setSectionAnswers(this.moduleCode(), this.stepName(), this.section().id, {
      items,
    });
  }
}
