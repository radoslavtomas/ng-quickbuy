import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';  // ← enable when API is live
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import type { ModuleParametersResponse } from '../models/module-parameters.model';

// API_URL to use once the endpoint is live:
const API_URL = 'https://quickbuyv3-dev.quotelinedirect.co.uk/api/module/get/parameters';

@Injectable({ providedIn: 'root' })
export class ModuleParametersService {
  // TODO: uncomment when the API is live
  private readonly http = inject(HttpClient);

  fetchParameters(brandId: string, moduleCode: string, domain: string, referrer = ''): Observable<ModuleParametersResponse> {
    const params = new HttpParams()
      .set('brand', brandId)
      .set('module', moduleCode)
      .set('domain', domain)
      .set('R', referrer);
    return this.http.get<ModuleParametersResponse>(API_URL, { params });
  }
}

