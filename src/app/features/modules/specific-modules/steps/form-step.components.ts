import { Component, ViewChild, computed, input, output } from '@angular/core';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form';
import {
  getMotorAdditionalDriversFields,
  getMotorYourPolicyFields,
  getMotorYourVehicleFields,
} from '../config/motor';
import {
  getPropertyAssumptionsFields,
  getPropertyJointProposerFields,
  getPropertyYourPolicyFields,
  getPropertyYourPropertyFields,
} from '../config/property';

@Component({
  selector: 'app-motor-your-vehicle-step',
  imports: [DynamicFormComponent],
  template: `
    <p class="module-code">Step: your-vehicle</p>
    <app-dynamic-form
      [fields]="fields()"
      [initialValue]="initialValue()"
      [showSubmitButton]="false"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class MotorYourVehicleStepComponent {
  readonly moduleCode = input.required<string>();
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = computed(() => getMotorYourVehicleFields(this.moduleCode()));

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
      [fields]="fields()"
      [initialValue]="initialValue()"
      [showSubmitButton]="false"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class MotorAdditionalDriversStepComponent {
  readonly moduleCode = input.required<string>();
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = computed(() => getMotorAdditionalDriversFields(this.moduleCode()));

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
      [fields]="fields()"
      [initialValue]="initialValue()"
      [showSubmitButton]="false"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class MotorYourPolicyStepComponent {
  readonly moduleCode = input.required<string>();
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = computed(() => getMotorYourPolicyFields(this.moduleCode()));

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
      [fields]="fields()"
      [initialValue]="initialValue()"
      [showSubmitButton]="false"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class PropertyYourPropertyStepComponent {
  readonly moduleCode = input.required<string>();
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = computed(() => getPropertyYourPropertyFields(this.moduleCode()));

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
      [fields]="fields()"
      [initialValue]="initialValue()"
      [showSubmitButton]="false"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class PropertyJointProposerStepComponent {
  readonly moduleCode = input.required<string>();
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = computed(() => getPropertyJointProposerFields(this.moduleCode()));

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
      [fields]="fields()"
      [initialValue]="initialValue()"
      [showSubmitButton]="false"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class PropertyYourPolicyStepComponent {
  readonly moduleCode = input.required<string>();
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = computed(() => getPropertyYourPolicyFields(this.moduleCode()));

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
      [fields]="fields()"
      [initialValue]="initialValue()"
      [showSubmitButton]="false"
      (submitted)="saved.emit($event)"
    />
  `,
})
export class PropertyAssumptionsStepComponent {
  readonly moduleCode = input.required<string>();
  readonly initialValue = input<Record<string, unknown>>({});
  readonly saved = output<Record<string, unknown>>();
  readonly fields = computed(() => getPropertyAssumptionsFields(this.moduleCode()));

  @ViewChild(DynamicFormComponent) private dynamicForm?: DynamicFormComponent;

  submitFromNavigation(): void {
    this.dynamicForm?.submitFromParent();
  }
}
