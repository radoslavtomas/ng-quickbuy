import { Component, ViewChild, input, output } from '@angular/core';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form';
import {
  MOTOR_ADDITIONAL_DRIVERS_FIELDS,
  MOTOR_YOUR_POLICY_FIELDS,
  MOTOR_YOUR_VEHICLE_FIELDS,
  PROPERTY_ASSUMPTIONS_FIELDS,
  PROPERTY_JOINT_PROPOSER_FIELDS,
  PROPERTY_YOUR_POLICY_FIELDS,
  PROPERTY_YOUR_PROPERTY_FIELDS,
} from '../config';

@Component({
  selector: 'app-motor-your-vehicle-step',
  imports: [DynamicFormComponent],
  template: `
    <p class="module-code">Step: your-vehicle</p>
    <app-dynamic-form
      [fields]="fields"
      [initialValue]="initialValue()"
      [showSubmitButton]="false"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class MotorYourVehicleStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = MOTOR_YOUR_VEHICLE_FIELDS;

  @ViewChild(DynamicFormComponent) private dynamicForm?: DynamicFormComponent;

  submitFromNavigation(): void {
    this.dynamicForm?.submitFromParent();
  }
}

@Component({
  selector: 'app-motor-additional-drivers-step',
  imports: [DynamicFormComponent],
  template: `
    <p class="module-code">Step: additional-drivers</p>
    <app-dynamic-form
      [fields]="fields"
      [initialValue]="initialValue()"
      [showSubmitButton]="false"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class MotorAdditionalDriversStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = MOTOR_ADDITIONAL_DRIVERS_FIELDS;

  @ViewChild(DynamicFormComponent) private dynamicForm?: DynamicFormComponent;

  submitFromNavigation(): void {
    this.dynamicForm?.submitFromParent();
  }
}

@Component({
  selector: 'app-motor-your-policy-step',
  imports: [DynamicFormComponent],
  template: `
    <p class="module-code">Step: your-policy</p>
    <app-dynamic-form
      [fields]="fields"
      [initialValue]="initialValue()"
      [showSubmitButton]="false"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class MotorYourPolicyStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = MOTOR_YOUR_POLICY_FIELDS;

  @ViewChild(DynamicFormComponent) private dynamicForm?: DynamicFormComponent;

  submitFromNavigation(): void {
    this.dynamicForm?.submitFromParent();
  }
}

@Component({
  selector: 'app-property-your-property-step',
  imports: [DynamicFormComponent],
  template: `
    <p class="module-code">Step: your-property</p>
    <app-dynamic-form
      [fields]="fields"
      [initialValue]="initialValue()"
      [showSubmitButton]="false"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class PropertyYourPropertyStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = PROPERTY_YOUR_PROPERTY_FIELDS;

  @ViewChild(DynamicFormComponent) private dynamicForm?: DynamicFormComponent;

  submitFromNavigation(): void {
    this.dynamicForm?.submitFromParent();
  }
}

@Component({
  selector: 'app-property-joint-proposer-step',
  imports: [DynamicFormComponent],
  template: `
    <p class="module-code">Step: joint-proposer</p>
    <app-dynamic-form
      [fields]="fields"
      [initialValue]="initialValue()"
      [showSubmitButton]="false"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class PropertyJointProposerStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = PROPERTY_JOINT_PROPOSER_FIELDS;

  @ViewChild(DynamicFormComponent) private dynamicForm?: DynamicFormComponent;

  submitFromNavigation(): void {
    this.dynamicForm?.submitFromParent();
  }
}

@Component({
  selector: 'app-property-your-policy-step',
  imports: [DynamicFormComponent],
  template: `
    <p class="module-code">Step: your-policy</p>
    <app-dynamic-form
      [fields]="fields"
      [initialValue]="initialValue()"
      [showSubmitButton]="false"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class PropertyYourPolicyStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = PROPERTY_YOUR_POLICY_FIELDS;

  @ViewChild(DynamicFormComponent) private dynamicForm?: DynamicFormComponent;

  submitFromNavigation(): void {
    this.dynamicForm?.submitFromParent();
  }
}

@Component({
  selector: 'app-property-assumptions-step',
  imports: [DynamicFormComponent],
  template: `
    <p class="module-code">Step: assumptions</p>
    <app-dynamic-form
      [fields]="fields"
      [initialValue]="initialValue()"
      [showSubmitButton]="false"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class PropertyAssumptionsStepComponent {
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = PROPERTY_ASSUMPTIONS_FIELDS;

  @ViewChild(DynamicFormComponent) private dynamicForm?: DynamicFormComponent;

  submitFromNavigation(): void {
    this.dynamicForm?.submitFromParent();
  }
}
