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
 * Second-level labels that are part of a public suffix rather than a domain name.
 *
 * Enough to cover the UK and a few common international patterns without shipping
 * the full public suffix list. `quotelinedirect.co.uk` must yield
 * `quotelinedirect`, not `co`.
 */
const COMPOUND_SUFFIX_LABELS = new Set([
  'co',
  'com',
  'org',
  'net',
  'ac',
  'gov',
  'ltd',
  'plc',
  'me',
  'sch',
]);

const IP_ADDRESS = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * Reduces a hostname to the bare domain name the APIs expect.
 *
 * `quotelinedirect.co.uk` and `quickbuyv3-dev.quotelinedirect.co.uk` both become
 * `quotelinedirect`; `ajg.com` becomes `ajg`. Single-label hosts (`localhost`) and
 * IP addresses are returned unchanged, since there is no domain name to extract.
 */
export function extractDomainName(hostname: string): string {
  const host = hostname.trim().toLowerCase().split(':')[0];
  if (!host || IP_ADDRESS.test(host)) {
    return host;
  }

  const labels = host.split('.').filter(label => label.length > 0);
  if (labels.length <= 1) {
    return labels[0] ?? '';
  }

  // Drop the public suffix: two labels for `co.uk`-style compounds, otherwise one.
  const isCompoundSuffix =
    labels.length >= 3 &&
    labels[labels.length - 1].length === 2 &&
    COMPOUND_SUFFIX_LABELS.has(labels[labels.length - 2]);
  const withoutSuffix = labels.slice(0, isCompoundSuffix ? -2 : -1);

  return withoutSuffix[withoutSuffix.length - 1] ?? '';
}

/**
 * Domain name the APIs should attribute this session to, without any suffix.
 *
 * Resolved at runtime from the hostname rather than baked into the build, because
 * one build serves every brand and the brand is itself derived from the hostname.
 * `environment.domainOverride` stands in for the hostname during local development,
 * where `localhost` carries no brand; it goes through the same reduction, so either
 * a full host or a bare name works.
 */
export const APP_DOMAIN = new InjectionToken<string>('APP_DOMAIN', {
  providedIn: 'root',
  factory: () => {
    const hostname = inject(DOCUMENT).defaultView?.location.hostname ?? '';
    return extractDomainName(environment.domainOverride || hostname);
  },
});
