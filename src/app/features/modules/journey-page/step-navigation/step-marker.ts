import { Component, computed, inject, input } from '@angular/core';
import { BrandService } from '../../../../core/services/brand.service';
import { contrastColor } from '../../../../core/utils/contrast-color';
import type { StepStatus } from '../../journeys/journey-progress';

/**
 * The circular marker for one step: its icon, its number and its state.
 *
 * Its own component because the wizard rail, the phone summary and the phone list
 * all draw the same thing, and because the brand colours it needs — including the
 * measured foreground that keeps it readable — are then resolved in one place.
 */
@Component({
  selector: 'app-step-marker',
  template: `
    <span
      class="marker"
      [class.marker--compact]="compact()"
      [style.backgroundColor]="background()"
      [style.color]="foreground()"
      [style.borderColor]="border()"
    >
      <i [class]="icon()" aria-hidden="true"></i>

      @if (showNumber()) {
        <span class="marker__badge" aria-hidden="true">{{ position() }}</span>
      }
    </span>
  `,
  styleUrl: './step-marker.css',
})
export class StepMarkerComponent {
  readonly status = input.required<StepStatus>();
  /** Font Awesome solid icon name for the step, without the `fa-` prefix. */
  readonly stepIcon = input.required<string>();
  readonly position = input.required<number>();
  readonly compact = input(false);
  readonly showNumber = input(true);

  private readonly brandService = inject(BrandService);
  private readonly brand = this.brandService.config;

  /** A tick replaces the step's own icon once the step is behind the customer. */
  readonly icon = computed(() =>
    this.status() === 'complete' ? 'fa-solid fa-check' : `fa-solid fa-${this.stepIcon()}`,
  );

  /** Only the finished and current steps are filled, so the eye finds "you are here". */
  readonly background = computed(() => {
    switch (this.status()) {
      case 'complete':
        return this.brand.secondaryColor;
      case 'current':
        return this.brand.primaryColor;
      default:
        return null;
    }
  });

  readonly foreground = computed(() => {
    switch (this.status()) {
      case 'complete':
        return contrastColor(this.brand.secondaryColor);
      case 'current':
        return contrastColor(this.brand.primaryColor);
      default:
        return null;
    }
  });

  readonly border = computed(() => {
    switch (this.status()) {
      case 'complete':
        return this.brand.secondaryColor;
      case 'current':
      case 'unlocked':
        return this.brand.primaryColor;
      default:
        return null;
    }
  });
}
