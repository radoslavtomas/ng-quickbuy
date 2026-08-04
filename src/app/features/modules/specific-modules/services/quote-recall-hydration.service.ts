import { Injectable, inject } from '@angular/core';
import { FormFieldConfig } from '../../../../core/models/form-field.model';
import { JourneyStateService } from '../../../../core/services/journey-state.service';
import type {
  QuoteRecallResponse,
  RecallHydrationResult,
} from '../../../../core/models/quote-recall.model';
import {
  getFieldsSections,
  getJourneyForModule,
  getQuestionSteps,
} from '../../journeys/journey-registry';
import { applyFieldAliases } from '../config/shared/common';

/** Recall keys for the proposer address, which the address section owns. */
const ADDRESS_FIELD_MAPPING: Readonly<Record<string, string>> = {
  'proposer-address-addressline1': 'addressLine1',
  'proposer-address-addressline2': 'addressLine2',
  'proposer-address-addressline3': 'addressLine3',
  'proposer-address-postcode': 'postcode',
};

const FIELD_VALUE_MAPPING: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  'policy-cover': {
    C: 'comprehensive',
    TPFT: 'tpft',
    TPO: 'tpo',
  },
  'vehicle-wherekept': {
    G: 'garage',
    D: 'driveway',
    R: 'roadside',
  },
};

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

    const hydratedSteps: Record<string, Record<string, Record<string, unknown>>> = {};
    const consumedKeys = new Set<string>();

    for (const step of getQuestionSteps(journey)) {
      const stepValues: Record<string, Record<string, unknown>> = {};

      for (const section of getFieldsSections(step)) {
        const aliasedSource = applyFieldAliases(source, section.fields);
        const values = this.pickSectionValues(aliasedSource, section.fields, consumedKeys);
        if (Object.keys(values).length > 0) {
          stepValues[section.id] = values;
        }
      }

      if (step.sections.some(section => section.id === ADDRESS_SECTION_ID)) {
        const address = this.pickAddress(source, consumedKeys);
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

  private pickSectionValues(
    source: Record<string, unknown>,
    fields: readonly FormFieldConfig[],
    consumedKeys: Set<string>,
  ): Record<string, unknown> {
    const values: Record<string, unknown> = {};

    for (const field of fields) {
      const value = source[field.name];
      if (value === undefined) {
        continue;
      }

      consumedKeys.add(field.name);
      (field.metadata?.aliases ?? []).forEach(alias => consumedKeys.add(alias));
      values[field.name] = this.normalizeValue(field, value);
    }

    return values;
  }

  private pickAddress(
    source: Record<string, unknown>,
    consumedKeys: Set<string>,
  ): Record<string, unknown> {
    const address: Record<string, unknown> = {};

    Object.entries(ADDRESS_FIELD_MAPPING).forEach(([recallKey, formKey]) => {
      const value = source[recallKey];
      if (value === undefined || value === null || value === '') {
        return;
      }

      consumedKeys.add(recallKey);
      address[formKey] = value;
    });

    return address;
  }

  private normalizeValue(field: FormFieldConfig, value: unknown): unknown {
    const mapped = FIELD_VALUE_MAPPING[field.name];
    if (mapped && typeof value === 'string' && mapped[value] !== undefined) {
      return mapped[value];
    }

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
