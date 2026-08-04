/**
 * Production environment.
 *
 * Swapped in for `environment.ts` by the `fileReplacements` entry in
 * `angular.json` for the production build configuration.
 *
 * TODO: `apiBaseUrl` still points at the development API host because the
 * production host has not been supplied yet. Replace it before any production
 * release — shipping this value means a production build silently calls the
 * dev API.
 */
import type { AppEnvironment } from './environment.model';

export const environment: AppEnvironment = {
  production: true,
  apiBaseUrl: 'https://quickbuyv3-dev.quotelinedirect.co.uk',
  // Empty on purpose: production uses the real hostname the customer arrived on.
  domainOverride: '',
};
