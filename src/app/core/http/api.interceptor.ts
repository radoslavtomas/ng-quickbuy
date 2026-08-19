import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError, timeout, TimeoutError } from 'rxjs';

/** Maximum time any API request may take before it is aborted. */
export const API_TIMEOUT_MS = 20_000;

/** Status used when the failure never reached the server (offline, CORS, timeout). */
export const API_NETWORK_STATUS = 0;

/**
 * Normalised application error for every failed HTTP call.
 *
 * Callers can rely on `status` and on `message` being safe to show to a customer.
 */
export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    readonly status: number,
    message: string,
    readonly url: string | null,
    readonly originalError: unknown,
  ) {
    super(message);
  }

  /** True when the request never got a response from the server. */
  get isNetworkError(): boolean {
    return this.status === API_NETWORK_STATUS;
  }
}

/**
 * Applies a request timeout and turns transport/HTTP failures into `ApiError`.
 *
 * Deliberately minimal: there is no retry or backoff yet. Follow-up: add
 * idempotent-request retry (GET only, bounded attempts) once the endpoints in
 * use have documented retry semantics.
 */
export const apiInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    timeout(API_TIMEOUT_MS),
    catchError((error: unknown) => throwError(() => toApiError(error, request.url))),
  );

function toApiError(error: unknown, requestUrl: string): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof TimeoutError) {
    return new ApiError(
      API_NETWORK_STATUS,
      'The request took too long to respond. Please try again.',
      requestUrl,
      error,
    );
  }

  if (error instanceof HttpErrorResponse) {
    return new ApiError(
      error.status,
      messageForStatus(error.status),
      error.url ?? requestUrl,
      error,
    );
  }

  return new ApiError(
    API_NETWORK_STATUS,
    'Something went wrong. Please try again.',
    requestUrl,
    error,
  );
}

function messageForStatus(status: number): string {
  if (status === API_NETWORK_STATUS) {
    return 'We could not reach the service. Please check your connection and try again.';
  }

  if (status === 400 || status === 422) {
    return 'Some of the details sent were not accepted. Please check your answers and try again.';
  }

  if (status === 401 || status === 403) {
    return 'This request was not authorised. Please start again.';
  }

  if (status === 404) {
    return 'The information requested could not be found.';
  }

  if (status === 408 || status === 429) {
    return 'The service is busy right now. Please try again in a moment.';
  }

  if (status >= 500) {
    return 'The service is temporarily unavailable. Please try again shortly.';
  }

  return 'Something went wrong. Please try again.';
}
