import type { FormFieldConfig } from '../../core/models/form-field.model';
import type { JourneyDefinition, JourneySection } from './models/journey.model';

function fieldsFor(section: JourneySection, moduleCode: string): readonly FormFieldConfig[] {
  if (section.kind === 'custom') {
    return [];
  }
  const provider = section.kind === 'fields' ? section.fields : section.itemFields;
  return typeof provider === 'function' ? provider(moduleCode) : provider;
}

/** Reject bad references before rendering, including dependencies on later pages. */
export function validateJourneyDependencies(journey: JourneyDefinition, moduleCode: string): void {
  const steps = journey.steps.map((step) => ({
    name: step.name,
    sections: step.sections.map((section) => ({
      id: section.id,
      kind: section.kind,
      fields: fieldsFor(section, moduleCode).filter((field) => field.type !== 'derived'),
    })),
  }));

  steps.forEach((step, stepIndex) => {
    for (const section of step.sections) {
      for (const field of section.fields) {
        for (const rule of field.validators ?? []) {
          if (rule.type !== 'cross-field') {
            continue;
          }
          for (const reference of Object.values(rule.dependencies)) {
            const local = typeof reference === 'string';
            const sourceIndex = local
              ? stepIndex
              : steps.findIndex((s) => s.name === reference.step);
            const source = local
              ? section
              : steps[sourceIndex]?.sections.find((s) => s.id === reference.section);
            const name = local ? reference : reference.field;

            if (
              sourceIndex < 0 ||
              sourceIndex > stepIndex ||
              !source ||
              (!local && source.kind !== 'fields') ||
              !source.fields.some((candidate) => candidate.name === name)
            ) {
              throw new Error(
                `Invalid dependency "${name}" for ${moduleCode}/${step.name}/${section.id}/${field.name} (${rule.name}).`,
              );
            }
          }
        }
      }
    }
  });
}
