import { Component, ViewChild, computed, input, output } from '@angular/core';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form';
import { StepCardComponent } from '../../../../shared/components/step-card/step-card';
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
  imports: [DynamicFormComponent, StepCardComponent],
  template: `
    <div class="space-y-4">
      <app-step-card title="Your vehicle">
        <div class="space-y-1">
          <label for="mv-reg" class="block text-sm font-medium text-gray-700">Vehicle registration</label>
          <input
            type="text"
            id="mv-reg"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="e.g. AB12 CDE"
          />
        </div>
      </app-step-card>

      <app-step-card title="Vehicle details">
        <app-dynamic-form
          [fields]="fields()"
          [initialValue]="initialValue()"
          [showSubmitButton]="false"
          (submitted)="saved.emit($event)"
        />
      </app-step-card>

      <app-step-card title="Vehicle security">
        <div class="space-y-1">
          <label for="mv-security" class="block text-sm font-medium text-gray-700">Security device fitted</label>
          <select
            id="mv-security"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">Please select…</option>
            <option>Manufacturer fitted alarm</option>
            <option>Aftermarket alarm</option>
            <option>Immobiliser</option>
            <option>Tracker</option>
            <option>None</option>
          </select>
        </div>
      </app-step-card>

      <app-step-card title="Vehicle address">
        <div class="space-y-1">
          <label for="mv-kept-postcode" class="block text-sm font-medium text-gray-700">Postcode where vehicle is kept overnight</label>
          <input
            type="text"
            id="mv-kept-postcode"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="e.g. M1 1AA"
          />
        </div>
      </app-step-card>

      <app-step-card title="Additional drivers">
        <fieldset>
          <legend class="mb-2 block text-sm font-medium text-gray-700">Are there any additional drivers?</legend>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="mv-additional-drivers" class="h-4 w-4 border-gray-300" value="yes" /> Yes
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="mv-additional-drivers" class="h-4 w-4 border-gray-300" value="no" /> No
            </label>
          </div>
        </fieldset>
      </app-step-card>
    </div>
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
  imports: [DynamicFormComponent, StepCardComponent],
  template: `
    <div class="space-y-4">
      <app-step-card title="Additional driver details">
        <app-dynamic-form
          [fields]="fields()"
          [initialValue]="initialValue()"
          [showSubmitButton]="false"
          (submitted)="saved.emit($event)"
        />
      </app-step-card>
    </div>
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
  imports: [DynamicFormComponent, StepCardComponent],
  template: `
    <div class="space-y-4">
      <app-step-card title="Proposed policy details">
        <div class="space-y-1">
          <label for="mp-start-date" class="block text-sm font-medium text-gray-700">Proposed start date</label>
          <input
            type="date"
            id="mp-start-date"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </app-step-card>

      <app-step-card title="Previous policy details">
        <app-dynamic-form
          [fields]="fields()"
          [initialValue]="initialValue()"
          [showSubmitButton]="false"
          (submitted)="saved.emit($event)"
        />
      </app-step-card>

      <app-step-card title="Has any person named on this application…">
        <fieldset>
          <legend class="mb-2 block text-sm font-medium text-gray-700">
            …had any motoring convictions or endorsements in the last 5 years?
          </legend>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="mp-convictions" class="h-4 w-4 border-gray-300" value="yes" /> Yes
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="mp-convictions" class="h-4 w-4 border-gray-300" value="no" /> No
            </label>
          </div>
        </fieldset>
      </app-step-card>

      <app-step-card title="Does any person named on this application…">
        <fieldset>
          <legend class="mb-2 block text-sm font-medium text-gray-700">
            …have any medical conditions or disabilities that must be declared to the DVLA?
          </legend>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="mp-medical" class="h-4 w-4 border-gray-300" value="yes" /> Yes
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="mp-medical" class="h-4 w-4 border-gray-300" value="no" /> No
            </label>
          </div>
        </fieldset>
      </app-step-card>

      <app-step-card title="Contact preferences">
        <div class="space-y-2">
          <p class="text-sm font-medium text-gray-700">How would you like to be contacted?</p>
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" class="h-4 w-4 rounded border-gray-300" /> Email
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" class="h-4 w-4 rounded border-gray-300" /> Phone
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" class="h-4 w-4 rounded border-gray-300" /> Post
          </label>
        </div>
      </app-step-card>
    </div>
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
  imports: [DynamicFormComponent, StepCardComponent],
  template: `
    <div class="space-y-4">
      <app-step-card title="Property details">
        <app-dynamic-form
          [fields]="fields()"
          [initialValue]="initialValue()"
          [showSubmitButton]="false"
          (submitted)="saved.emit($event)"
        />
      </app-step-card>

      <app-step-card title="Property security">
        <div class="space-y-1">
          <label for="pp-locks" class="block text-sm font-medium text-gray-700">Type of door locks</label>
          <select
            id="pp-locks"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">Please select…</option>
            <option>Mortice deadlock (5 lever)</option>
            <option>Rim deadlock</option>
            <option>Multipoint locking system</option>
            <option>Other</option>
          </select>
        </div>
        <div class="space-y-1">
          <label for="pp-alarm" class="block text-sm font-medium text-gray-700">Burglar alarm</label>
          <select
            id="pp-alarm"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">Please select…</option>
            <option>None</option>
            <option>Audible only</option>
            <option>Monitored / linked to alarm company</option>
          </select>
        </div>
      </app-step-card>

      <app-step-card title="Property ownership &amp; occupancy">
        <fieldset>
          <legend class="mb-2 block text-sm font-medium text-gray-700">What is your relationship to the property?</legend>
          <div class="flex flex-col gap-2">
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="pp-ownership" class="h-4 w-4 border-gray-300" value="owner-occupier" /> Owner occupier
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="pp-ownership" class="h-4 w-4 border-gray-300" value="landlord" /> Landlord
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="pp-ownership" class="h-4 w-4 border-gray-300" value="tenant" /> Tenant
            </label>
          </div>
        </fieldset>
      </app-step-card>

      <app-step-card title="Joint proposer">
        <fieldset>
          <legend class="mb-2 block text-sm font-medium text-gray-700">Is there a joint proposer on this policy?</legend>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="pp-joint-proposer" class="h-4 w-4 border-gray-300" value="yes" /> Yes
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="pp-joint-proposer" class="h-4 w-4 border-gray-300" value="no" /> No
            </label>
          </div>
        </fieldset>
      </app-step-card>
    </div>
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
  imports: [DynamicFormComponent, StepCardComponent],
  template: `
    <div class="space-y-4">
      <app-step-card title="Joint proposer details">
        <app-dynamic-form
          [fields]="fields()"
          [initialValue]="initialValue()"
          [showSubmitButton]="false"
          (submitted)="saved.emit($event)"
        />
      </app-step-card>
    </div>
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
  imports: [DynamicFormComponent, StepCardComponent],
  template: `
    <div class="space-y-4">
      <app-step-card title="Policy start">
        <div class="space-y-1">
          <label for="prop-pol-start" class="block text-sm font-medium text-gray-700">Proposed start date</label>
          <input
            type="date"
            id="prop-pol-start"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </app-step-card>

      <app-step-card title="Previous policy details">
        <app-dynamic-form
          [fields]="fields()"
          [initialValue]="initialValue()"
          [showSubmitButton]="false"
          (submitted)="saved.emit($event)"
        />
      </app-step-card>

      <app-step-card title="Has anyone named on this application or living in the property…">
        <fieldset>
          <legend class="mb-2 block text-sm font-medium text-gray-700">
            …made any claims or losses in the last 5 years?
          </legend>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="prop-pol-claims" class="h-4 w-4 border-gray-300" value="yes" /> Yes
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="prop-pol-claims" class="h-4 w-4 border-gray-300" value="no" /> No
            </label>
          </div>
        </fieldset>
      </app-step-card>
    </div>
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
  imports: [DynamicFormComponent, StepCardComponent],
  template: `
    <div class="space-y-4">
      <app-step-card title="Has anybody named on this application or living in the property…">
        <app-dynamic-form
          [fields]="fields()"
          [initialValue]="initialValue()"
          [showSubmitButton]="false"
          (submitted)="saved.emit($event)"
        />
      </app-step-card>

      <app-step-card title="Property flooding &amp; subsidence history">
        <fieldset>
          <legend class="mb-2 block text-sm font-medium text-gray-700">
            Has the property ever been flooded or suffered from subsidence?
          </legend>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="pa-flooding" class="h-4 w-4 border-gray-300" value="yes" /> Yes
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="pa-flooding" class="h-4 w-4 border-gray-300" value="no" /> No
            </label>
          </div>
        </fieldset>
      </app-step-card>

      <app-step-card title="Property condition and building works">
        <fieldset>
          <legend class="mb-2 block text-sm font-medium text-gray-700">
            Are there any current or planned building works at the property?
          </legend>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="pa-building-works" class="h-4 w-4 border-gray-300" value="yes" /> Yes
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="radio" name="pa-building-works" class="h-4 w-4 border-gray-300" value="no" /> No
            </label>
          </div>
        </fieldset>
        <div class="space-y-1">
          <label for="pa-build-year" class="block text-sm font-medium text-gray-700">Year property was built</label>
          <input
            type="number"
            id="pa-build-year"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="e.g. 1985"
            min="1600"
            max="2100"
          />
        </div>
      </app-step-card>

      <app-step-card title="Contact preferences">
        <div class="space-y-2">
          <p class="text-sm font-medium text-gray-700">How would you like to be contacted?</p>
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" class="h-4 w-4 rounded border-gray-300" /> Email
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" class="h-4 w-4 rounded border-gray-300" /> Phone
          </label>
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" class="h-4 w-4 rounded border-gray-300" /> Post
          </label>
        </div>
      </app-step-card>
    </div>
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
