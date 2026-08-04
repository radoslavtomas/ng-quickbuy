import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL, APP_DOMAIN } from '../config/api.config';

/** Parameters the store endpoint requires on every call. */
export interface PartialStoreRequest {
  readonly module: string;
  readonly domain: string;
  readonly step: string;
  readonly sessionid: string;
  readonly 'policy-inceptiondate': string;
  /** Present from the second call onwards; makes the backend update, not create. */
  readonly reference?: string;
  /** Answers captured so far, already in backend key form. */
  readonly [key: string]: string | undefined;
}

export interface PartialStoreResponse {
  readonly parameters: {
    readonly module: string;
    readonly reference: string;
    readonly transaction_id: string;
  };
}

/**
 * Saves a partial quote so an abandoned journey can be resumed.
 *
 * One endpoint serves two roles. The first call omits `reference` and the backend
 * creates a partial, returning one. Every later call includes that reference, which
 * makes the backend update the same partial instead of creating another.
 */
@Injectable({ providedIn: 'root' })
export class QuotePartialStoreService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly domain = inject(APP_DOMAIN);

  private get endpoint(): string {
    return `${this.baseUrl}/api/miscellaneous/quote/post/store`;
  }

  /** The domain the store and recall calls report, exposed for callers that need it. */
  get configuredDomain(): string {
    return this.domain;
  }

  store(request: PartialStoreRequest): Promise<PartialStoreResponse> {
    const formData = new FormData();

    for (const [key, value] of Object.entries(request)) {
      if (value !== undefined && value !== null && `${value}`.length > 0) {
        formData.append(key, `${value}`);
      }
    }

    return firstValueFrom(this.http.post<PartialStoreResponse>(this.endpoint, formData));
  }
}
