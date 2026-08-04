import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from '../../../app';
import { routes } from '../../../app.routes';
import { JourneyStateService } from '../../../core/services/journey-state.service';

const VALID_VEHICLE_ANSWERS = {
  'vehicle-regnumber': 'AB12CDE',
  vehicleUse: 'sdp',
  'policy-totalmileage': 12000,
  'vehicle-wherekept': 'driveway',
};

const RESOLVED_ADDRESS = {
  postcode: 'M16 0PQ',
  addressLine1: '17 Talbot Road',
  houseNameNumber: '17',
  addressLine2: '',
  addressLine3: '',
  addressLine4: 'Manchester',
};

describe('journey flow', () => {
  let router: Router;
  let journeyState: JourneyStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();

    router = TestBed.inject(Router);
    journeyState = TestBed.inject(JourneyStateService);
    journeyState.resetAll();
  });

  async function renderAt(url: string): Promise<ComponentFixture<App>> {
    await router.navigateByUrl(url);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function continueButton(fixture: ComponentFixture<App>): HTMLButtonElement | null {
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ) as HTMLButtonElement[];
    return buttons.find(button => button.getAttribute('aria-label')?.startsWith('Continue')) ?? null;
  }

  it('renders the step heading and progress from the journey definition', async () => {
    const fixture = await renderAt('/PC/your-vehicle');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Your vehicle');
    expect(text).toContain('Step 2 of 5');
    // Section titles come from configuration, not from a per-step component.
    expect(text).toContain('Vehicle details');
  });

  it('advances to the next step and records completion when the step is valid', async () => {
    journeyState.setSectionAnswers('PC', 'your-vehicle', 'vehicle', VALID_VEHICLE_ANSWERS);

    const fixture = await renderAt('/PC/your-vehicle');
    continueButton(fixture)?.click();
    await fixture.whenStable();

    expect(router.url).toContain('/PC/additional-drivers');
    expect(journeyState.isStepComplete('PC', 'your-vehicle')).toBe(true);
  });

  it('keeps the customer on the step when a required answer is missing', async () => {
    const fixture = await renderAt('/PC/your-vehicle');

    continueButton(fixture)?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toContain('/PC/your-vehicle');
    expect(journeyState.isStepComplete('PC', 'your-vehicle')).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('is required');
  });

  it('persists answers the customer typed so returning to a step restores them', async () => {
    journeyState.setSectionAnswers('PC', 'your-vehicle', 'vehicle', VALID_VEHICLE_ANSWERS);

    const fixture = await renderAt('/PC/your-vehicle');
    const registration = (fixture.nativeElement as HTMLElement).querySelector(
      '#vehicle-regnumber',
    ) as HTMLInputElement | null;

    expect(registration?.value).toBe('AB12CDE');
  });

  it('hides the proposer questions until an address is resolved', async () => {
    const withoutAddress = await renderAt('/PC/your-details');
    expect((withoutAddress.nativeElement as HTMLElement).querySelector('#proposer-email')).toBeNull();

    journeyState.setSectionAnswers('PC', 'your-details', 'address', RESOLVED_ADDRESS);
    withoutAddress.detectChanges();
    await withoutAddress.whenStable();

    expect(
      (withoutAddress.nativeElement as HTMLElement).querySelector('#proposer-email'),
    ).not.toBeNull();
  });

  it('blocks the first step until the address section is satisfied', async () => {
    const fixture = await renderAt('/PC/your-details');

    continueButton(fixture)?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toContain('/PC/your-details');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Please resolve your address',
    );
  });

  it('renders the outcome step with quotes instead of questions', async () => {
    const fixture = await renderAt('/PC/your-quotes');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Demo quotes');
    expect(text).toContain('Final step reached');
    expect(continueButton(fixture)).toBeNull();
  });

  it('renders the migrated section with the Signal Forms engine, others with the reactive one', async () => {
    const policyStep = await renderAt('/PC/your-policy');
    expect((policyStep.nativeElement as HTMLElement).querySelector('app-signal-form')).not.toBeNull();
    expect((policyStep.nativeElement as HTMLElement).querySelector('app-dynamic-form')).toBeNull();

    const vehicleStep = await renderAt('/PC/your-vehicle');
    expect((vehicleStep.nativeElement as HTMLElement).querySelector('app-dynamic-form')).not.toBeNull();
    expect((vehicleStep.nativeElement as HTMLElement).querySelector('app-signal-form')).toBeNull();
  });

  it('renders every field type of the Signal Forms section', async () => {
    const fixture = await renderAt('/PC/your-policy');
    const host = fixture.nativeElement as HTMLElement;

    // date rendered as text, radio group, numbers with prefix/suffix, and a checkbox.
    expect(host.querySelector('#policy-inceptiondate')).not.toBeNull();
    expect(host.querySelectorAll('input[type=radio]').length).toBe(3);
    expect(host.querySelector('#policy-volxs')).not.toBeNull();
    expect(host.querySelector('#licenseYearsHeld')).not.toBeNull();
    expect(host.querySelector('#declarationAccepted')).not.toBeNull();
    // The radio group is named by a real legend, as the reactive renderer is.
    expect(host.querySelector('fieldset legend')?.textContent).toContain('Level of cover');
  });

  it('blocks the Signal Forms section when required answers are missing', async () => {
    const fixture = await renderAt('/PC/your-policy');

    continueButton(fixture)?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toContain('/PC/your-policy');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('is required');
  });

  it('advances past the Signal Forms section once it is valid', async () => {
    journeyState.setSectionAnswers('PC', 'your-policy', 'policy', {
      'policy-inceptiondate': '01/09/2026',
      'policy-cover': 'comprehensive',
      'policy-volxs': 250,
      licenseYearsHeld: 8,
      declarationAccepted: true,
    });

    const fixture = await renderAt('/PC/your-policy');
    continueButton(fixture)?.click();
    await fixture.whenStable();

    expect(router.url).toContain('/PC/your-quotes');
    expect(journeyState.isStepComplete('PC', 'your-policy')).toBe(true);
  });

  it('rejects an invalid date through the bridged validator', async () => {
    journeyState.setSectionAnswers('PC', 'your-policy', 'policy', {
      'policy-inceptiondate': '31/02/2026',
      'policy-cover': 'comprehensive',
      'policy-volxs': 250,
      licenseYearsHeld: 8,
      declarationAccepted: true,
    });

    const fixture = await renderAt('/PC/your-policy');
    continueButton(fixture)?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toContain('/PC/your-policy');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Enter a valid date in DD/MM/YYYY format.',
    );
  });

  it('drives the property journey from the same shell', async () => {
    const fixture = await renderAt('/HC/your-property');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Your property');
    expect(text).toContain('Step 2 of 6');
    expect(text).toContain('Property details');
  });
});
