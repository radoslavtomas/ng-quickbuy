import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { FormWorkflowService } from '../../../../core/services/form-workflow.service';
import {
  DEMO_QUOTES,
  MOTOR_STEP_DEFAULT_VALUES,
  MOTOR_STEP_ORDER,
  PROPERTY_STEP_DEFAULT_VALUES,
  PROPERTY_STEP_ORDER,
} from '../config';
import {
  MotorAdditionalDriversStepComponent,
  MotorYourPolicyStepComponent,
  MotorYourVehicleStepComponent,
  PropertyAssumptionsStepComponent,
  PropertyJointProposerStepComponent,
  PropertyYourPolicyStepComponent,
  PropertyYourPropertyStepComponent,
} from '../steps/form-step.components';
import { MotorYourQuotesStepComponent, PropertyYourQuotesStepComponent } from '../steps/quotes-step.components';
import { MotorYourDetailsStepComponent, PropertyYourDetailsStepComponent } from '../steps/your-details-step.components';

@Component({
  selector: 'app-motor-quote-journey',
  imports: [
    MotorYourDetailsStepComponent,
    MotorYourVehicleStepComponent,
    MotorAdditionalDriversStepComponent,
    MotorYourPolicyStepComponent,
    MotorYourQuotesStepComponent,
  ],
  template: `
    @switch (currentStepName()) {
      @case ('your-details') {
        <app-motor-your-details-step [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('your-vehicle') {
        <app-motor-your-vehicle-step [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('additional-drivers') {
        <app-motor-additional-drivers-step [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('your-policy') {
        <app-motor-your-policy-step [initialValue]="currentStepInitialValue()" (saved)="onPolicySubmitted($event)" />
      }
      @case ('your-quotes') {
        <app-motor-your-quotes-step [payloadPretty]="payloadPretty()" [quotes]="quotes()" />
      }
      @default {
        <p>This step does not have a demo form yet.</p>
      }
    }
  `,
})
export class MotorQuoteJourneyComponent {
  readonly moduleCode = input.required<string>();

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly workflowService = inject(FormWorkflowService);

  readonly currentStepName = toSignal(
    this.route.paramMap.pipe(map(params => params.get('stepName')?.toLowerCase() ?? MOTOR_STEP_ORDER[0])),
    { initialValue: this.route.snapshot.paramMap.get('stepName')?.toLowerCase() ?? MOTOR_STEP_ORDER[0] },
  );

  readonly payload = computed(() => {
    const moduleCode = this.moduleCode();
    return {
      moduleCode,
      requestedAt: new Date().toISOString(),
      inputs: MOTOR_STEP_ORDER.filter((step) => step !== 'your-quotes').reduce<Record<string, unknown>>(
        (acc, step) => ({ ...acc, ...this.workflowService.getStepValue(this.stepKey(step)) }),
        {},
      ),
    };
  });

  readonly payloadPretty = computed(() => JSON.stringify(this.payload(), null, 2));
  readonly quotes = computed(() => DEMO_QUOTES);

  currentStepInitialValue(): Record<string, unknown> {
    const stepName = this.currentStepName();
    const saved = this.workflowService.getStepValue(this.stepKey(stepName));
    if (Object.keys(saved).length) {
      return saved;
    }

    return MOTOR_STEP_DEFAULT_VALUES[stepName] ?? {};
  }

  saveAndNext(value: Record<string, unknown>): void {
    const stepName = this.currentStepName();
    this.workflowService.setStepValue(this.stepKey(stepName), value);
    this.navigateToNext(stepName);
  }

  onPolicySubmitted(value: Record<string, unknown>): void {
    this.workflowService.setStepValue(this.stepKey('your-policy'), value);
    this.workflowService.setStepValue(this.stepKey('your-quotes'), {
      payload: this.payload(),
      quotes: DEMO_QUOTES,
    });

    void this.router.navigate(['/', this.moduleCode(), 'your-quotes']);
  }

  private stepKey(stepName: string): string {
    return `${this.moduleCode()}:${stepName}`;
  }

