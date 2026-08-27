import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type { FormFieldOption } from '../models/form-field.model';
import type {
  IrisMakesResponse,
  IrisMatch,
  IrisModelsResponse,
  IrisModule,
  IrisSearchResponse,
} from '../models/vehicle-search.model';

/** Human-facing wording for the single-letter fuel codes IRIS reports. */
const IRIS_FUEL_LABELS: Readonly<Record<string, string>> = {
  P: 'Petrol',
  D: 'Diesel',
  E: 'Electric',
  H: 'Hybrid',
};

/** A make or model name as a plain, alphabetically sorted option list. */
export function toSortedNameOptions(names: readonly string[]): readonly FormFieldOption[] {
  return [...names].sort().map((name) => ({ label: name, value: name }));
}

/** The years a search returned, most recent first — newest models are picked more often. */
export function toDescendingYearOptions(years: readonly number[]): readonly FormFieldOption[] {
  return [...years]
    .sort((a, b) => b - a)
    .map((year) => ({ label: `${year}`, value: `${year}` }));
}

/** One selectable edition, labelled from the attributes a customer would recognise. */
export function toEditionOption(match: IrisMatch): FormFieldOption {
  const attributes = match['@attributes'];
  const fuel = IRIS_FUEL_LABELS[attributes.Fuel] ?? attributes.Fuel;
  const label = `${attributes.Make} ${attributes.Model} - ${attributes.Type} - ${attributes.Engine_CC}cc - ${fuel}`;

  return { label, value: attributes.ABI_code };
}

/** Matches whose production years span the given year. */
export function matchesForYear(matches: readonly IrisMatch[], year: number): readonly IrisMatch[] {
  return matches.filter((match) => {
    const attributes = match['@attributes'];
    return year >= Number(attributes.From) && year <= Number(attributes.To);
  });
}

/**
 * IRIS vehicle catalogue used for manual make/model/edition selection.
 *
 * PC and TX both search the `PC` list; GV searches its own `GV` list. The search
 * response nests its matches under a key named after that same list (`PCMatch` or
 * `GVMatch`), which `matchesOf` hides from callers.
 */
@Injectable({ providedIn: 'root' })
export class VehicleIrisService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * Cache of in-flight and completed searches, keyed by module/make/model.
   *
   * The year and edition options a customer sees are both derived from the same
   * search response, so without this every visit to the edition select would
   * repeat a request the year select had only just made. Entries are kept for the
   * lifetime of this root-provided singleton, which is one browsing session —
   * bounded by how many make/model combinations a customer tries, never large
   * enough to be worth evicting.
   */
  private readonly searchCache = new Map<string, Observable<IrisSearchResponse>>();

  getMakes(irisModule: IrisModule): Observable<IrisMakesResponse> {
    const params = new HttpParams().set('module', irisModule);
    return this.http.get<IrisMakesResponse>(`${this.baseUrl}/api/vehicle/iris/get/makes`, {
      params,
    });
  }

  getModels(irisModule: IrisModule, make: string): Observable<IrisModelsResponse> {
    const params = new HttpParams().set('module', irisModule).set('make', make);
    return this.http.get<IrisModelsResponse>(`${this.baseUrl}/api/vehicle/iris/get/models`, {
      params,
    });
  }

  search(irisModule: IrisModule, make: string, model: string): Observable<IrisSearchResponse> {
    const params = new HttpParams().set('module', irisModule).set('make', make).set('model', model);
    return this.http.get<IrisSearchResponse>(`${this.baseUrl}/api/vehicle/iris/get/search`, {
      params,
    });
  }

  /** The match list, whichever list key the response used for this IRIS module. */
  matchesOf(irisModule: IrisModule, response: IrisSearchResponse): readonly IrisMatch[] {
    return (irisModule === 'GV' ? response.GVMatch : response.PCMatch) ?? [];
  }

  /** `search`, sharing one in-flight or completed response per module/make/model. */
  searchCached(irisModule: IrisModule, make: string, model: string): Observable<IrisSearchResponse> {
    const key = `${irisModule}|${make}|${model}`;
    let cached = this.searchCache.get(key);

    if (!cached) {
      cached = this.search(irisModule, make, model).pipe(
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      this.searchCache.set(key, cached);
    }

    return cached;
  }
}
