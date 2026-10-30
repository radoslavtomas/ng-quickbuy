import { TestBed } from '@angular/core/testing';
import { JourneySessionService } from './journey-session.service';

describe('JourneySessionService', () => {
  let service: JourneySessionService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(JourneySessionService);
  });

  it('mints a session id on first use and reuses it afterwards', () => {
    const first = service.ensureSession('PC');
    const second = service.ensureSession('PC');

    expect(first.sessionId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(second.sessionId).toBe(first.sessionId);
    expect(first.reference).toBeNull();
  });

  it('gives each journey its own session', () => {
    expect(service.ensureSession('PC').sessionId).not.toBe(service.ensureSession('HC').sessionId);
  });

  it('treats module codes case-insensitively', () => {
    expect(service.ensureSession('pc').sessionId).toBe(service.ensureSession('PC').sessionId);
  });

  it('survives a reload by restoring from sessionStorage', () => {
    const original = service.ensureSession('PC');
    service.setReference('PC', 'M9BA-DG5-D43', 'txn-1');

    // A new service instance stands in for a page reload.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const revived = TestBed.inject(JourneySessionService);

    const restored = revived.ensureSession('PC');
    expect(restored.sessionId).toBe(original.sessionId);
    expect(restored.reference).toBe('M9BA-DG5-D43');
  });

  it('stores the reference and transaction id from the partial store', () => {
    service.ensureSession('PC');
    service.setReference('PC', 'M9BA-DG5-D43', 'txn-1');

    expect(service.reference('PC')).toBe('M9BA-DG5-D43');
    expect(service.session('PC')?.transactionId).toBe('txn-1');
  });

  it('ignores a reference for a journey that was never started', () => {
    service.setReference('LL', 'REF', 'txn');

    expect(service.session('LL')).toBeNull();
  });

  it('clears one journey without affecting another', () => {
    const property = service.ensureSession('HC').sessionId;
    service.ensureSession('PC');

    service.clear('PC');

    expect(service.session('PC')).toBeNull();
    expect(service.session('HC')?.sessionId).toBe(property);
  });

  it('starts a new session after being cleared', () => {
    const first = service.ensureSession('PC').sessionId;
    service.clear('PC');

    expect(service.ensureSession('PC').sessionId).not.toBe(first);
  });

  it('clears all journeys and removes persisted sessions', () => {
    const property = service.ensureSession('HC').sessionId;
    service.ensureSession('PC');
    service.setReference('HC', 'REF-HC', 'txn-hc');

    service.clearAll();

    expect(service.session('PC')).toBeNull();
    expect(service.session('HC')).toBeNull();
    expect(service.ensureSession('HC').sessionId).not.toBe(property);
  });
});
