import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import type { StepAnswers } from '../models/journey.model';

type SectionValues = Readonly<Record<string, unknown>>;
type ModuleAnswers = Readonly<Record<string, StepAnswers>>;

interface JourneyState {
  /** module code -> step name -> section id -> values */
  readonly answers: Readonly<Record<string, ModuleAnswers>>;
  /** module code -> step names the customer has completed */
  readonly completedSteps: Readonly<Record<string, readonly string[]>>;
}

/** What one module's journey looks like in storage. */
interface StoredModuleState {
  readonly answers: ModuleAnswers;
  readonly completedSteps: readonly string[];
}

const EMPTY_STATE: JourneyState = { answers: {}, completedSteps: {} };

const STORAGE_PREFIX = 'ngqb.journey.';

/**
 * Holds the answers captured for each journey.
 *
 * Answers are stored per module, per step, per section. Nothing is merged into a
 * single flat object, so two steps may legitimately use the same field name
 * without one silently overwriting the other — a real risk in the previous
 * implementation, where `declarationAccepted` existed in two different steps.
 *
 * State is mirrored into `sessionStorage`, keyed per module. Step-order gating
 * reads completion to decide which steps may be opened, so without this a reload
 * on step four would send a customer who had answered everything back to step
 * one. Same reasoning and the same defensive handling as `JourneySessionService`:
 * the tab keeps its progress, a new tab starts fresh, and storage being
 * unavailable costs resume but never breaks the journey.
 */
@Injectable({ providedIn: 'root' })
export class JourneyStateService {
  private readonly document = inject(DOCUMENT);
  private readonly state = signal<JourneyState>(this.readStored());

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

    this.state.update((current) => {
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

    this.persist(module);
  }

  isStepComplete(moduleCode: string, stepName: string): boolean {
    return (this.state().completedSteps[this.key(moduleCode)] ?? []).includes(stepName);
  }

  /** Every step this module has completed, for progress display and gating. */
  completedSteps(moduleCode: string): readonly string[] {
    return this.state().completedSteps[this.key(moduleCode)] ?? [];
  }

  markStepComplete(moduleCode: string, stepName: string): void {
    const module = this.key(moduleCode);

    this.state.update((current) => {
      const completed = current.completedSteps[module] ?? [];
      if (completed.includes(stepName)) {
        return current;
      }

      return {
        ...current,
        completedSteps: { ...current.completedSteps, [module]: [...completed, stepName] },
      };
    });

    this.persist(module);
  }

  /** Clears one journey, for example when the customer switches product. */
  resetModule(moduleCode: string): void {
    const module = this.key(moduleCode);

    this.state.update((current) => {
      const answers = { ...current.answers };
      const completedSteps = { ...current.completedSteps };
      delete answers[module];
      delete completedSteps[module];
      return { answers, completedSteps };
    });

    this.storage()?.removeItem(STORAGE_PREFIX + module);
  }

  resetAll(): void {
    this.state.set(EMPTY_STATE);

    const storage = this.storage();
    if (!storage) {
      return;
    }

    for (const key of this.storedKeys(storage)) {
      storage.removeItem(key);
    }
  }

  /** Writes one module's slice, so two journeys cannot overwrite each other. */
  private persist(module: string): void {
    const storage = this.storage();
    if (!storage) {
      return;
    }

    const current = this.state();
    const stored: StoredModuleState = {
      answers: current.answers[module] ?? {},
      completedSteps: current.completedSteps[module] ?? [],
    };

    try {
      storage.setItem(STORAGE_PREFIX + module, JSON.stringify(stored));
    } catch {
      // Storage can be unavailable or full (private browsing, quota). The journey
      // still works for this page view; only resume-after-reload is lost.
    }
  }

  private readStored(): JourneyState {
    const storage = this.storage();
    if (!storage) {
      return EMPTY_STATE;
    }

    const answers: Record<string, ModuleAnswers> = {};
    const completedSteps: Record<string, readonly string[]> = {};

    for (const key of this.storedKeys(storage)) {
      const stored = this.parse(storage.getItem(key));
      if (!stored) {
        continue;
      }

      const module = key.slice(STORAGE_PREFIX.length);
      answers[module] = stored.answers;
      completedSteps[module] = stored.completedSteps;
    }

    return { answers, completedSteps };
  }

  /**
   * Reads one stored module, rejecting anything that is not the shape we wrote.
   *
   * Storage is editable by hand and survives a deployment, so stale or tampered
   * data must not be what decides which steps a customer may open.
   */
  private parse(raw: string | null): StoredModuleState | null {
    if (!raw) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!this.isRecord(parsed)) {
        return null;
      }

      const answers = this.isRecord(parsed['answers'])
        ? (parsed['answers'] as ModuleAnswers)
        : null;
      const completedSteps = Array.isArray(parsed['completedSteps'])
        ? parsed['completedSteps'].filter((step): step is string => typeof step === 'string')
        : null;

      return answers && completedSteps ? { answers, completedSteps } : null;
    } catch {
      return null;
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private storedKeys(storage: Storage): readonly string[] {
    const keys: string[] = [];

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keys.push(key);
      }
    }

    return keys;
  }

  private storage(): Storage | null {
    try {
      return this.document.defaultView?.sessionStorage ?? null;
    } catch {
      return null;
    }
  }

  private key(moduleCode: string): string {
    return moduleCode.toUpperCase();
  }
}
