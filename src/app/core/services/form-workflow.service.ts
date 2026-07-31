import { Injectable, computed, signal } from '@angular/core';

export interface ServerValidationError {
  field?: string;
  message: string;
  code?: string;
}

export interface ServerValidationPayload {
  errors: readonly ServerValidationError[];
}

@Injectable({ providedIn: 'root' })
export class FormWorkflowService {
  private readonly stepValuesState = signal<Record<string, Record<string, unknown>>>({});
  private readonly serverErrorsState = signal<Record<string, string[]>>({});

  readonly journeyValue = computed(() => {
    const values = this.stepValuesState();
    return Object.values(values).reduce<Record<string, unknown>>((acc, current) => {
      return { ...acc, ...current };
    }, {});
  });

  readonly serverErrors = computed(() => this.serverErrorsState());

  setStepValue(stepKey: string, value: Record<string, unknown>): void {
    this.stepValuesState.update((current) => ({
      ...current,
      [stepKey]: value,
    }));
  }

  setJourneyStepValues(
    moduleCode: string,
    stepValuesByStepName: Readonly<Record<string, Record<string, unknown>>>,
    mergeWithExisting = true,
  ): void {
    const normalizedModuleCode = moduleCode.toUpperCase();
    this.stepValuesState.update((current) => {
      const next = { ...current };

      for (const [stepName, value] of Object.entries(stepValuesByStepName)) {
        const stepKey = `${normalizedModuleCode}:${stepName}`;
        const existing = current[stepKey] ?? {};
        next[stepKey] = mergeWithExisting ? { ...existing, ...value } : value;
      }

      return next;
    });
  }

  getStepValue(stepKey: string): Record<string, unknown> {
    return this.stepValuesState()[stepKey] ?? {};
  }

  clearStep(stepKey: string): void {
    this.stepValuesState.update((current) => {
      const next = { ...current };
      delete next[stepKey];
      return next;
    });
  }

  clearAll(): void {
    this.stepValuesState.set({});
    this.serverErrorsState.set({});
  }

  mapServerErrors(payload: ServerValidationPayload): void {
    const mapped = payload.errors.reduce<Record<string, string[]>>((acc, error) => {
      const key = error.field?.trim() || '_summary';
      const existing = acc[key] ?? [];
      return {
        ...acc,
        [key]: [...existing, error.message],
      };
    }, {});

    this.serverErrorsState.set(mapped);
  }

  clearServerErrors(): void {
    this.serverErrorsState.set({});
  }
}
