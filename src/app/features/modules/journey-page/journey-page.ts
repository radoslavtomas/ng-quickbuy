import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  viewChild,
  viewChildren,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import type { JourneySection, JourneyStepDefinition } from '../../../core/models/journey.model';
import { BrandService } from '../../../core/services/brand.service';
import { JourneyStateService } from '../../../core/services/journey-state.service';
import {
  findStep,
  getFirstStep,
  getJourneyForModule,
  getNextStep,
  getPreviousStep,
  getStepNumber,
} from '../journeys/journey-registry';
import { NotFoundComponent } from '../../../shared/components/not-found/not-found';
import { SectionOutletComponent } from './section-outlet.component';

/**
 * The single journey screen.
 *
 * Everything on the page comes from the journey definition for the current module:
 * the progress list, the step heading, the sections, and where Continue goes. There
 * are no per-module or per-step components.
 */
@Component({
  selector: 'app-journey-page',
  imports: [RouterLink, NotFoundComponent, SectionOutletComponent],
  templateUrl: './journey-page.html',
  styleUrl: './journey-page.css',
})
export class JourneyPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly brandService = inject(BrandService);
  private readonly journeyState = inject(JourneyStateService);

  readonly brand = this.brandService.config;

  private readonly sectionOutlets = viewChildren(SectionOutletComponent);
  private readonly stepHeading = viewChild<ElementRef<HTMLHeadingElement>>('stepHeading');
  private renderedStepName: string | null = null;

  readonly moduleCode = this.brandService.currentModuleCode;

  readonly module = computed(() => this.brandService.getModuleByCode(this.moduleCode()));

  readonly journey = computed(() => getJourneyForModule(this.moduleCode()));

  private readonly requestedStepName = toSignal(
    this.route.paramMap.pipe(map(params => params.get('stepName')?.toLowerCase() ?? null)),
    {
      initialValue: this.route.snapshot.paramMap.get('stepName')?.toLowerCase() ?? null,
    },
  );

  readonly step = computed<JourneyStepDefinition | null>(() => {
    const journey = this.journey();
    if (!journey) {
      return null;
    }

    return findStep(journey, this.requestedStepName());
  });

  /**
   * True when the URL named a step this journey does not have. Distinct from "no
   * step in the URL", which redirects to the first step instead.
   */
  readonly stepNotFound = computed(() => this.requestedStepName() !== null && this.step() === null);

  readonly stepCount = computed(() => this.journey()?.steps.length ?? 0);

  readonly stepNumber = computed(() => {
    const journey = this.journey();
    const step = this.step();
    return journey && step ? getStepNumber(journey, step.name) : 0;
  });

  readonly stepAnnouncement = computed(() =>
    this.step() ? `Step ${this.stepNumber()} of ${this.stepCount()}` : '',
  );

  readonly previousStep = computed(() => {
    const journey = this.journey();
    const step = this.step();
    return journey && step ? getPreviousStep(journey, step.name) : null;
  });

  readonly nextStep = computed(() => {
    const journey = this.journey();
    const step = this.step();
    return journey && step ? getNextStep(journey, step.name) : null;
  });

  /** Sections whose `visibleWhen` gate passes for the answers captured so far. */
  readonly visibleSections = computed<readonly JourneySection[]>(() => {
    const step = this.step();
    const moduleCode = this.moduleCode();
    if (!step || !moduleCode) {
      return [];
    }

    const answers = this.journeyState.stepAnswers(moduleCode, step.name);
    return step.sections.filter(section => section.visibleWhen?.(answers) ?? true);
  });

  constructor() {
    // A module route with no step lands on the first step of its journey.
    effect(() => {
      const moduleCode = this.moduleCode();
      const journey = this.journey();
      if (!moduleCode || !journey || this.requestedStepName()) {
        return;
      }

      void this.router.navigate(['/', moduleCode, getFirstStep(journey).name], {
        replaceUrl: true,
      });
    });

    // Move focus to the heading of a newly rendered step, but never on first paint.
    afterRenderEffect(() => {
      const stepName = this.step()?.name ?? null;
      const heading = this.stepHeading()?.nativeElement;
      if (!stepName || !heading || this.renderedStepName === stepName) {
        return;
      }

      const isFirstRenderedStep = this.renderedStepName === null;
      this.renderedStepName = stepName;

      if (!isFirstRenderedStep) {
        heading.focus();
      }
    });
  }

  stepLink(stepName: string): readonly [string, string, string] | null {
    const moduleCode = this.moduleCode();
    return moduleCode ? ['/', moduleCode, stepName] : null;
  }

  isActiveStep(step: JourneyStepDefinition): boolean {
    return this.step()?.name === step.name;
  }

  /**
   * Section identity is only unique within a step, so the step name is part of the
   * key. Without it, two steps sharing a section id would reuse the same rendered
   * section and carry the previous step's form state across.
   */
  sectionTrackKey(section: JourneySection): string {
    return `${this.step()?.name ?? ''}:${section.id}`;
  }

  isStepComplete(step: JourneyStepDefinition): boolean {
    const moduleCode = this.moduleCode();
    return moduleCode ? this.journeyState.isStepComplete(moduleCode, step.name) : false;
  }

  /**
   * Validates every visible section, persists what they captured and moves on.
   * A single invalid section keeps the customer on the step with errors revealed.
   */
  onContinue(): void {
    const moduleCode = this.moduleCode();
    const step = this.step();
    const next = this.nextStep();
    if (!moduleCode || !step) {
      return;
    }

    const results = this.sectionOutlets().map(outlet => ({
      sectionId: outlet.section().id,
      result: outlet.collect(),
    }));

    for (const { sectionId, result } of results) {
      this.journeyState.setSectionAnswers(moduleCode, step.name, sectionId, result.values);
    }

    if (results.some(({ result }) => !result.valid)) {
      return;
    }

    this.journeyState.markStepComplete(moduleCode, step.name);

    if (next) {
      void this.router.navigate(['/', moduleCode, next.name]);
    }
  }
}
