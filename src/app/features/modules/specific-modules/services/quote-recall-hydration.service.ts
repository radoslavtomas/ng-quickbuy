import { Injectable, inject } from '@angular/core';
import { FormFieldConfig } from '../../../../core/models/form-field.model';
import { FormWorkflowService } from '../../../../core/services/form-workflow.service';
import type { QuoteRecallResponse, RecallHydrationResult } from '../../../../core/models/quote-recall.model';
import {
  getJourneyHydratableStepNames,
  getStepFieldsForModule,
} from '../config/journey-config.selectors';
import { applyFieldAliases } from '../config/shared/common';

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

@Injectable({ providedIn: 'root' })
export class QuoteRecallHydrationService {
  private readonly workflowService = inject(FormWorkflowService);

  hydrateAndStore(moduleCode: string, response: QuoteRecallResponse): RecallHydrationResult {
    const result = this.mapRecallToJourneySteps(moduleCode, response);
    this.workflowService.setJourneyStepValues(moduleCode, result.hydratedSteps, true);
    return result;
  }

  mapRecallToJourneySteps(moduleCode: string, response: QuoteRecallResponse): RecallHydrationResult {
    const source = this.buildSource(response);
    const hydratedSteps: Record<string, Record<string, unknown>> = {};
    const consumedKeys = new Set<string>();

    for (const stepName of getJourneyHydratableStepNames(moduleCode)) {
      const fields = getStepFieldsForModule(moduleCode, stepName);
      if (!fields.length) {
        continue;
      }

      const aliasedSource = applyFieldAliases(source, fields);
      const stepValue = this.pickMappedStepValue(aliasedSource, fields, consumedKeys);

      if (stepName === 'your-details') {
        this.applyAddressDetails(source, stepValue, consumedKeys);
      }

      if (Object.keys(stepValue).length) {
        hydratedSteps[stepName] = stepValue;
      }
    }

    const unresolvedFields = Object.entries(source).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (consumedKeys.has(key)) {
        return acc;
      }

      return {
        ...acc,
        [key]: value,
      };
    }, {});

    return { hydratedSteps, unresolvedFields };
  }

  private buildSource(response: QuoteRecallResponse): Record<string, unknown> {
    return {
      ...(response.defaults ?? {}),
      ...(response.data ?? {}),
    };
  }

  private pickMappedStepValue(
    source: Record<string, unknown>,
    fields: readonly FormFieldConfig[],
    consumedKeys: Set<string>,
  ): Record<string, unknown> {
    const stepValue: Record<string, unknown> = {};

    for (const field of fields) {
      const value = source[field.name];
      if (value === undefined) {
        continue;
      }

      const aliases = field.metadata?.aliases ?? [];
      consumedKeys.add(field.name);
      aliases.forEach(alias => consumedKeys.add(alias));

      stepValue[field.name] = this.normalizeValue(field, value);
    }

    return stepValue;
  }

  private applyAddressDetails(
    source: Record<string, unknown>,
    stepValue: Record<string, unknown>,
    consumedKeys: Set<string>,
  ): void {
    Object.entries(ADDRESS_FIELD_MAPPING).forEach(([recallKey, formKey]) => {
      const value = source[recallKey];
      if (value === undefined || value === null || value === '') {
        return;
      }

      consumedKeys.add(recallKey);
      stepValue[formKey] = value;
    });
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
