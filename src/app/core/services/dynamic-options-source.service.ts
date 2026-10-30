import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { map, of } from 'rxjs';
import type { DynamicSelectEndpoint, FormFieldOption } from '../models/form-field.model';
import type { IrisModule } from '../models/vehicle-search.model';
import {
  VehicleIrisService,
  matchesForYear,
  toDescendingYearOptions,
  toEditionOption,
  toSortedNameOptions,
} from './vehicle-iris.service';

/** What a `dynamic-select` field asks its source to resolve into options. */
export interface DynamicOptionsRequest {
  /** Live values of the fields this select depends on, keyed by field name. */
  readonly dependsOn: Readonly<Record<string, unknown>>;
  /** Fixed configuration baked in when the field list was built. */
  readonly context: Readonly<Record<string, unknown>>;
}

/** A named source a `dynamic-select` field can load its options from. */
export interface DynamicOptionsSource {
  loadOptions(request: DynamicOptionsRequest): Observable<readonly FormFieldOption[]>;
}

function asNonEmptyString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
/** One checked boundary for catalogue configuration and live cascade answers. */
function readIrisRequest(request: DynamicOptionsRequest): {
  irisModule: IrisModule;
  make: string;
  model: string;
  yearText: string;
} {
  const irisModule = request.context['irisModule'];
  if (irisModule !== 'PC' && irisModule !== 'GV') {
    throw new Error('Invalid IRIS module: expected PC or GV.');
  }
  return {
    irisModule,
    make: asNonEmptyString(request.dependsOn['make']),
    model: asNonEmptyString(request.dependsOn['model']),
    yearText: asNonEmptyString(request.dependsOn['year']),
  };
}

/**
 * Maps the `endpoint` key of a `dynamic-select` field to a real options source.
 *
 * This is the only place that knows which service answers which key, exactly
 * like `AutocompleteSourceService` for search fields: a cascading select is a
 * configuration change (field metadata) plus one entry here, and the renderer
 * (`SignalFormComponent`) never needs to know what is actually being loaded.
 */
@Injectable({ providedIn: 'root' })
export class DynamicOptionsSourceService {
  private readonly vehicleIris = inject(VehicleIrisService);

  private readonly sources: Readonly<Record<DynamicSelectEndpoint, DynamicOptionsSource>> = {
    'iris-make': {
      loadOptions: (request) => {
        const { irisModule } = readIrisRequest(request);
        return this.vehicleIris
          .getMakes(irisModule)
          .pipe(map((response) => toSortedNameOptions(response.Make ?? [])));
      },
    },
    'iris-model': {
      loadOptions: (request) => {
        const { irisModule, make } = readIrisRequest(request);
        if (!make) {
          return of([]);
        }

        return this.vehicleIris
          .getModels(irisModule, make)
          .pipe(map((response) => toSortedNameOptions(response.Model ?? [])));
      },
    },
    'iris-year': {
      loadOptions: (request) => {
        const { irisModule, make, model } = readIrisRequest(request);
        if (!make || !model) {
          return of([]);
        }

        return this.vehicleIris
          .searchCached(irisModule, make, model)
          .pipe(map((response) => toDescendingYearOptions(response.years ?? [])));
      },
    },
    'iris-edition': {
      loadOptions: (request) => {
        const { irisModule, make, model, yearText } = readIrisRequest(request);
        const year = Number(yearText);
        if (!make || !model || !yearText || !Number.isFinite(year)) {
          return of([]);
        }

        return this.vehicleIris.searchCached(irisModule, make, model).pipe(
          map((response) => {
            const matches = this.vehicleIris.matchesOf(irisModule, response);
            return matchesForYear(matches, year).map(toEditionOption);
          }),
        );
      },
    },
  };

  forEndpoint(endpoint: DynamicSelectEndpoint): DynamicOptionsSource {
    if (!Object.hasOwn(this.sources, endpoint)) {
      throw new Error(`Unknown dynamic-options endpoint "${endpoint}".`);
    }
    return this.sources[endpoint];
  }
}
