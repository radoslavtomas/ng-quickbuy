import { Injectable, inject } from '@angular/core';
import { FormFieldConfig } from '../../../../core/models/form-field.model';
import { JourneyStateService } from '../../../../core/services/journey-state.service';
import type {
  QuoteRecallResponse,
  RecallHydrationResult,
} from '../../../../core/models/quote-recall.model';
import type { JourneyPayloadMapper } from '../../../../core/models/journey-payload.model';
import {
  getFieldsSections,
  getJourneyForModule,
  getQuestionSteps,
  resolveFields,
} from '../../journeys/journey-registry';

/** Internal names of the address fields the address section owns. */
const ADDRESS_FIELDS: readonly string[] = [
  'addressLine1',
  'addressLine2',
  'addressLine3',
  'addressLine4',
  'postcode',
];

/** Section id that holds the proposer address, by convention in both journeys. */
const ADDRESS_SECTION_ID = 'address';

@Injectable({ providedIn: 'root' })
export class QuoteRecallHydrationService {
  private readonly journeyState = inject(JourneyStateService);

  /**
   * Maps a recall response onto the journey's sections and stores it.
   *
   * `unresolvedFields` is the interesting half of the result: anything left there
   * is a key the backend sent that no section claims, which is the early warning
   * that journey configuration and the backend contract have drifted apart.
   */
  hydrateAndStore(moduleCode: string, response: QuoteRecallResponse): RecallHydrationResult {
    const result = this.mapRecallToJourney(moduleCode, response);

    for (const [stepName, sections] of Object.entries(result.hydratedSteps)) {
      for (const [sectionId, values] of Object.entries(sections)) {
        this.journeyState.setSectionAnswers(moduleCode, stepName, sectionId, values);
      }
    }

    return result;
  }

  mapRecallToJourney(moduleCode: string, response: QuoteRecallResponse): RecallHydrationResult {
    const journey = getJourneyForModule(moduleCode);
    const source = this.buildSource(response);

    if (!journey) {
      return { hydratedSteps: {}, unresolvedFields: { ...source } };
    }

    const mapper = journey.payloadMapper;
    const hydratedSteps: Record<string, Record<string, Record<string, unknown>>> = {};
    const consumedKeys = new Set<string>();

    for (const step of getQuestionSteps(journey)) {
      const stepValues: Record<string, Record<string, unknown>> = {};

      for (const section of getFieldsSections(step)) {
        const fields = resolveFields(section.fields, moduleCode);
        const values = this.pickSectionValues(source, section.id, fields, mapper, consumedKeys);
        if (Object.keys(values).length > 0) {
          stepValues[section.id] = values;
        }
      }

      if (step.sections.some(section => section.id === ADDRESS_SECTION_ID)) {
        const address = this.pickAddress(source, mapper, consumedKeys);
        if (Object.keys(address).length > 0) {
          stepValues[ADDRESS_SECTION_ID] = address;
        }
      }

      if (Object.keys(stepValues).length > 0) {
        hydratedSteps[step.name] = stepValues;
      }
    }

    const unresolvedFields = Object.entries(source).reduce<Record<string, unknown>>(
      (acc, [key, value]) => (consumedKeys.has(key) ? acc : { ...acc, [key]: value }),
      {},
    );

    return { hydratedSteps, unresolvedFields };
  }

  private buildSource(response: QuoteRecallResponse): Record<string, unknown> {
    return {
      ...(response.defaults ?? {}),
      ...(response.data ?? {}),
    };
  }

  /**
   * Reads each field of a section from the recall response.
   *
   * Fields are looked up by the backend key the mapper reports, so a rename of an
   * internal name cannot break hydration. The internal name is also accepted, which
   * covers fields with no known backend key.
   *
   * Derived values come back as a single code, so a second pass asks each derivation
   * to rebuild the answers behind it — an occupation code becomes either a search
   * result to re-describe or a choice from the student list, depending on the
   * employment status that arrived with it. That pass runs last so every plain
   * answer it depends on has already been read.
   */
  private pickSectionValues(
    source: Record<string, unknown>,
    sectionId: string,
    fields: readonly FormFieldConfig[],
    mapper: JourneyPayloadMapper,
    consumedKeys: Set<string>,
  ): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    const derivedValues: Record<string, unknown> = {};

    for (const field of fields) {
      const backendKey = mapper.backendKeyForSection(sectionId, field.name);
      const rawValue = source[backendKey] ?? source[field.name];
      if (rawValue === undefined) {
        continue;
      }

      consumedKeys.add(backendKey);
      consumedKeys.add(field.name);

      const value = this.normalizeValue(field, mapper.fromWireValueFor(field.name, rawValue));
      if (field.type === 'derived') {
        derivedValues[field.name] = value;
      } else {
        values[field.name] = value;
      }
    }

    for (const field of fields) {
      const derived = field.derived;
      if (field.type !== 'derived' || !derived?.toAnswers) {
        continue;
      }

      Object.assign(values, derived.toAnswers(derivedValues[field.name], values));
    }

    return values;
  }

  private pickAddress(
    source: Record<string, unknown>,
    mapper: JourneyPayloadMapper,
    consumedKeys: Set<string>,
  ): Record<string, unknown> {
    const address: Record<string, unknown> = {};

    for (const internalName of ADDRESS_FIELDS) {
      const backendKey = mapper.backendKeyFor(internalName);
      const value = source[backendKey] ?? source[internalName];
      if (value === undefined || value === null || value === '') {
        continue;
      }

      consumedKeys.add(backendKey);
      consumedKeys.add(internalName);
      address[internalName] = value;
    }

    return address;
  }

  private normalizeValue(field: FormFieldConfig, value: unknown): unknown {
    if (field.metadata?.valueTransform === 'booleanYN') {
      return this.toBooleanYN(value);
    }

    if (field.metadata?.valueTransform === 'numberString') {
      return this.toNumberValue(value);
    }

    if (field.type === 'number') {
      return this.toNumberValue(value);
    }

    if (field.type === 'checkbox' || field.type === 'toggle') {
      return this.toBooleanYN(value);
    }

    return value;
  }

  private toNumberValue(value: unknown): unknown {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value !== 'string') {
      return value;
    }

    const normalized = value.trim();
    if (!normalized) {
      return value;
    }

    const asNumber = Number(normalized);
    return Number.isFinite(asNumber) ? asNumber : value;
  }

  private toBooleanYN(value: unknown): unknown {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value !== 'string') {
      return value;
    }

    const normalized = value.trim().toUpperCase();
    if (normalized === 'Y') {
      return true;
    }

    if (normalized === 'N') {
      return false;
    }

    return value;
  }
}
