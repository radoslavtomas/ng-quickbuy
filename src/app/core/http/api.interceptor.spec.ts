import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_TIMEOUT_MS, ApiError, apiInterceptor } from './api.interceptor';

describe('apiInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
    httpMock.verify();
  });

  it('passes successful responses through untouched', () => {
    let result: unknown;

    http.get('/api/test').subscribe((res) => {
      result = res;
    });

    httpMock.expectOne('/api/test').flush({ ok: true });

    expect(result).toEqual({ ok: true });
  });

  it('normalises a server failure into an ApiError with status and readable message', () => {
    let error: ApiError | undefined;

    http.get('/api/test').subscribe({
      next: () => {
        throw new Error('Expected the request to fail.');
      },
      error: (err: ApiError) => {
        error = err;
      },
    });

    httpMock.expectOne('/api/test').flush('boom', { status: 503, statusText: 'Service Unavailable' });

    expect(error).toBeInstanceOf(ApiError);
    expect(error?.status).toBe(503);
    expect(error?.message).toBe('The service is temporarily unavailable. Please try again shortly.');
    expect(error?.isNetworkError).toBe(false);
  });

  it('normalises a transport failure into a network ApiError', () => {
    let error: ApiError | undefined;

    http.get('/api/test').subscribe({
      next: () => {
        throw new Error('Expected the request to fail.');
      },
      error: (err: ApiError) => {
        error = err;
      },
    });

    httpMock.expectOne('/api/test').error(new ProgressEvent('error'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error?.isNetworkError).toBe(true);
    expect(error?.message).toBe(
      'We could not reach the service. Please check your connection and try again.',
    );
  });

  it('fails with a timeout ApiError when the response takes too long', () => {
    vi.useFakeTimers();
    let error: ApiError | undefined;

    http.get('/api/test').subscribe({
      next: () => {
        throw new Error('Expected the request to time out.');
      },
      error: (err: ApiError) => {
        error = err;
      },
    });

    httpMock.expectOne('/api/test');
    vi.advanceTimersByTime(API_TIMEOUT_MS + 1);

    expect(error).toBeInstanceOf(ApiError);
    expect(error?.status).toBe(0);
    expect(error?.message).toBe('The request took too long to respond. Please try again.');
  });
});
