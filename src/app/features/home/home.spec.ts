import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home';
import { JourneySessionService } from '../../core/services/journey-session.service';
import { JourneyStateService } from '../../core/services/journey-state.service';

describe('HomeComponent', () => {
  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('clears journey session and answers on entry', () => {
    const journeySession = TestBed.inject(JourneySessionService);
    const journeyState = TestBed.inject(JourneyStateService);

    journeySession.ensureSession('HC');
    journeySession.setReference('HC', 'REF-HC', 'txn-hc');
    journeyState.setSectionAnswers('HC', 'your-details', 'proposer', { 'proposer-firstname': 'A' });
    journeyState.markStepComplete('HC', 'your-details');

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    expect(journeySession.session('HC')).toBeNull();
    expect(journeyState.moduleAnswers('HC')).toEqual({});
    expect(journeyState.isStepComplete('HC', 'your-details')).toBe(false);
  });
});
