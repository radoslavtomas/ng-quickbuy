import { Injectable, signal } from '@angular/core';
import type { StepAnswers } from '../models/journey.model';

type SectionValues = Readonly<Record<string, unknown>>;
type ModuleAnswers = Readonly<Record<string, StepAnswers>>;

interface JourneyState {
  /** module code -> step name -> section id -> values */
  readonly answers: Readonly<Record<string, ModuleAnswers>>;
  /** module code -> step names the customer has completed */
  readonly completedSteps: Readonly<Record<string, readonly string[]>>;
}

const EMPTY_STATE: JourneyState = { answers: {}, completedSteps: {} };

/**
 * Holds the answers captured for each journey.
 *
 * Answers are stored per module, per step, per section. Nothing is merged into a
 * single flat object, so two steps may legitimately use the same field name
 * without one silently overwriting the other — a real risk in the previous
 * implementation, where `declarationAccepted` existed in two different steps.
 */
@Injectable({ providedIn: 'root' })
export class JourneyStateService {
  private readonly state = signal<JourneyState>(EMPTY_STATE);

  /** All answers for one module, keyed by step then section. */
  moduleAnswers(moduleCode: string): ModuleAnswers {
    return this.state().answers[this.key(moduleCode)] ?? {};
  }

  /** Answers for one step, keyed by section id. */
  stepAnswers(moduleCode: string, stepName: string): StepAnswers {
    return this.moduleAnswers(moduleCode)[stepName] ?? {};
  }

  sectionAnswers(moduleCode: string, stepName: string, sectionId: string): SectionValues {
    return this.stepAnswers(moduleCode, stepName)[sectionId] ?? {};
  }

  setSectionAnswers(
    moduleCode: string,
    stepName: string,
    sectionId: string,
    values: SectionValues,
  ): void {
    const module = this.key(moduleCode);

    this.state.update(current => {
      const moduleState = current.answers[module] ?? {};
      const stepState = moduleState[stepName] ?? {};

      return {
        ...current,
        answers: {
          ...current.answers,
          [module]: {
            ...moduleState,
            [stepName]: { ...stepState, [sectionId]: { ...values } },
          },
        },
      };
    });
  }

  isStepComplete(moduleCode: string, stepName: string): boolean {
    return (this.state().completedSteps[this.key(moduleCode)] ?? []).includes(stepName);
  }

  markStepComplete(moduleCode: string, stepName: string): void {
    const module = this.key(moduleCode);

    this.state.update(current => {
      const completed = current.completedSteps[module] ?? [];
      if (completed.includes(stepName)) {
        return current;
      }

      return {
        ...current,
        completedSteps: { ...current.completedSteps, [module]: [...completed, stepName] },
      };
    });
  }

  /** Clears one journey, for example when the customer switches product. */
  resetModule(moduleCode: string): void {
    const module = this.key(moduleCode);

    this.state.update(current => {
      const answers = { ...current.answers };
      const completedSteps = { ...current.completedSteps };
      delete answers[module];
      delete completedSteps[module];
      return { answers, completedSteps };
    });
  }

  resetAll(): void {
    this.state.set(EMPTY_STATE);
  }

  private key(moduleCode: string): string {
    return moduleCode.toUpperCase();
  }
}
