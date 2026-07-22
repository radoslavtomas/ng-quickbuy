import { inject, Injectable, Signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import type { BrandConfig } from '../models/brand.model';
import { BRAND_CONFIGS } from '../config/brands.config';
import { DEFAULT_BRAND_ID } from '../config/dev.config';

@Injectable({ providedIn: 'root' })
export class BrandService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  readonly config: BrandConfig = this.detectBrand();

  readonly currentModuleCode: Signal<string | null> = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => this.extractModuleCode(e.urlAfterRedirects)),
      startWith(this.extractModuleCode(this.router.url)),
    ),
    { initialValue: this.extractModuleCode(this.router.url) },
  );

  private detectBrand(): BrandConfig {
    const hostname = this.document.defaultView?.location.hostname ?? '';

    if (hostname.includes('quotelinedirect')) return BRAND_CONFIGS['qld'];
    if (hostname.includes('choicequote')) return BRAND_CONFIGS['chq'];
    if (hostname.includes('ajg')) return BRAND_CONFIGS['ajg'];

    // Fallback for localhost / unknown domains — change DEFAULT_BRAND_ID in dev.config.ts
    return BRAND_CONFIGS[DEFAULT_BRAND_ID];
  }

  private extractModuleCode(url: string): string | null {
    const firstSegment = url.split('/')[1]?.toUpperCase() ?? '';
    const isValidModule = this.config.modules.some(m => m.code === firstSegment);
    return isValidModule ? firstSegment : null;
  }

  getModuleByCode(code: string) {
    return this.config.modules.find(m => m.code === code) ?? null;
  }
}
