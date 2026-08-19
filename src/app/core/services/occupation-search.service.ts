import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

export interface OccupationOption {
  readonly code: string;
  readonly description: string;
}

interface OccupationsResponse {
  occupations: OccupationOption[];
}

interface EmployersResponse {
  employers: OccupationOption[];
}

interface DescriptionResponse {
  description: string;
}

@Injectable({ providedIn: 'root' })
export class OccupationSearchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  searchOccupations(keyword: string): Observable<OccupationOption[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http
      .get<OccupationsResponse>(`${this.baseUrl}/api/occupation/occupations/get/bysearch`, {
        params,
      })
      .pipe(map((response) => response.occupations ?? []));
  }

  searchIndustries(keyword: string): Observable<OccupationOption[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http
      .get<EmployersResponse>(`${this.baseUrl}/api/occupation/employers/get/bysearch`, { params })
      .pipe(map((response) => response.employers ?? []));
  }

  getOccupationByCode(code: string): Observable<string> {
    const params = new HttpParams().set('code', code);
    return this.http
      .get<DescriptionResponse>(`${this.baseUrl}/api/occupation/occupations/get/bycode`, { params })
      .pipe(map((response) => response.description ?? ''));
  }

  getIndustryByCode(code: string): Observable<string> {
    const params = new HttpParams().set('code', code);
    return this.http
      .get<DescriptionResponse>(`${this.baseUrl}/api/occupation/employers/get/bycode`, { params })
      .pipe(map((response) => response.description ?? ''));
  }
}
