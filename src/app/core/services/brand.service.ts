import { computed, inject, Injectable, InjectionToken, Signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import type { BrandConfig, BrandId } from '../models/brand.model';
import { BRAND_CONFIGS } from '../config/brands.config';
import { DEFAULT_BRAND_ID } from '../config/dev.config';
import { findModuleByCode, type ModuleDefinition } from '../config/module-catalogue';
import { readableAgainst } from '../utils/contrast-color';

/**
 * Explicit override for the resolved brand, bypassing hostname detection and the
 * `DEFAULT_BRAND_ID` fallback entirely.
 *
 * Tests provide this so which brand they exercise is a declared dependency rather
 * than an inherited side effect of `dev.config.ts` — a spec that needs `qld`'s
 * module list should say so, not rely on the fallback happening to be `qld`.
 */
export const BRAND_OVERRIDE = new InjectionToken<BrandId | null>('BRAND_OVERRIDE', {
  providedIn: 'root',
  factory: () => null,
});

@Injectable({ providedIn: 'root' })
export class BrandService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  readonly config: BrandConfig = this.detectBrand();

  /**
   * The brand colours as they may actually be painted on the app's white surfaces,
   * either as a fill under white text or as text on the page.
   *
   * The raw configured colours cannot be used for that directly: `#6FACDE` carries
   * white at 2.2:1 and `#8cc63e` at 2.0:1, both far below AA. `readableAgainst`
   * darkens each by the least amount that reaches AA and leaves the ones that
   * already pass — every `qld` colour, and ChoiceQuote's navy — untouched.
   *
   * Resolved here so every component paints the same shade. Use `config` only for
   * the things a colour cannot fail at, such as a value stored or sent onwards.
   */
  readonly accent: string = readableAgainst(this.config.primaryColor);
  readonly accentAlt: string = readableAgainst(this.config.secondaryColor);

  /**
   * The products this brand sells, resolved against the catalogue and in the order
   * the brand lists them.
   */
  readonly modules: readonly ModuleDefinition[] = this.resolveModules();

  readonly requestedModuleCode: Signal<string | null> = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => this.extractRequestedModuleCode(e.urlAfterRedirects)),
      startWith(this.extractRequestedModuleCode(this.router.url)),
    ),
    { initialValue: this.extractRequestedModuleCode(this.router.url) },
  );

  readonly currentModuleCode: Signal<string | null> = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => this.extractModuleCode(e.urlAfterRedirects)),
      startWith(this.extractModuleCode(this.router.url)),
    ),
    { initialValue: this.extractModuleCode(this.router.url) },
  );

  readonly hasInvalidModuleRequest = computed(
    () => this.requestedModuleCode() !== null && this.currentModuleCode() === null,
  );

  private resolveModules(): readonly ModuleDefinition[] {
    return this.config.moduleCodes.flatMap((code) => {
      const module = findModuleByCode(code);
      if (!module) {
        // A brand listing a code that is not in the catalogue is a configuration
        // error: surface it rather than quietly selling nothing.
        console.error(
          `Brand "${this.config.id}" lists module code "${code}", which is not in MODULE_CATALOGUE.`,
        );
        return [];
      }

      return [module];
    });
  }

  private detectBrand(): BrandConfig {
    const override = inject(BRAND_OVERRIDE);
    if (override) return BRAND_CONFIGS[override];

    const hostname = this.document.defaultView?.location.hostname ?? '';

    if (hostname.includes('quotelinedirect')) return BRAND_CONFIGS['qld'];
    if (hostname.includes('choicequote')) return BRAND_CONFIGS['chq'];
    if (hostname.includes('ajg')) return BRAND_CONFIGS['ajg'];

    // Fallback for localhost / unknown domains — change DEFAULT_BRAND_ID in dev.config.ts
    return BRAND_CONFIGS[DEFAULT_BRAND_ID];
  }

  private extractModuleCode(url: string): string | null {
    const firstSegment = this.extractRequestedModuleCode(url);

    if (!firstSegment) {
      return null;
    }

    return this.sellsModule(firstSegment) ? firstSegment : null;
  }

  private extractRequestedModuleCode(url: string): string | null {
    const firstSegment = url.split('/')[1]?.toUpperCase() ?? '';
    return firstSegment || null;
  }

  /** True when this brand is allowed to sell the given module code. */
  sellsModule(code: string | null | undefined): boolean {
    return this.getModuleByCode(code) !== null;
  }

  /** The catalogue entry for a code, but only if this brand sells it. */
  getModuleByCode(code: string | null | undefined): ModuleDefinition | null {
    const module = findModuleByCode(code);
    return module && this.modules.includes(module) ? module : null;
  }
}
