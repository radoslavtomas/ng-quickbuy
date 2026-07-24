import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { BrandService } from '../../core/services/brand.service';
import { getJourneyByType } from '../../core/config/module-journeys.config';
import type { JourneyStep } from '../../core/models/module-journey.model';
import {
  BdModuleComponent,
  GvModuleComponent,
  HcModuleComponent,
  HhModuleComponent,
  LlModuleComponent,
  PcModuleComponent,
  TxModuleComponent,
} from './specific-modules';

@Component({
  selector: 'app-module-page',
  imports: [
    RouterLink,
    PcModuleComponent,
    GvModuleComponent,
    BdModuleComponent,
    TxModuleComponent,
    HcModuleComponent,
    HhModuleComponent,
    LlModuleComponent,
  ],
  templateUrl: './module-page.html',
  styleUrl: './module-page.css',
})
export class ModulePageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly brandService = inject(BrandService);

  readonly brand = this.brandService.config;
  readonly currentModuleCode = this.brandService.currentModuleCode;
  readonly selectedStepName = toSignal(
    this.route.paramMap.pipe(map(params => params.get('stepName')?.toLowerCase() ?? null)),
    { initialValue: this.route.snapshot.paramMap.get('stepName')?.toLowerCase() ?? null },
  );

  readonly currentModule = computed(() => {
    const code = this.currentModuleCode();
    return code ? this.brandService.getModuleByCode(code) : null;
  });

  readonly currentJourney = computed(() => {
    const module = this.currentModule();
    return module ? getJourneyByType(module.journeyType) : [];
  });

  readonly currentStep = computed(() => {
    const journey = this.currentJourney();
    if (!journey.length) {
      return null;
    }

    const stepName = this.selectedStepName();
    if (!stepName) {
      return journey[0];
    }

    return journey.find(step => step.name === stepName) ?? journey[0];
  });

  readonly previousStep = computed(() => {
    const step = this.currentStep();
    if (!step?.prev) {
      return null;
    }

    return this.currentJourney().find(journeyStep => journeyStep.name === step.prev) ?? null;
  });

  readonly nextStep = computed(() => {
    const step = this.currentStep();
    if (!step?.next) {
      return null;
    }

    return this.currentJourney().find(journeyStep => journeyStep.name === step.next) ?? null;
  });

  constructor() {
    effect(() => {
      const moduleCode = this.currentModuleCode();
      const stepName = this.selectedStepName();
      const firstStepName = this.currentJourney()[0]?.name;

      if (!moduleCode || stepName || !firstStepName) {
        return;
      }

      void this.router.navigate(['/', moduleCode, firstStepName], { replaceUrl: true });
    });
  }

  stepLink(stepName: string): readonly [string, string, string] | null {
    const moduleCode = this.currentModuleCode();
    return moduleCode ? ['/', moduleCode, stepName] : null;
  }

  isActiveStep(step: JourneyStep): boolean {
    return this.currentStep()?.name === step.name;
  }
}
