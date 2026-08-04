import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Base URL for the QuickBuy API, without a trailing slash.
 *
 * Provided explicitly from the environment in `app.config.ts`. The root factory
 * keeps the token injectable in tests and in isolated component harnesses
 * without every `TestBed` having to provide it.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});
