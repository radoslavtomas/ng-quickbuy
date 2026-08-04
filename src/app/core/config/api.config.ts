import { DOCUMENT } from '@angular/common';
import { InjectionToken, inject } from '@angular/core';
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

/**
 * Domain the APIs should attribute this session to.
 *
 * Resolved at runtime from the hostname rather than baked into the build, because
 * one build serves every brand and the brand is itself derived from the hostname.
 * `environment.domainOverride` exists for local development, where the hostname is
 * `localhost` and the API needs a real domain to resolve brand configuration.
 */
export const APP_DOMAIN = new InjectionToken<string>('APP_DOMAIN', {
  providedIn: 'root',
  factory: () => {
    const hostname = inject(DOCUMENT).defaultView?.location.hostname ?? '';
    return environment.domainOverride || hostname;
  },
});
