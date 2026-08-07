import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, untracked, viewChild } from '@angular/core';
import type { JourneySection } from '../../../core/models/journey.model';
import { JourneyStateService } from '../../../core/services/journey-state.service';
import { SignalFormComponent } from '../../../shared/components/signal-form/signal-form';
import { StepCardComponent } from '../../../shared/components/step-card/step-card';
import { AddressSectionComponent } from './sections/address-section.component';
import { OccupationSectionComponent } from './sections/occupation-section.component';
import { QuoteResultsSectionComponent } from './sections/quote-results-section.component';
import { RepeatSectionComponent } from './sections/repeat-section.component';

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
    SignalFormComponent,
    AddressSectionComponent,
    OccupationSectionComponent,
    QuoteResultsSectionComponent,
    RepeatSectionComponent,
  ],
  template: `
    <ng-template #body>
      @switch (section().kind) {
        @case ('fields') {
          <app-signal-form
            [fields]="fields()"
            [initialValue]="initialValue()"
            (valueChanged)="onValueChanged($event)"
          />
        }
        @case ('repeat') {
          <app-repeat-section
            [section]="repeatSection()"
            [moduleCode]="moduleCode()"
            [stepName]="stepName()"
          />
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
            @case ('occupation') {
              <app-occupation-section
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
  private readonly signalForm = viewChild(SignalFormComponent);
  private readonly addressSection = viewChild(AddressSectionComponent);
  private readonly occupationSection = viewChild(OccupationSectionComponent);
  private readonly quoteResults = viewChild(QuoteResultsSectionComponent);
  private readonly repeatSectionComponent = viewChild(RepeatSectionComponent);

  /** Narrowed view of the section for the repeat renderer's required input. */
  readonly repeatSection = computed(() => {
    const section = this.section();
    if (section.kind !== 'repeat') {
      throw new Error(`Section "${section.id}" is not a repeat section.`);
    }

    return section;
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
      return this.signalForm()?.collect() ?? { valid: true, values: {} };
    }

    if (section.kind === 'repeat') {
      return this.repeatSectionComponent()?.collect() ?? { valid: true, values: {} };
    }

    return this.addressSection()?.collect() ?? this.occupationSection()?.collect() ?? this.quoteResults()?.collect() ?? { valid: true, values: {} };
  }
}
