/**
 * Default (development) environment.
 *
 * This file is replaced at build time by `environment.production.ts` via the
 * `fileReplacements` entry in `angular.json` for the production configuration.
 * Keep the shape of both files identical.
 */
import type { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: false,
  apiBaseUrl: 'https://quickbuyv3-dev.quotelinedirect.co.uk',
  // localhost carries no brand, so stand in for a brand host. The suffix is
  // stripped before the value is sent, so this reaches the API as `quotelinedirect`.
  domainOverride: 'quotelinedirect',
};
