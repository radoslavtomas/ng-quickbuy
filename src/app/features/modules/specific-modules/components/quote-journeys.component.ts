import { Component, ViewChild, computed, inject, input } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { FormWorkflowService } from '../../../../core/services/form-workflow.service';
import { StepNavigationService } from '../../../../core/services/step-navigation.service';
import {
  DEMO_QUOTES,
} from '../config/shared/common';
import { MOTOR_STEP_ORDER, getMotorStepDefaultValues } from '../config/motor';
import { PROPERTY_STEP_ORDER, getPropertyStepDefaultValues } from '../config/property';
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
        <app-motor-your-details-step [moduleCode]="moduleCode()" [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('your-vehicle') {
        <app-motor-your-vehicle-step [moduleCode]="moduleCode()" [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('additional-drivers') {
        <app-motor-additional-drivers-step [moduleCode]="moduleCode()" [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('your-policy') {
        <app-motor-your-policy-step [moduleCode]="moduleCode()" [initialValue]="currentStepInitialValue()" (saved)="onPolicySubmitted($event)" />
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
  private readonly stepNavigationService = inject(StepNavigationService);

  @ViewChild(MotorYourDetailsStepComponent) private motorYourDetailsStep?: MotorYourDetailsStepComponent;
  @ViewChild(MotorYourVehicleStepComponent) private motorYourVehicleStep?: MotorYourVehicleStepComponent;
  @ViewChild(MotorAdditionalDriversStepComponent) private motorAdditionalDriversStep?: MotorAdditionalDriversStepComponent;
  @ViewChild(MotorYourPolicyStepComponent) private motorYourPolicyStep?: MotorYourPolicyStepComponent;

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

  constructor() {
    this.stepNavigationService.submitNext$
      .pipe(takeUntilDestroyed())
      .subscribe((request) => {
        if (request.moduleCode !== this.moduleCode() || request.stepName !== this.currentStepName()) {
          return;
        }

        this.submitCurrentStep();
      });
  }

  currentStepInitialValue(): Record<string, unknown> {
    const stepName = this.currentStepName();
    const saved = this.workflowService.getStepValue(this.stepKey(stepName));
    if (Object.keys(saved).length) {
      return saved;
    }

    return getMotorStepDefaultValues(this.moduleCode())[stepName] ?? {};
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

  private submitCurrentStep(): void {
    switch (this.currentStepName()) {
      case 'your-details':
        this.motorYourDetailsStep?.submitFromNavigation();
        break;
      case 'your-vehicle':
        this.motorYourVehicleStep?.submitFromNavigation();
        break;
      case 'additional-drivers':
        this.motorAdditionalDriversStep?.submitFromNavigation();
        break;
      case 'your-policy':
        this.motorYourPolicyStep?.submitFromNavigation();
        break;
      default:
        break;
    }
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
        <app-property-your-details-step [moduleCode]="moduleCode()" [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('your-property') {
        <app-property-your-property-step [moduleCode]="moduleCode()" [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('joint-proposer') {
        <app-property-joint-proposer-step [moduleCode]="moduleCode()" [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('your-policy') {
        <app-property-your-policy-step [moduleCode]="moduleCode()" [initialValue]="currentStepInitialValue()" (saved)="saveAndNext($event)" />
      }
      @case ('assumptions') {
        <app-property-assumptions-step [moduleCode]="moduleCode()" [initialValue]="currentStepInitialValue()" (saved)="onAssumptionsSubmitted($event)" />
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
  private readonly stepNavigationService = inject(StepNavigationService);

  @ViewChild(PropertyYourDetailsStepComponent) private propertyYourDetailsStep?: PropertyYourDetailsStepComponent;
  @ViewChild(PropertyYourPropertyStepComponent) private propertyYourPropertyStep?: PropertyYourPropertyStepComponent;
  @ViewChild(PropertyJointProposerStepComponent) private propertyJointProposerStep?: PropertyJointProposerStepComponent;
  @ViewChild(PropertyYourPolicyStepComponent) private propertyYourPolicyStep?: PropertyYourPolicyStepComponent;
  @ViewChild(PropertyAssumptionsStepComponent) private propertyAssumptionsStep?: PropertyAssumptionsStepComponent;

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

  constructor() {
    this.stepNavigationService.submitNext$
      .pipe(takeUntilDestroyed())
      .subscribe((request) => {
        if (request.moduleCode !== this.moduleCode() || request.stepName !== this.currentStepName()) {
          return;
        }

        this.submitCurrentStep();
      });
  }

  currentStepInitialValue(): Record<string, unknown> {
    const stepName = this.currentStepName();
    const saved = this.workflowService.getStepValue(this.stepKey(stepName));
    if (Object.keys(saved).length) {
      return saved;
    }

    return getPropertyStepDefaultValues(this.moduleCode())[stepName] ?? {};
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

  private submitCurrentStep(): void {
    switch (this.currentStepName()) {
      case 'your-details':
        this.propertyYourDetailsStep?.submitFromNavigation();
        break;
      case 'your-property':
        this.propertyYourPropertyStep?.submitFromNavigation();
        break;
      case 'joint-proposer':
        this.propertyJointProposerStep?.submitFromNavigation();
        break;
      case 'your-policy':
        this.propertyYourPolicyStep?.submitFromNavigation();
        break;
      case 'assumptions':
        this.propertyAssumptionsStep?.submitFromNavigation();
        break;
      default:
        break;
    }
  }
}
