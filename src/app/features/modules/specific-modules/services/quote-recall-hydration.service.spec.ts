import { TestBed } from '@angular/core/testing';
import { JourneyStateService } from '../../../../core/services/journey-state.service';
import { QuoteRecallHydrationService } from './quote-recall-hydration.service';

describe('QuoteRecallHydrationService', () => {
  let service: QuoteRecallHydrationService;
  let journeyState: JourneyStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuoteRecallHydrationService);
    journeyState = TestBed.inject(JourneyStateService);
  });

  it('maps recall values onto the sections that own them and stores them', () => {
    const result = service.hydrateAndStore('PC', {
      data: {
        'proposer-name-forenames': 'Alex',
        'proposer-address-addressline1': '17 Talbot Road',
        'proposer-address-postcode': 'M16 0PQ',
        'vehicle-regnumber': 'AB12CDE',
        'policy-cover': 'C',
        'policy-totalmileage': '12000',
      },
    });

    expect(result.hydratedSteps['your-details']['proposer']['proposer-name-forenames']).toBe('Alex');
    expect(result.hydratedSteps['your-details']['address']['addressLine1']).toBe('17 Talbot Road');
    expect(result.hydratedSteps['your-vehicle']['vehicle']['vehicle-regnumber']).toBe('AB12CDE');

    // Coded backend values become the option values the form actually uses.
    expect(result.hydratedSteps['your-policy']['policy']['policy-cover']).toBe('comprehensive');
    // Numbers arrive as strings over the wire.
    expect(result.hydratedSteps['your-vehicle']['vehicle']['policy-totalmileage']).toBe(12000);

    expect(journeyState.sectionAnswers('PC', 'your-vehicle', 'vehicle')['vehicle-regnumber']).toBe(
      'AB12CDE',
    );
  });

  it('resolves legacy alias keys to their current field names', () => {
    const result = service.mapRecallToJourney('PC', {
      data: { firstName: 'Jordan', registration: 'XY99ZZZ' },
    });

    expect(result.hydratedSteps['your-details']['proposer']['proposer-name-forenames']).toBe(
      'Jordan',
    );
    expect(result.hydratedSteps['your-vehicle']['vehicle']['vehicle-regnumber']).toBe('XY99ZZZ');
    expect(result.unresolvedFields).toEqual({});
  });

  it('reports keys that no section claims so contract drift is visible', () => {
    const result = service.mapRecallToJourney('PC', {
      data: { 'policy-somethingnobodyasked': 'X' },
    });

    expect(result.unresolvedFields).toEqual({ 'policy-somethingnobodyasked': 'X' });
  });

  it('hydrates nothing for a module outside the catalogue rather than guessing a journey', () => {
    const result = service.mapRecallToJourney('ZZ', {
      data: { 'proposer-name-forenames': 'Alex' },
    });

    expect(result.hydratedSteps).toEqual({});
    expect(result.unresolvedFields).toEqual({ 'proposer-name-forenames': 'Alex' });
  });

  it('keeps property answers out of motor steps', () => {
    const result = service.mapRecallToJourney('HC', {
      data: { propertyType: 'detached', bedrooms: '4' },
    });

    expect(result.hydratedSteps['your-property']['property']).toEqual({
      propertyType: 'detached',
      bedrooms: 4,
    });
    expect(result.hydratedSteps['your-vehicle']).toBeUndefined();
  });
});
