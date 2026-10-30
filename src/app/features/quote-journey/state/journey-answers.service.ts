import { Service, inject } from '@angular/core';
import type { AnswerReader } from '../../../core/models/form-field.model';
import type { StepAnswers } from '../models/journey.model';
import { JourneyStateService } from './journey-state.service';
import { getJourneyForModule } from '../journey-registry';

/**
 * Journey-aware write boundary. Core state owns storage, while this layer supplies
 * ordering and module validation without making core import feature definitions.
 */
@Service()
export class JourneyAnswersService {
  private readonly state = inject(JourneyStateService);

  reader(moduleCode: string): AnswerReader {
    this.stepsFor(moduleCode);
    return (reference) =>
      this.state.sectionAnswers(moduleCode, reference.step, reference.section)[reference.field];
  }

  setSectionAnswers(
    moduleCode: string,
    stepName: string,
    sectionId: string,
    values: Readonly<Record<string, unknown>>,
  ): void {
    this.setStepAnswers(moduleCode, stepName, { [sectionId]: values });
  }

  setStepAnswers(moduleCode: string, stepName: string, sections: StepAnswers): void {
    this.setAnswers(moduleCode, { [stepName]: sections });
  }

  setAnswers(moduleCode: string, answers: Readonly<Record<string, StepAnswers>>): void {
    const steps = this.stepsFor(moduleCode);
    for (const [name, sections] of Object.entries(answers)) {
      const step = steps.find((candidate) => candidate.name === name);
      if (!step || Object.keys(sections).some((id) => !step.sections.some((s) => s.id === id))) {
        throw new Error(`Unknown step or section in answers for ${moduleCode}/${name}.`);
      }
    }
    this.state.setAnswers(
      moduleCode,
      answers,
      steps.map((step) => step.name),
    );
  }

  private stepsFor(moduleCode: string) {
    const journey = getJourneyForModule(moduleCode);
    if (!journey) {
      throw new Error(`Unknown module "${moduleCode}".`);
    }
    return journey.steps;
  }
}
