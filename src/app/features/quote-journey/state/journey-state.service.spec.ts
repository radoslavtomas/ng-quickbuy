import { TestBed } from '@angular/core/testing';
import { JourneyStateService } from './journey-state.service';

describe('JourneyStateService', () => {
  let service: JourneyStateService;

  /** A fresh service instance, as a page reload would produce. */
  function reload(): JourneyStateService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(JourneyStateService);
  }

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(JourneyStateService);
  });

  afterEach(() => {
    sessionStorage.clear();
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

  it('lists the steps completed for a module', () => {
    service.markStepComplete('PC', 'your-details');
    service.markStepComplete('PC', 'your-vehicle');

    expect(service.completedSteps('PC')).toEqual(['your-details', 'your-vehicle']);
    expect(service.completedSteps('HC')).toEqual([]);
  });

  describe('surviving a reload', () => {
    it('restores answers and progress, so gating does not throw away a journey', () => {
      service.setSectionAnswers('PC', 'your-vehicle', 'vehicle', { registration: 'AB12CDE' });
      service.markStepComplete('PC', 'your-details');

      const reloaded = reload();

      expect(reloaded.sectionAnswers('PC', 'your-vehicle', 'vehicle')).toEqual({
        registration: 'AB12CDE',
      });
      expect(reloaded.isStepComplete('PC', 'your-details')).toBe(true);
    });

    it('keeps each module in its own slot', () => {
      service.markStepComplete('PC', 'your-details');
      service.markStepComplete('HC', 'your-details');
      service.setSectionAnswers('HC', 'your-property', 'property', { bedrooms: 3 });

      const reloaded = reload();

      expect(reloaded.isStepComplete('PC', 'your-details')).toBe(true);
      expect(reloaded.sectionAnswers('HC', 'your-property', 'property')['bedrooms']).toBe(3);
    });

    it('forgets a module that was reset', () => {
      service.markStepComplete('PC', 'your-details');
      service.markStepComplete('HC', 'your-details');

      service.resetModule('PC');
      const reloaded = reload();

      expect(reloaded.isStepComplete('PC', 'your-details')).toBe(false);
      expect(reloaded.isStepComplete('HC', 'your-details')).toBe(true);
    });

    it('forgets everything after a full reset', () => {
      service.markStepComplete('PC', 'your-details');
      service.setSectionAnswers('HC', 'your-property', 'property', { bedrooms: 3 });

      service.resetAll();
      const reloaded = reload();

      expect(reloaded.isStepComplete('PC', 'your-details')).toBe(false);
      expect(reloaded.moduleAnswers('HC')).toEqual({});
    });

    it('ignores stored data that is not the shape we wrote', () => {
      // Storage is editable by hand, and must not be what decides which steps
      // a customer may open.
      sessionStorage.setItem('ngqb.journey.PC', '{"completedSteps":"everything"}');
      sessionStorage.setItem('ngqb.journey.HC', 'not json at all');

      const reloaded = reload();

      expect(reloaded.completedSteps('PC')).toEqual([]);
      expect(reloaded.moduleAnswers('HC')).toEqual({});
    });

    it('leaves other applications\u2019 storage alone', () => {
      sessionStorage.setItem('somebody-elses-key', 'keep me');
      service.markStepComplete('PC', 'your-details');

      service.resetAll();

      expect(sessionStorage.getItem('somebody-elses-key')).toBe('keep me');
    });
  });
});
