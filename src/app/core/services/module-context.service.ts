import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { APP_DOMAIN } from '../config/api.config';
import type { ModuleParametersResponse } from '../models/module-parameters.model';
import { BrandService } from './brand.service';
import { ModuleParametersService } from './module-parameters.service';

interface ModuleContextState {
  readonly parameters: ModuleParametersResponse | null;
  readonly failed: boolean;
}

const EMPTY: ModuleContextState = { parameters: null, failed: false };

/**
 * Loads the operational parameters for a module once, and exposes the switches the
 * journey has to respect.
 *
 * The response is not just cosmetic: it can take a product off sale, suppress
 * buy-online, and say whether partial quotes should be stored at all. Previously it
 * was fetched by the header purely for a title and phone number, with failures
 * swallowed.
 */
@Injectable({ providedIn: 'root' })
export class ModuleContextService {
  private readonly moduleParameters = inject(ModuleParametersService);
  private readonly brandService = inject(BrandService);
  private readonly domain = inject(APP_DOMAIN);

  private readonly state = signal<Readonly<Record<string, ModuleContextState>>>({});
  private readonly inFlight = new Map<string, Promise<ModuleParametersResponse | null>>();

  /** Loads a module's parameters, reusing the result and any in-flight request. */
  ensureLoaded(moduleCode: string): Promise<ModuleParametersResponse | null> {
    const key = moduleCode.toUpperCase();
    const existing = this.state()[key];
    if (existing?.parameters) {
      return Promise.resolve(existing.parameters);
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      return pending;
    }

    const request = this.load(key);
    this.inFlight.set(key, request);
    return request;
  }

  parameters(moduleCode: string): ModuleParametersResponse | null {
    return this.state()[moduleCode.toUpperCase()]?.parameters ?? null;
  }

  /** True when the load failed, so callers can decide whether to degrade or block. */
  loadFailed(moduleCode: string): boolean {
    return this.state()[moduleCode.toUpperCase()]?.failed ?? false;
  }

  /** The product is off sale and the journey must not be offered. */
  isSwitchedOff(moduleCode: string): boolean {
    return this.parameters(moduleCode)?.system.switchedoff === true;
  }

  switchedOffMessage(moduleCode: string): string {
    const message = this.parameters(moduleCode)?.system.switchedoff_message ?? '';
    return message.trim().length > 0
      ? message
      : 'This product is temporarily unavailable. Please try again later or call us.';
  }

  /**
   * Whether partial quotes should be stored for this module.
   *
   * Absent parameters mean "not known yet"; treated as enabled so a slow or failed
   * parameters call does not silently stop quotes being recoverable.
   */
  allowsPartialStore(moduleCode: string): boolean {
    const value = this.parameters(moduleCode)?.quotes.quotes_partial_store;
    if (value === undefined) {
      return true;
    }

    return `${value}`.trim().toUpperCase() !== 'N' && `${value}`.trim().toLowerCase() !== 'false';
  }

  allowsBuyOnline(moduleCode: string): boolean {
    const parameters = this.parameters(moduleCode);
    if (!parameters) {
      return true;
    }

    return (
      parameters.quotes.quotes_allow_buyonline === true &&
      parameters.switches.cpd_buyonline_suppressed !== true
    );
  }

  private async load(key: string): Promise<ModuleParametersResponse | null> {
    try {
      const parameters = await firstValueFrom(
        this.moduleParameters.fetchParameters(this.brandService.config.id, key, this.domain),
      );
      this.state.update((current) => ({ ...current, [key]: { parameters, failed: false } }));
      return parameters;
    } catch {
      this.state.update((current) => ({ ...current, [key]: { ...EMPTY, failed: true } }));
      return null;
    } finally {
      this.inFlight.delete(key);
    }
  }
}
