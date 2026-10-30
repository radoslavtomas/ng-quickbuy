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
  return [...names]
    .sort((a, b) => a.localeCompare(b, 'en-GB', { sensitivity: 'base' }))
    .map((name) => ({ label: name, value: name }));
}

/** The years a search returned, most recent first — newest models are picked more often. */
export function toDescendingYearOptions(years: readonly number[]): readonly FormFieldOption[] {
  return [...years].sort((a, b) => b - a).map((year) => ({ label: `${year}`, value: `${year}` }));
}

/** One selectable edition, labelled from the attributes a customer would recognise. */
export function toEditionOption(match: IrisMatch): FormFieldOption {
  const attributes = match['@attributes'];
  const fuel = IRIS_FUEL_LABELS[attributes.Fuel] ?? attributes.Fuel;
  const label = `${attributes.Make} ${attributes.Model} - ${attributes.Type} - ${attributes.Engine_CC}cc - ${fuel}`;

  return { label, value: attributes.ABI_code };
}

/**
 * Matches whose production years span the given year, inclusively.
 * A blank `To` means production has no upper bound. Other malformed ranges are
 * errors, not "no editions": interpreting an unknown sentinel as a year (or as
 * infinity) would silently hide an edition or offer it for the wrong year.
 */
export function matchesForYear(matches: readonly IrisMatch[], year: number): readonly IrisMatch[] {
  if (!Number.isInteger(year) || year <= 0) {
    throw new Error('Invalid IRIS production year.');
  }
  return matches.filter((match) => {
    const attributes = match['@attributes'];
    const from = parseProductionYear(attributes.From);
    const to =
      typeof attributes.To === 'string' && attributes.To.trim() === ''
        ? Infinity
        : parseProductionYear(attributes.To);
    if (from === null || to === null || from > to) {
      throw new Error(`Invalid IRIS production range for edition "${attributes.ABI_code}".`);
    }
    return year >= from && year <= to;
  });
}
function parseProductionYear(raw: unknown): number | null {
  if (typeof raw !== 'string' || !/^\d{4}$/.test(raw.trim())) {
    return null;
  }
  const year = Number(raw);
  return year > 0 ? year : null;
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
   * repeat a request the year select had only just made. Successful responses
   * remain cached for this browsing session; there is deliberately no TTL.
   * RxJS 7's shareReplay resets on error, so a failed entry is retryable on the
   * next subscription, including a subscription to the same observable. Do not
   * catch errors into an empty response before sharing: that would cache failure
   * as a successful "no options" result.
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
  searchCached(
    irisModule: IrisModule,
    make: string,
    model: string,
  ): Observable<IrisSearchResponse> {
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
