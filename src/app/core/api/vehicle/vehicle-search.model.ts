/** Error shape occasionally returned inside a 200 response body instead of a status code. */
export type ApiDataError = string | { message?: string };

export interface VehicleByVrmVehicle {
  registration: string;
  abicode: string;
  manufacturer: string;
  model: string;
  cc: number;
  years: string;
  year: number;
  fuel: string;
  transmission: string;
  body: string;
  body_desc: string;
  registered: string;
  doors: number;
}

export interface VehicleByVrmResponse {
  vehicles: readonly VehicleByVrmVehicle[];
  error?: ApiDataError;
}

export interface VehicleByAbicodeVehicle {
  manufacturer: string;
  model: string;
  cc: number;
  years: string;
  fuel: string;
  fuel_desc: string;
  body: string;
  body_desc: string;
  weight: number;
  transmission: string;
  transmission_desc: string;
  doors: string;
  matched_in: string;
}

export interface VehicleByAbicodeResponse {
  vehicle?: VehicleByAbicodeVehicle;
  error?: ApiDataError;
}

export interface IrisMakesResponse {
  Make: readonly string[];
}

export interface IrisModelsResponse {
  Model: readonly string[];
}

export interface IrisMatchAttributes {
  Make: string;
  Model: string;
  Engine_CC: string;
  From: string;
  To: string;
  Type: string;
  Weight: string;
  Fuel: string;
  ABI_code: string;
  CDL_code?: string;
  CDL_code_PC?: string;
  CDL_code_GV?: string;
}

export interface IrisMatch {
  '@attributes': IrisMatchAttributes;
}

export interface IrisSearchResponse {
  '@attributes'?: { Matches: string; Unique_ID: string };
  GVMatch?: readonly IrisMatch[];
  PCMatch?: readonly IrisMatch[];
  years: readonly number[];
}

/** The vehicle search's mode: registration lookup, or manual make/model entry. */
export type VehicleSearchMode = 'vrm' | 'manual';

/** The IRIS vehicle list manual search runs against. TX shares PC's list. */
export type IrisModule = 'PC' | 'GV';

/**
 * The canonical vehicle answer the search resolves to, independent of module. Never
 * includes `makeandmodel`, which only exists for BD's freeform manual entry.
 */
export interface NormalizedVehicle {
  regnumber?: string;
  make: string;
  model: string;
  year: number | null;
  fuel: string;
  engine: number | null;
  transmission: string;
  abicode: string;
  weight?: number;
}
