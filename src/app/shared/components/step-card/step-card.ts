import { Component, inject, input } from '@angular/core';
import { BrandService } from '../../../core/services/brand.service';

@Component({
  selector: 'app-step-card',
  template: `
    <div class="mb-4 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      <div class="px-4 py-3" [style.background-color]="accent">
        <h2 class="text-sm font-semibold text-white">{{ title() }}</h2>
      </div>
      <div class="space-y-4 bg-white px-5 py-5">
        <ng-content />
      </div>
    </div>
  `,
})
export class StepCardComponent {
  private readonly brandService = inject(BrandService);

  readonly title = input.required<string>();

  /** The heading is white on this, so the raw brand colour will not do. */
  readonly accent = this.brandService.accent;
}
