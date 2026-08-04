import { TestBed } from '@angular/core/testing';
import { JourneyStateService } from './journey-state.service';

describe('JourneyStateService', () => {
  let service: JourneyStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JourneyStateService);
  });

  it('stores answers per module, step and section', () => {
    service.setSectionAnswers('PC', 'your-vehicle', 'vehicle', { 'vehicle-regnumber': 'AB12CDE' });

    expect(service.sectionAnswers('PC', 'your-vehicle', 'vehicle')).toEqual({
      'vehicle-regnumber': 'AB12CDE',
    });
    expect(service.stepAnswers('PC', 'your-vehicle')).toEqual({
      vehicle: { 'vehicle-regnumber': 'AB12CDE' },
    });
  });

  it('keeps a field name reused across two steps separate', () => {
    // `declarationAccepted` genuinely exists in two different steps. Under the old
    // flat merge, one silently overwrote the other.
    service.setSectionAnswers('PC', 'your-policy', 'policy', { declarationAccepted: true });
    service.setSectionAnswers('PC', 'assumptions', 'assumptions', { declarationAccepted: false });

    expect(service.sectionAnswers('PC', 'your-policy', 'policy')['declarationAccepted']).toBe(true);
    expect(service.sectionAnswers('PC', 'assumptions', 'assumptions')['declarationAccepted']).toBe(
      false,
    );
  });

  it('merges section writes without discarding sibling sections', () => {
    service.setSectionAnswers('HC', 'your-details', 'address', { postcode: 'M16 0PQ' });
    service.setSectionAnswers('HC', 'your-details', 'proposer', { 'proposer-email': 'a@b.com' });

    expect(Object.keys(service.stepAnswers('HC', 'your-details')).sort()).toEqual([
      'address',
      'proposer',
    ]);
  });

  it('replaces rather than merges values within a single section', () => {
    service.setSectionAnswers('PC', 'your-policy', 'policy', { a: 1, b: 2 });
    service.setSectionAnswers('PC', 'your-policy', 'policy', { a: 9 });

    expect(service.sectionAnswers('PC', 'your-policy', 'policy')).toEqual({ a: 9 });
  });

  it('treats module codes case-insensitively', () => {
    service.setSectionAnswers('pc', 'your-vehicle', 'vehicle', { vehicleUse: 'sdp' });

    expect(service.sectionAnswers('PC', 'your-vehicle', 'vehicle')['vehicleUse']).toBe('sdp');
  });

  it('tracks step completion per module', () => {
    expect(service.isStepComplete('PC', 'your-details')).toBe(false);

    service.markStepComplete('PC', 'your-details');
    service.markStepComplete('PC', 'your-details');

    expect(service.isStepComplete('PC', 'your-details')).toBe(true);
    expect(service.isStepComplete('GV', 'your-details')).toBe(false);
  });

  it('clears one module without touching another', () => {
    service.setSectionAnswers('PC', 'your-vehicle', 'vehicle', { vehicleUse: 'sdp' });
    service.setSectionAnswers('HC', 'your-property', 'property', { bedrooms: 3 });
    service.markStepComplete('PC', 'your-vehicle');

    service.resetModule('PC');

    expect(service.moduleAnswers('PC')).toEqual({});
    expect(service.isStepComplete('PC', 'your-vehicle')).toBe(false);
    expect(service.sectionAnswers('HC', 'your-property', 'property')['bedrooms']).toBe(3);
  });

  it('returns empty objects for journeys that have not been started', () => {
    expect(service.moduleAnswers('LL')).toEqual({});
    expect(service.stepAnswers('LL', 'your-details')).toEqual({});
    expect(service.sectionAnswers('LL', 'your-details', 'address')).toEqual({});
  });
});
