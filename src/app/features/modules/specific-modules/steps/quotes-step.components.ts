import { Component, input } from '@angular/core';
import { DemoQuote } from '../config';

@Component({
  selector: 'app-motor-your-quotes-step',
  template: `
    <p class="module-code">Demo quotes generated from your submitted journey data.</p>

    <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      @for (quote of quotes(); track quote.insurer + quote.plan) {
        <article class="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h2 class="text-base font-semibold text-slate-900">{{ quote.insurer }}</h2>
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
      <pre class="mt-3 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">{{ payloadPretty() }}</pre>
    </details>
  `,
})
export class MotorYourQuotesStepComponent {
  readonly payloadPretty = input.required<string>();
  readonly quotes = input.required<readonly DemoQuote[]>();
}

@Component({
  selector: 'app-property-your-quotes-step',
  template: `
    <p class="module-code">Demo quotes generated from your submitted journey data.</p>

    <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      @for (quote of quotes(); track quote.insurer + quote.plan) {
        <article class="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h2 class="text-base font-semibold text-slate-900">{{ quote.insurer }}</h2>
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
      <pre class="mt-3 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">{{ payloadPretty() }}</pre>
    </details>
  `,
})
export class PropertyYourQuotesStepComponent {
  readonly payloadPretty = input.required<string>();
  readonly quotes = input.required<readonly DemoQuote[]>();
}
