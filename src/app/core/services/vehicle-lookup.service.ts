import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type {
  ApiDataError,
  NormalizedVehicle,
  VehicleByAbicodeResponse,
  VehicleByAbicodeVehicle,
  VehicleByVrmResponse,
  VehicleByVrmVehicle,
} from '../models/vehicle-search.model';

/** Shown whenever a vehicle search finds nothing to work with, VRM or IRIS alike. */
export const VEHICLE_NOT_FOUND_FALLBACK_MESSAGE =
  "We couldn't find any matching vehicle. Please, try to edit your search.";

/**
 * Reads the message from a failed API call, transport-level errors taking priority
 * over anything the response body might otherwise have said.
 */
export function transportErrorMessage(
  error: unknown,
  fallback: string = VEHICLE_NOT_FOUND_FALLBACK_MESSAGE,
): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { error?: ApiDataError } | null;
    return dataErrorMessage(body?.error) ?? error.message ?? fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

/** Reads `data.error` from an otherwise-successful response body, if present. */
export function dataErrorMessage(error: ApiDataError | undefined): string | null {
  if (!error) {
    return null;
  }

  return typeof error === 'string' ? error : (error.message ?? VEHICLE_NOT_FOUND_FALLBACK_MESSAGE);
}

/** The DVLA-delay warning shown when a VRM search finds no matching vehicle. */
export function buildDvlaDelayWarning(registration: string): string {
  return (
    `We couldn't find any matching vehicle for your registration number ` +
    `<strong>"${registration}"</strong>. Don\u2019t worry, brand new vehicles aren\u2019t added to ` +
    `the DVLA database immediately, so this is totally normal. Just use the manual search ` +
    `function below to select your vehicle, we have already captured your registration number.`
  );
}

/**
 * Looks up a vehicle by registration or by ABI code.
 *
 * A VRM search only narrows down which vehicle the customer has; the ABI code
 * lookup that follows is what supplies the normalized details actually stored,
 * which is why the two calls are always chained rather than either standing alone.
 */
@Injectable({ providedIn: 'root' })
export class VehicleLookupService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getByVrm(module: string, registration: string): Observable<VehicleByVrmResponse> {
    const params = new HttpParams().set('module', module).set('registration', registration);
    return this.http.get<VehicleByVrmResponse>(`${this.baseUrl}/api/vehicle/get/byvrm`, {
      params,
    });
  }

  getByAbicode(module: string, abicode: string): Observable<VehicleByAbicodeResponse> {
    const params = new HttpParams().set('module', module).set('abicode', abicode);
    return this.http.get<VehicleByAbicodeResponse>(`${this.baseUrl}/api/vehicle/get/byabicode`, {
      params,
    });
  }

  /** The provisional vehicle from a VRM match, before the ABI code lookup confirms it. */
  normalizeFromVrm(vehicle: VehicleByVrmVehicle): NormalizedVehicle {
    return {
      regnumber: vehicle.registration,
      make: vehicle.manufacturer,
      model: vehicle.model,
      year: vehicle.year ?? null,
      fuel: vehicle.fuel,
      engine: vehicle.cc ?? null,
      transmission: vehicle.transmission,
      abicode: vehicle.abicode,
    };
  }

  /**
   * The final vehicle answer once the ABI code lookup has confirmed the exact
   * variant. The ABI code response has no registration or single model year of its
   * own (only a `years` range), so those carry over from whatever resolved the
   * ABI code in the first place: a VRM match or an IRIS edition selection.
   */
  normalizeFromAbicode(
    vehicle: VehicleByAbicodeVehicle,
    context: { regnumber?: string; year: number | null; abicode: string },
  ): NormalizedVehicle {
    return {
      regnumber: context.regnumber,
      make: vehicle.manufacturer,
      model: vehicle.model,
      year: context.year,
      fuel: vehicle.fuel,
      engine: vehicle.cc ?? null,
      transmission: vehicle.transmission,
      abicode: context.abicode,
      weight: vehicle.weight,
    };
  }
}
