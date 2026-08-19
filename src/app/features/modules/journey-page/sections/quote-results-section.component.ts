import { Component, computed, inject, input } from '@angular/core';
import { JourneyStateService } from '../../../../core/services/journey-state.service';
import { DEMO_QUOTES } from '../../specific-modules/config/shared/common';

/**
 * Outcome section for the final step.
 *
 * Quotes are still fixture data. The payload preview is deliberately shown grouped
 * by step and section, which is how answers are now stored, so it doubles as a way
 * to verify the journey captured what was expected.
 */
@Component({
  selector: 'app-quote-results-section',
  template: `
    <p class="text-sm text-slate-600">Demo quotes generated from your submitted journey data.</p>

    <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      @for (quote of quotes; track quote.insurer + quote.plan) {
        <article class="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h3 class="text-base font-semibold text-slate-900">{{ quote.insurer }}</h3>
          <p class="text-sm text-slate-600">{{ quote.plan }}</p>
          <p class="mt-2 text-2xl font-bold text-slate-900">
            GBP {{ quote.monthlyPremium.toFixed(2) }}
            <span class="text-sm font-medium text-slate-500">/month</span>
          </p>
          <p class="text-sm text-slate-700">Annual: GBP {{ quote.annualPremium.toFixed(2) }}</p>
          <p class="text-sm text-slate-700">Excess: GBP {{ quote.excess }}</p>
        </article>
      }
    </div>

    <details class="mt-4 rounded-lg border border-slate-200 bg-white p-3">
      <summary class="cursor-pointer text-sm font-semibold text-slate-900">
        View submitted journey payload
      </summary>
      <pre class="mt-3 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">{{
        payloadPretty()
      }}</pre>
    </details>
  `,
})
export class QuoteResultsSectionComponent {
  readonly moduleCode = input.required<string>();
  readonly stepName = input.required<string>();
  readonly sectionId = input.required<string>();

  private readonly journeyState = inject(JourneyStateService);

  readonly quotes = DEMO_QUOTES;

  readonly payloadPretty = computed(() =>
    JSON.stringify(
      {
        moduleCode: this.moduleCode(),
        answers: this.journeyState.moduleAnswers(this.moduleCode()),
      },
      null,
      2,
    ),
  );

  /** Section contract: the outcome screen captures nothing. */
  collect(): { valid: boolean; values: Record<string, unknown> } {
    return { valid: true, values: {} };
  }
}
