import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type {
  IrisMakesResponse,
  IrisMatch,
  IrisModelsResponse,
  IrisModule,
  IrisSearchResponse,
} from '../models/vehicle-search.model';

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
}
