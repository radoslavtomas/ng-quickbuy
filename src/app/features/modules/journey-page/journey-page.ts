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
import { ModuleContextService } from '../../../core/services/module-context.service';
import { JourneyPersistenceService } from '../journeys/journey-persistence.service';
import { firstIncompleteStep, isStepUnlocked } from '../journeys/journey-progress';
import {
  findStep,
  getFirstStep,
  getJourneyForModule,
  getNextStep,
  getPreviousStep,
  getStepIndex,
  getStepNumber,
} from '../journeys/journey-registry';
import { NotFoundComponent } from '../../../shared/components/not-found/not-found';
import { SectionOutletComponent } from './section-outlet.component';
import { StepNavigationComponent } from './step-navigation/step-navigation';

/**
 * The single journey screen.
 *
 * Everything on the page comes from the journey definition for the current module:
 * the progress list, the step heading, the sections, and where Continue goes. There
 * are no per-module or per-step components.
 */
@Component({
  selector: 'app-journey-page',
  imports: [RouterLink, NotFoundComponent, SectionOutletComponent, StepNavigationComponent],
  templateUrl: './journey-page.html',
  styleUrl: './journey-page.css',
})
export class JourneyPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly brandService = inject(BrandService);
  private readonly journeyState = inject(JourneyStateService);
  private readonly moduleContext = inject(ModuleContextService);
  private readonly persistence = inject(JourneyPersistenceService);

  readonly brand = this.brandService.config;

  private readonly sectionOutlets = viewChildren(SectionOutletComponent);
  private readonly stepHeading = viewChild<ElementRef<HTMLHeadingElement>>('stepHeading');
  private renderedStepName: string | null = null;

  readonly moduleCode = this.brandService.currentModuleCode;

  readonly module = computed(() => this.brandService.getModuleByCode(this.moduleCode()));

  readonly journey = computed(() => getJourneyForModule(this.moduleCode()));

  private readonly requestedStepName = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('stepName')?.toLowerCase() ?? null)),
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

  /** The product has been switched off upstream, so the journey must not be offered. */
  readonly isSwitchedOff = computed(() => {
    const moduleCode = this.moduleCode();
    return moduleCode ? this.moduleContext.isSwitchedOff(moduleCode) : false;
  });

  readonly switchedOffMessage = computed(() => {
    const moduleCode = this.moduleCode();
    return moduleCode ? this.moduleContext.switchedOffMessage(moduleCode) : '';
  });

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

  /** Steps completed for this module, which is what unlocks the ones after them. */
  readonly completedStepNames = computed<readonly string[]>(() => {
    const moduleCode = this.moduleCode();
    return moduleCode ? this.journeyState.completedSteps(moduleCode) : [];
  });

  /**
   * True when the URL names a real step the customer has not earned yet.
   *
   * Gating the URL as well as the navigation matters: otherwise the rule is
   * decoration, and typing an address or using a stale bookmark would still open
   * a step whose questions depend on answers that were never given.
   */
  private readonly requestedStepIsLocked = computed(() => {
    const journey = this.journey();
    const step = this.step();
    if (!journey || !step) {
      return false;
    }

    return !isStepUnlocked(journey.steps, step.name, (name) => this.isStepNameComplete(name));
  });

  /** Sections whose `visibleWhen` gate passes for the answers captured so far. */
  readonly visibleSections = computed<readonly JourneySection[]>(() => {
    const step = this.step();
    const moduleCode = this.moduleCode();
    if (!step || !moduleCode) {
      return [];
    }

    const answers = this.journeyState.stepAnswers(moduleCode, step.name);
    return step.sections.filter((section) => section.visibleWhen?.(answers) ?? true);
  });

  constructor() {
    // Entering a journey mints its session, loads the module's operational
    // parameters and creates the partial quote. Deliberately not awaited: the
    // customer should see step 1 immediately, and the ordering that matters
    // (parameters before create) is enforced inside the persistence service.
    effect(() => {
      const moduleCode = this.moduleCode();
      if (!moduleCode || !this.journey()) {
        return;
      }

      void this.moduleContext.ensureLoaded(moduleCode);
      void this.persistence.ensureCreated(moduleCode);
    });

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

    // A step the customer has not unlocked sends them to where they left off,
    // replacing the URL so Back does not bounce them straight into it again.
    effect(() => {
      const moduleCode = this.moduleCode();
      const journey = this.journey();
      if (!moduleCode || !journey || !this.requestedStepIsLocked()) {
        return;
      }

      const target = firstIncompleteStep(journey.steps, (name) => this.isStepNameComplete(name));
      void this.router.navigate(['/', moduleCode, target.name], { replaceUrl: true });
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

  /**
   * Section identity is only unique within a step, so the step name is part of the
   * key. Without it, two steps sharing a section id would reuse the same rendered
   * section and carry the previous step's form state across.
   */
  sectionTrackKey(section: JourneySection): string {
    return `${this.step()?.name ?? ''}:${section.id}`;
  }

  /** Continue: submit this step and move to the next one. */
  onContinue(): void {
    const next = this.nextStep();
    if (next) {
      this.goToStep(next);
    }
  }

  /**
   * Opens another step, submitting the current one on the way if that is called for.
   *
   * Moving forward runs exactly what Continue runs — validate every visible
   * section, persist what they captured, mark the step complete and record it —
   * so a step can never be skipped past by clicking further along the progress
   * list. An invalid section keeps the customer here with the errors revealed.
   *
   * Moving back does none of that. Sections write their values to journey state as
   * they are edited, so nothing typed is lost by leaving, and refusing to let
   * someone return to an earlier answer until the current screen is valid would be
   * a trap: the reason they are going back is often that the earlier answer was
   * wrong. Their completion ticks stay as they were, so the frontier does not move.
   */
  goToStep(target: JourneyStepDefinition): void {
    const moduleCode = this.moduleCode();
    const journey = this.journey();
    const step = this.step();
    if (!moduleCode || !journey || !step || target.name === step.name) {
      return;
    }

    const isForward = getStepIndex(journey, target.name) > getStepIndex(journey, step.name);
    if (isForward && !this.submitCurrentStep(moduleCode, step)) {
      return;
    }

    // Completing this step may have unlocked the target; recheck before moving.
    if (!isStepUnlocked(journey.steps, target.name, (name) => this.isStepNameComplete(name))) {
      return;
    }

    void this.router.navigate(['/', moduleCode, target.name]);
  }

  /**
   * Validates and stores the current step. Returns whether it was accepted.
   *
   * Answers are written whether or not they pass, so an invalid step still keeps
   * what the customer typed.
   */
  private submitCurrentStep(moduleCode: string, step: JourneyStepDefinition): boolean {
    const results = this.sectionOutlets().map((outlet) => ({
      sectionId: outlet.section().id,
      result: outlet.collect(),
    }));

    for (const { sectionId, result } of results) {
      this.journeyState.setSectionAnswers(moduleCode, step.name, sectionId, result.values);
    }

    if (results.some(({ result }) => !result.valid)) {
      return false;
    }

    this.journeyState.markStepComplete(moduleCode, step.name);
    void this.persistence.recordStep(moduleCode, step);

    return true;
  }

  private isStepNameComplete(stepName: string): boolean {
    const moduleCode = this.moduleCode();
    return moduleCode ? this.journeyState.isStepComplete(moduleCode, stepName) : false;
  }
}
