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
};
