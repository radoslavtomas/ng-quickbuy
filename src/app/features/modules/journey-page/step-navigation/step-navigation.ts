import { Component, computed, inject, input, output, signal } from '@angular/core';
import type { JourneyStepDefinition } from '../../../../core/models/journey.model';
import { BrandService } from '../../../../core/services/brand.service';
import { type StepStatus, stepStatus } from '../../journeys/journey-progress';
import { StepMarkerComponent } from './step-marker';

/** SVG user units. The dial is drawn in a 48-unit box and scaled by CSS. */
const DIAL_RADIUS = 20;

/** One step, as the navigation needs to draw it. */
export interface StepNavigationItem {
  readonly step: JourneyStepDefinition;
  /** 1-based, as the customer counts. */
  readonly position: number;
  readonly status: StepStatus;
}

/**
 * The journey progress indicator.
 *
 * Purely presentational: it is told the steps and which are complete, and reports
 * which one the customer asked for. It deliberately neither reads journey state
 * nor navigates, because opening a step has to go through the page's submit
 * pipeline — the same one Continue uses — and that is the page's business.
 *
 * Status comes from the shared `journey-progress` helpers, which also decide
 * whether a URL is allowed, so what the customer can click and what they can
 * reach by typing an address cannot drift apart.
 *
 * Two presentations of one list, chosen by CSS rather than by measuring the
 * viewport, so there is no flash of the wrong one and no resize listener:
 *
 * - from `md` up, a horizontal wizard with a connector rail
 * - below that, the current step, what is next, and a circular progress dial that
 *   expands to the full list on demand, so earlier steps stay reachable on a phone
 *
 * Locked steps are shown as disabled rather than hidden: progressive disclosure
 * applies to the questions, not to the shape of the journey, and a customer who
 * cannot see what is left cannot judge whether to start.
 */
@Component({
  selector: 'app-step-navigation',
  imports: [StepMarkerComponent],
  templateUrl: './step-navigation.html',
  styleUrl: './step-navigation.css',
})
export class StepNavigationComponent {
  readonly steps = input.required<readonly JourneyStepDefinition[]>();
  readonly currentStepName = input.required<string | null>();
  readonly completedStepNames = input.required<readonly string[]>();

  /** A step the customer wants to open. Never emitted for a locked or current step. */
  readonly stepSelected = output<JourneyStepDefinition>();

  private readonly brandService = inject(BrandService);
  readonly brand = this.brandService.config;

  /** Whether the small-screen list is open. Collapsed is the default. */
  private readonly expanded = signal(false);
  readonly isExpanded = this.expanded.asReadonly();

  private readonly completed = computed(() => new Set(this.completedStepNames()));

  private readonly currentIndex = computed(() => {
    const current = this.currentStepName();
    return this.steps().findIndex((step) => step.name === current);
  });

  readonly items = computed<readonly StepNavigationItem[]>(() => {
    const steps = this.steps();
    const current = this.currentStepName();
    const completed = this.completed();
    const isComplete = (stepName: string) => completed.has(stepName);

    return steps.map((step, index) => ({
      step,
      position: index + 1,
      status: stepStatus(steps, step, current, isComplete),
    }));
  });

  readonly totalSteps = computed(() => this.steps().length);

  readonly currentPosition = computed(() => this.currentIndex() + 1);

  readonly currentItem = computed<StepNavigationItem | null>(
    () => this.items()[this.currentIndex()] ?? null,
  );

  readonly nextStep = computed(() => this.steps()[this.currentIndex() + 1] ?? null);

  readonly completedCount = computed(
    () => this.items().filter((item) => item.status === 'complete').length,
  );

  /**
   * How far round the dial to draw, by answers given rather than by position.
   *
   * Position would claim progress the customer has not made: arriving at step four
   * of a resumed journey is not four steps' worth of answers. The current step
   * counts half, so landing on a step reads differently from finishing it.
   */
  readonly progressFraction = computed(() => {
    const total = this.totalSteps();
    if (total === 0) {
      return 0;
    }

    const current = this.currentItem();
    const currentIsUnfinished = current !== null && current.status !== 'complete';

    return Math.min(1, (this.completedCount() + (currentIsUnfinished ? 0.5 : 0)) / total);
  });

  readonly dialRadius = DIAL_RADIUS;
  readonly dialCircumference = 2 * Math.PI * DIAL_RADIUS;

  /** Dash offset that leaves only the completed arc drawn. */
  readonly dialOffset = computed(() => this.dialCircumference * (1 - this.progressFraction()));

  readonly progressPercent = computed(() => Math.round(this.progressFraction() * 100));

  toggleExpanded(): void {
    this.expanded.update((expanded) => !expanded);
  }

  /** The current step is not selectable: there is nowhere to go. */
  isSelectable(item: StepNavigationItem): boolean {
    return item.status !== 'locked' && item.status !== 'current';
  }

  select(item: StepNavigationItem): void {
    if (!this.isSelectable(item)) {
      return;
    }

    this.expanded.set(false);
    this.stepSelected.emit(item.step);
  }

  /** The rail leading into a step is filled only once that step has been reached. */
  connectorFilled(item: StepNavigationItem): boolean {
    return item.status === 'complete' || item.status === 'current';
  }

  /**
   * What a screen reader hears in place of the visual state.
   *
   * `aria-current` already conveys which step is current, so this covers the rest,
   * including why a locked step cannot be opened.
   */
  statusLabel(item: StepNavigationItem): string {
    switch (item.status) {
      case 'complete':
        return 'completed';
      case 'current':
        return 'current step';
      case 'unlocked':
        return 'available';
      default:
        return 'locked, complete the earlier steps first';
    }
  }

  accessibleLabel(item: StepNavigationItem): string {
    return `Step ${item.position} of ${this.totalSteps()}: ${item.step.displayName}, ${this.statusLabel(item)}`;
  }
}
