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
  /**
   * Hostname to use in place of the real one when resolving the API domain.
   *
   * Only for environments where the hostname carries no brand, such as `localhost`.
   * The public suffix is stripped either way, so `quotelinedirect.co.uk` and
   * `quotelinedirect` are equivalent. Leave empty in production so the real
   * hostname the customer arrived on is used.
   */
  readonly domainOverride: string;
}
