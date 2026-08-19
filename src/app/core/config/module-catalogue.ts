import type { JourneyId } from '../models/journey.model';

/**
 * Every insurance product the platform can sell.
 *
 * This is the single source of truth for what a module code means and which
 * journey it runs. Brands reference codes from here and add nothing but the
 * decision to sell them, so onboarding a product is one entry plus one code in
 * `brands.config.ts`.
 */
export interface ModuleDefinition {
  readonly code: string;
  readonly description: string;
  /** Font Awesome solid icon class, e.g. `fa-car`. */
  readonly icon: string;
  readonly journeyId: JourneyId;
}

export const MODULE_CATALOGUE: readonly ModuleDefinition[] = [
  { code: 'PC', description: 'Car Insurance', icon: 'fa-car', journeyId: 'motor' },
  { code: 'GV', description: 'Van Insurance', icon: 'fa-truck', journeyId: 'motor' },
  { code: 'BD', description: 'Breakdown Insurance', icon: 'fa-wrench', journeyId: 'motor' },
  { code: 'TX', description: 'Taxi Insurance', icon: 'fa-taxi', journeyId: 'motor' },
  { code: 'HC', description: 'House Insurance', icon: 'fa-home', journeyId: 'property' },
  {
    code: 'HH',
    description: 'Holiday Home Insurance',
    icon: 'fa-umbrella-beach',
    journeyId: 'property',
  },
  { code: 'LL', description: 'Landlord Insurance', icon: 'fa-building', journeyId: 'property' },
];

const MODULE_BY_CODE: ReadonlyMap<string, ModuleDefinition> = new Map(
  MODULE_CATALOGUE.map((module) => [module.code, module]),
);

/** Normalises a raw URL segment into a catalogue code, or null when unknown. */
export function findModuleByCode(code: string | null | undefined): ModuleDefinition | null {
  if (!code) {
    return null;
  }

  return MODULE_BY_CODE.get(code.toUpperCase()) ?? null;
}
