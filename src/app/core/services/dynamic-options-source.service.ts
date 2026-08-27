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

/**
 * Maps the `endpoint` key of a `dynamic-select` field to a real options source.
 *
 * This is the only place that knows which service answers which key, exactly
 * like `AutocompleteSourceService` for search fields: a cascading select is a
 * configuration change (field metadata) plus one entry here, and the renderer
 * (`SignalFormComponent` / `DynamicSelectInputComponent`) never needs to know
 * what is actually being loaded.
 */
@Injectable({ providedIn: 'root' })
export class DynamicOptionsSourceService {
  private readonly vehicleIris = inject(VehicleIrisService);

  private readonly sources: Readonly<Record<DynamicSelectEndpoint, DynamicOptionsSource>> = {
    'iris-make': {
      loadOptions: (request) => {
        const irisModule = request.context['irisModule'] as IrisModule;
        return this.vehicleIris
          .getMakes(irisModule)
          .pipe(map((response) => toSortedNameOptions(response.Make ?? [])));
      },
    },
    'iris-model': {
      loadOptions: (request) => {
        const irisModule = request.context['irisModule'] as IrisModule;
        const make = asNonEmptyString(request.dependsOn['make']);
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
        const irisModule = request.context['irisModule'] as IrisModule;
        const make = asNonEmptyString(request.dependsOn['make']);
        const model = asNonEmptyString(request.dependsOn['model']);
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
        const irisModule = request.context['irisModule'] as IrisModule;
        const make = asNonEmptyString(request.dependsOn['make']);
        const model = asNonEmptyString(request.dependsOn['model']);
        const yearText = asNonEmptyString(request.dependsOn['year']);
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
    return this.sources[endpoint];
  }
}