  private navigateToNext(stepName: string): void {
    const index = MOTOR_STEP_ORDER.indexOf(stepName as (typeof MOTOR_STEP_ORDER)[number]);
    const nextStep = index >= 0 ? MOTOR_STEP_ORDER[index + 1] : null;
    if (!nextStep) {
      return;
    }

    void this.router.navigate(['/', this.moduleCode(), nextStep]);
  }
}

@Component({
  selector: 'app-property-quote-journey',
  imports: [
    PropertyYourDetailsStepComponent,
    PropertyYourPropertyStepComponent,
    PropertyJointProposerStepComponent,
    PropertyYourPolicyStepComponent,
    PropertyAssumptionsStepComponent,
    PropertyYourQuotesStepComponent,
  ],
  template: `
    @switch (currentStepName()) {
      @case ('your-details') {
        <app-property-your-details-step [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('your-property') {
        <app-property-your-property-step [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('joint-proposer') {
        <app-property-joint-proposer-step [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('your-policy') {
        <app-property-your-policy-step [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('assumptions') {
        <app-property-assumptions-step [initialValue]="currentStepInitialValue()" (saved)="onAssumptionsSubmitted($event)" />
      }
      @case ('your-quotes') {
        <app-property-your-quotes-step [payloadPretty]="payloadPretty()" [quotes]="quotes()" />
      }
      @default {
        <p>This step does not have a demo form yet.</p>
      }
    }
  `,
})
export class PropertyQuoteJourneyComponent {
  readonly moduleCode = input.required<string>();

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly workflowService = inject(FormWorkflowService);

  readonly currentStepName = toSignal(
    this.route.paramMap.pipe(map(params => params.get('stepName')?.toLowerCase() ?? PROPERTY_STEP_ORDER[0])),
    { initialValue: this.route.snapshot.paramMap.get('stepName')?.toLowerCase() ?? PROPERTY_STEP_ORDER[0] },
  );

  readonly payload = computed(() => {
    const moduleCode = this.moduleCode();
    return {
      moduleCode,
      requestedAt: new Date().toISOString(),
      inputs: PROPERTY_STEP_ORDER.filter((step) => step !== 'your-quotes').reduce<Record<string, unknown>>(
        (acc, step) => ({ ...acc, ...this.workflowService.getStepValue(this.stepKey(step)) }),
        {},
      ),
    };
  });

  readonly payloadPretty = computed(() => JSON.stringify(this.payload(), null, 2));
  readonly quotes = computed(() => DEMO_QUOTES);

  currentStepInitialValue(): Record<string, unknown> {
    const stepName = this.currentStepName();
    const saved = this.workflowService.getStepValue(this.stepKey(stepName));
    if (Object.keys(saved).length) {
      return saved;
    }

    return PROPERTY_STEP_DEFAULT_VALUES[stepName] ?? {};
  }

  saveAndNext(value: Record<string, unknown>): void {
    const stepName = this.currentStepName();
    this.workflowService.setStepValue(this.stepKey(stepName), value);
    this.navigateToNext(stepName);
  }

  onAssumptionsSubmitted(value: Record<string, unknown>): void {
    this.workflowService.setStepValue(this.stepKey('assumptions'), value);
    this.workflowService.setStepValue(this.stepKey('your-quotes'), {
      payload: this.payload(),
      quotes: DEMO_QUOTES,
    });

    void this.router.navigate(['/', this.moduleCode(), 'your-quotes']);
  }

  private stepKey(stepName: string): string {
    return `${this.moduleCode()}:${stepName}`;
  }

  private navigateToNext(stepName: string): void {
    const index = PROPERTY_STEP_ORDER.indexOf(stepName as (typeof PROPERTY_STEP_ORDER)[number]);
    const nextStep = index >= 0 ? PROPERTY_STEP_ORDER[index + 1] : null;
    if (!nextStep) {
      return;
    }

    void this.router.navigate(['/', this.moduleCode(), nextStep]);
  }
}
