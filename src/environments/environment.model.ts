/**
 * Shape shared by every environment file.
 *
 * `angular.json` swaps `environment.ts` for `environment.production.ts` at build
 * time, so the two files must stay structurally identical. Typing both against
 * this interface makes a divergence a compile error rather than a runtime one.
 */
export interface AppEnvironment {
  /** True only in builds that replace `environment.ts`. */
  readonly production: boolean;
  /** Base URL for the QuickBuy API, without a trailing slash. */
  readonly apiBaseUrl: string;
}
