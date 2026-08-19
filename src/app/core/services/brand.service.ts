import { computed, inject, Injectable, Signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import type { BrandConfig } from '../models/brand.model';
import { BRAND_CONFIGS } from '../config/brands.config';
import { DEFAULT_BRAND_ID } from '../config/dev.config';
import { findModuleByCode, type ModuleDefinition } from '../config/module-catalogue';

@Injectable({ providedIn: 'root' })
export class BrandService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  readonly config: BrandConfig = this.detectBrand();

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
