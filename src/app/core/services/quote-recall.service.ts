import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type { QuoteRecallRequest, QuoteRecallResponse } from '../models/quote-recall.model';

@Injectable({ providedIn: 'root' })
export class QuoteRecallService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(API_BASE_URL)}/api/quote/get/recall/`;

  fetchRecall(request: QuoteRecallRequest): Observable<QuoteRecallResponse> {
    const formData = new FormData();

    Object.entries(request).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).length > 0) {
        formData.append(key, String(value));
      }
    });

    return this.http.post<QuoteRecallResponse>(this.endpoint, formData);
  }
}
