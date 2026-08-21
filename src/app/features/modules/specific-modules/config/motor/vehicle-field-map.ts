import type { IrisModule } from '../../../../../core/models/vehicle-search.model';

/**
 * Maps the vehicle search's canonical field names onto the backend wire keys the
 * insurer expects, which differ by module. This is deliberately separate from
 * `JourneyPayloadMapper`: that mapper's key table is static per journey and never
 * sees the module code, so it cannot express "the same internal field goes to a
 * different backend key for GV than for PC". The vehicle search components read
 * and write journey state using these exact wire key strings as the value keys,
 * which lets the mapper's identity pass-through (an unmapped key is sent as-is)
 * do the rest.
 */

/** Canonical fields the vehicle search resolves, independent of module. */
export type VehicleField =
  | 'regnumber'
  | 'make'
  | 'model'
  | 'makeandmodel'
  | 'year'
  | 'fuel'
  | 'engine'
  | 'transmission'
  | 'abicode'
  | 'weight';

/** Wire key for each field when a module has no override. */
export const DEFAULT_VEHICLE_FIELD_KEYS: Readonly<Record<VehicleField, string>> = {
  regnumber: 'vehicle-regnumber',
  make: 'vehicle-make',
  model: 'vehicle-model',
  makeandmodel: 'vehicles-vehicle-1-makeandmodel',
  year: 'vehicle-yearofmanufacture',
  fuel: 'vehicle-fuel',
  engine: 'vehicles-vehicle-1-enginecc',
  transmission: 'vehicle-transmission',
  abicode: 'vehicle-abicode',
  weight: 'vehicle-grossweight',
};

/** Van insurance asks the fuel question under a different, DUQS-numbered key. */
const GV_VEHICLE_FIELD_OVERRIDES: Partial<Readonly<Record<VehicleField, string>>> = {
  fuel: 'duqs-question-64',
};

/** Breakdown insurance files the registration and year under its vehicle-1 slot. */
const BD_VEHICLE_FIELD_OVERRIDES: Partial<Readonly<Record<VehicleField, string>>> = {
  regnumber: 'vehicles-vehicle-1-regnumber',
  year: 'vehicles-vehicle-1-yearofmanufacture',
  makeandmodel: 'vehicles-vehicle-1-makeandmodel',
};

const VEHICLE_FIELD_OVERRIDES_BY_MODULE: Readonly<
  Record<string, Partial<Readonly<Record<VehicleField, string>>>>
> = {
  GV: GV_VEHICLE_FIELD_OVERRIDES,
  BD: BD_VEHICLE_FIELD_OVERRIDES,
};

/** The wire key for every vehicle field, resolved for one module. */
export function vehicleFieldKeys(moduleCode: string): Readonly<Record<VehicleField, string>> {
  const overrides = VEHICLE_FIELD_OVERRIDES_BY_MODULE[moduleCode.toUpperCase()] ?? {};
  return { ...DEFAULT_VEHICLE_FIELD_KEYS, ...overrides };
}

/**
 * Converts canonical vehicle field values into the wire-keyed record the section
 * stores in journey state. Fields not present in `vehicle` are omitted rather than
 * written as empty, so a partially resolved search does not overwrite an existing
 * answer with a blank.
 */
export function toVehicleWireAnswers(
  moduleCode: string,
  vehicle: Partial<Readonly<Record<VehicleField, unknown>>>,
): Record<string, unknown> {
  const keys = vehicleFieldKeys(moduleCode);
  const wire: Record<string, unknown> = {};

  for (const [field, value] of Object.entries(vehicle) as [VehicleField, unknown][]) {
    if (value !== undefined) {
      wire[keys[field]] = value;
    }
  }

  return wire;
}

/** Reverses `toVehicleWireAnswers`, reading canonical fields back out of stored answers. */
export function fromVehicleWireAnswers(
  moduleCode: string,
  stored: Readonly<Record<string, unknown>>,
): Partial<Readonly<Record<VehicleField, unknown>>> {
  const keys = vehicleFieldKeys(moduleCode);
  const vehicle: Partial<Record<VehicleField, unknown>> = {};

  for (const [field, key] of Object.entries(keys) as [VehicleField, string][]) {
    const value = stored[key];
    if (value !== undefined) {
      vehicle[field] = value;
    }
  }

  return vehicle;
}

export function resolveIrisModule(moduleCode: string): IrisModule {
  return moduleCode.toUpperCase() === 'GV' ? 'GV' : 'PC';
}

/** Section id the vehicle search custom section is registered under. */
export const VEHICLE_SEARCH_SECTION_ID = 'vehicleSearch';

/**
 * Internal names that exist only to restore the vehicle search's own UI state
 * (which mode is active, what the customer picked in IRIS) and must never reach
 * the backend. Consumed by `journey-payload.mapper.ts`'s `UI_ONLY_FIELDS`.
 */
export const VEHICLE_SEARCH_UI_ONLY_FIELDS: readonly string[] = [
  'vehicleSearchMode',
  'vehicleVrmFailedFor',
  'irisMake',
  'irisModel',
  'irisYear',
  'irisAbicode',
];
