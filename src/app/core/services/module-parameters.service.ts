import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type { ModuleParametersResponse } from '../models/module-parameters.model';

@Injectable({ providedIn: 'root' })
export class ModuleParametersService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_BASE_URL)}/api/module/get/parameters`;

  fetchParameters(brandId: string, moduleCode: string, domain: string, referrer = ''): Observable<ModuleParametersResponse> {
    const params = new HttpParams()
      .set('brand', brandId)
      .set('module', moduleCode)
      .set('domain', domain)
      .set('R', referrer);
    return this.http.get<ModuleParametersResponse>(this.endpoint, { params });
  }
}

