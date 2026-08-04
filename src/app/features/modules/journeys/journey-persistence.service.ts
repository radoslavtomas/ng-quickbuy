import { Injectable, inject } from '@angular/core';
import type { JourneyStepDefinition } from '../../../core/models/journey.model';
import { ClockService } from '../../../core/services/clock.service';
import { JourneySessionService } from '../../../core/services/journey-session.service';
import { JourneyStateService } from '../../../core/services/journey-state.service';
import { ModuleContextService } from '../../../core/services/module-context.service';
import {
  type PartialStoreRequest,
  QuotePartialStoreService,
} from '../../../core/services/quote-partial-store.service';
import { getFirstStep, getJourneyForModule, getQuestionSteps } from './journey-registry';

/** Backend key for the policy start date, required on every store call. */
const INCEPTION_DATE_KEY = 'policy-inceptiondate';

/**
 * Keeps the server-side partial quote in step with the journey.
 *
 * Two calls, one endpoint. `ensureCreated` runs once when the customer enters a
 * journey and yields the quote reference; `recordStep` sends the accumulated
 * answers after each completed step, including that reference so the backend
 * updates the same partial rather than creating another.
 *
 * Nothing here is allowed to interrupt the customer: every failure is logged and
 * swallowed, and a failed create is retried on the next completed step.
 */
@Injectable({ providedIn: 'root' })
export class JourneyPersistenceService {
  private readonly session = inject(JourneySessionService);
  private readonly journeyState = inject(JourneyStateService);
  private readonly moduleContext = inject(ModuleContextService);
  private readonly partialStore = inject(QuotePartialStoreService);
  private readonly clock = inject(ClockService);

  /** Guards against two concurrent creates for the same journey. */
  private readonly creating = new Map<string, Promise<string | null>>();

  /**
   * Creates the partial quote for a journey if it does not have one yet.
   *
   * Deliberately ordered after the module parameters load, because those say
   * whether partial storing is enabled at all for this brand and product.
   */
  async ensureCreated(moduleCode: string): Promise<string | null> {
    const key = moduleCode.toUpperCase();
    const existingReference = this.session.reference(key);
    if (existingReference) {
      return existingReference;
    }

    const inFlight = this.creating.get(key);
    if (inFlight) {
      return inFlight;
    }

    const request = this.create(key);
    this.creating.set(key, request);
    return request;
  }

  /** Sends the journey's answers after a step has been completed. */
  async recordStep(moduleCode: string, step: JourneyStepDefinition): Promise<void> {
    const key = moduleCode.toUpperCase();

    // A create that failed earlier gets another chance here rather than leaving the
    // journey permanently unrecoverable.
    const reference = (await this.ensureCreated(key)) ?? undefined;
    if (!this.storeEnabled(key)) {
      return;
    }

    try {
      const response = await this.partialStore.store({
        ...this.baseRequest(key, step),
        ...this.answerFields(key),
        reference,
      });
      this.session.setReference(
        key,
        response.parameters.reference,
        response.parameters.transaction_id,
      );
    } catch (error) {
      console.error(`Partial store update failed for ${key} at step ${step.name}.`, error);
    }
  }

  private async create(key: string): Promise<string | null> {
    try {
      await this.moduleContext.ensureLoaded(key);
      if (!this.storeEnabled(key)) {
        return null;
      }

      const journey = getJourneyForModule(key);
      if (!journey) {
        return null;
      }

      const session = this.session.ensureSession(key);
      if (session.reference) {
        return session.reference;
      }

      const response = await this.partialStore.store(this.baseRequest(key, getFirstStep(journey)));
      this.session.setReference(
        key,
        response.parameters.reference,
        response.parameters.transaction_id,
      );
      return response.parameters.reference;
    } catch (error) {
      console.error(`Partial store create failed for ${key}.`, error);
      return null;
    } finally {
      this.creating.delete(key);
    }
  }

  private storeEnabled(moduleCode: string): boolean {
    return this.moduleContext.allowsPartialStore(moduleCode);
  }

  private baseRequest(moduleCode: string, step: JourneyStepDefinition): PartialStoreRequest {
    return {
      module: moduleCode,
      domain: this.partialStore.configuredDomain,
      step: step.storeStep,
      sessionid: this.session.ensureSession(moduleCode).sessionId,
      [INCEPTION_DATE_KEY]: this.inceptionDate(moduleCode),
    };
  }

  /**
   * The policy start date, which the endpoint requires on every call.
   *
   * Both journeys only ask for it at step 4, so earlier calls fall back to today.
   */
  private inceptionDate(moduleCode: string): string {
    const journey = getJourneyForModule(moduleCode);
    if (journey) {
      for (const step of getQuestionSteps(journey)) {
        for (const [, values] of Object.entries(
          this.journeyState.stepAnswers(moduleCode, step.name),
        )) {
          const captured = values[INCEPTION_DATE_KEY];
          if (typeof captured === 'string' && captured.trim().length > 0) {
            return captured;
          }
        }
      }
    }

    return this.clock.today();
  }

  /**
   * Flattens the answers captured so far into backend key/value pairs.
   *
   * Field names are already backend-shaped, which is why this can be a flat
   * projection today. It becomes the payload mapper's job once the typed model
   * lands, at which point this method goes away.
   */
  private answerFields(moduleCode: string): Record<string, string> {
    const fields: Record<string, string> = {};

    for (const sections of Object.values(this.journeyState.moduleAnswers(moduleCode))) {
      for (const values of Object.values(sections)) {
        for (const [name, value] of Object.entries(values)) {
          if (value === null || value === undefined || value === '') {
            continue;
          }

          fields[name] = typeof value === 'boolean' ? (value ? 'Y' : 'N') : `${value}`;
        }
      }
    }

    return fields;
  }
}
