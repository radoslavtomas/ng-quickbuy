import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, untracked, viewChild } from '@angular/core';
import type { JourneySection } from '../../../core/models/journey.model';
import { JourneyStateService } from '../../../core/services/journey-state.service';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form';
import { SignalFormComponent } from '../../../shared/components/signal-form/signal-form';
import { StepCardComponent } from '../../../shared/components/step-card/step-card';
import { AddressSectionComponent } from './sections/address-section.component';
import { QuoteResultsSectionComponent } from './sections/quote-results-section.component';

/** What the journey shell needs back from a section when the customer continues. */
export interface SectionResult {
  readonly valid: boolean;
  readonly values: Record<string, unknown>;
}

/**
 * Renders one journey section.
 *
 * This component is the registry of custom section renderers: a `fields` section is
 * handled by the generic form renderer, and a `custom` section is matched by its
 * `component` key below. Adding a bespoke section means adding one component and
 * one `@case` here — no per-module or per-step components.
 */
@Component({
  selector: 'app-section-outlet',
  imports: [
    NgTemplateOutlet,
    StepCardComponent,
    DynamicFormComponent,
    SignalFormComponent,
    AddressSectionComponent,
    QuoteResultsSectionComponent,
  ],
  template: `
    <ng-template #body>
      @switch (section().kind) {
        @case ('fields') {
          @if (usesSignalForms()) {
            <app-signal-form
              [fields]="fields()"
              [initialValue]="initialValue()"
              (valueChanged)="onValueChanged($event)"
            />
          } @else {
            <app-dynamic-form
              [fields]="fields()"
              [initialValue]="initialValue()"
              [showSubmitButton]="false"
              (valueChanged)="onValueChanged($event)"
            />
          }
        }
        @case ('custom') {
          @switch (customComponent()) {
            @case ('address-lookup') {
              <app-address-section
                [moduleCode]="moduleCode()"
                [stepName]="stepName()"
                [sectionId]="section().id"
              />
            }
            @case ('quote-results') {
              <app-quote-results-section
                [moduleCode]="moduleCode()"
                [stepName]="stepName()"
                [sectionId]="section().id"
              />
            }
            @default {
              <p class="text-sm text-red-700">
                No renderer is registered for section "{{ customComponent() }}".
              </p>
            }
          }
        }
      }
    </ng-template>

    @if (section().title; as title) {
      <app-step-card [title]="title">
        <ng-container [ngTemplateOutlet]="body" />
      </app-step-card>
    } @else {
      <ng-container [ngTemplateOutlet]="body" />
    }
  `,
})
export class SectionOutletComponent {
  readonly section = input.required<JourneySection>();
  readonly moduleCode = input.required<string>();
  readonly stepName = input.required<string>();

  private readonly journeyState = inject(JourneyStateService);
  private readonly dynamicForm = viewChild(DynamicFormComponent);
  private readonly signalForm = viewChild(SignalFormComponent);
  private readonly addressSection = viewChild(AddressSectionComponent);
  private readonly quoteResults = viewChild(QuoteResultsSectionComponent);

  /** True for sections already migrated to the Signal Forms renderer. */
  readonly usesSignalForms = computed(() => {
    const section = this.section();
    return section.kind === 'fields' && section.engine === 'signal';
  });

  readonly fields = computed(() => {
    const section = this.section();
    return section.kind === 'fields' ? section.fields : [];
  });

  readonly customComponent = computed(() => {
    const section = this.section();
    return section.kind === 'custom' ? section.component : '';
  });

  /**
   * Seed value for the form: previously captured answers, otherwise the section
   * defaults. Read untracked on purpose — the renderer rebuilds its controls when
   * this input changes, so making it reactive to its own writes would reset the
   * form on every keystroke.
   */
  readonly initialValue = computed<Record<string, unknown>>(() => {
    const section = this.section();
    const moduleCode = this.moduleCode();
    const stepName = this.stepName();

    const stored = untracked(() =>
      this.journeyState.sectionAnswers(moduleCode, stepName, section.id),
    );
    if (Object.keys(stored).length > 0) {
      return { ...stored };
    }

    return section.kind === 'fields' ? { ...(section.defaults ?? {}) } : {};
  });

  onValueChanged(values: Record<string, unknown>): void {
    this.journeyState.setSectionAnswers(
      this.moduleCode(),
      this.stepName(),
      this.section().id,
      values,
    );
  }

  /** Validates this section and returns the values the shell should persist. */
  collect(): SectionResult {
    const section = this.section();

    if (section.kind === 'fields') {
      const signalForm = this.signalForm();
      if (signalForm) {
        return signalForm.collect();
      }

      const form = this.dynamicForm();
      if (!form) {
        return { valid: true, values: {} };
      }

      return { valid: form.validateFromParent(), values: form.form.getRawValue() };
    }

    return this.addressSection()?.collect() ?? this.quoteResults()?.collect() ?? { valid: true, values: {} };
  }
}
