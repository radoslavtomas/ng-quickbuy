import { Component, computed, inject, input } from '@angular/core';
import { BrandService } from '../../../../core/services/brand.service';
import type { StepStatus } from '../../journeys/journey-progress';

/** Every brand gets a white icon on a filled marker; the fill bends to allow it. */
const MARKER_FOREGROUND = '#ffffff';

/**
 * The circular marker for one step: its icon, its number and its state.
 *
 * Its own component because the wizard rail, the phone summary and the phone list
 * all draw the same thing, so the states are described once.
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

  /** The contrast-safe brand colours, so the icon can be white on every brand. */
  private readonly primary = this.brandService.accent;
  private readonly secondary = this.brandService.accentAlt;

  /** A tick replaces the step's own icon once the step is behind the customer. */
  readonly icon = computed(() =>
    this.status() === 'complete' ? 'fa-solid fa-check' : `fa-solid fa-${this.stepIcon()}`,
  );

  /** Only the finished and current steps are filled, so the eye finds "you are here". */
  readonly background = computed(() => {
    switch (this.status()) {
      case 'complete':
        return this.secondary;
      case 'current':
        return this.primary;
      default:
        return null;
    }
  });

  /** White on a filled marker; the unfilled ones keep the slate default from CSS. */
  readonly foreground = computed(() => (this.background() === null ? null : MARKER_FOREGROUND));

  readonly border = computed(() => {
    switch (this.status()) {
      case 'complete':
        return this.secondary;
      case 'current':
      case 'unlocked':
        return this.primary;
      default:
        return null;
    }
  });
}
