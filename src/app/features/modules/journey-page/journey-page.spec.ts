import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from '../../../app';
import { routes } from '../../../app.routes';
import { JourneyStateService } from '../../../core/services/journey-state.service';

const VALID_VEHICLE_ANSWERS = {
  registration: 'AB12CDE',
  vehicleUse: 'sdp',
  annualMileage: 12000,
  overnightLocation: 'driveway',
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
      '#registration',
    ) as HTMLInputElement | null;

    expect(registration?.value).toBe('AB12CDE');
  });

  it('hides the proposer questions until an address is resolved', async () => {
    const withoutAddress = await renderAt('/PC/your-details');
    expect((withoutAddress.nativeElement as HTMLElement).querySelector('#email')).toBeNull();

    journeyState.setSectionAnswers('PC', 'your-details', 'address', RESOLVED_ADDRESS);
    withoutAddress.detectChanges();
    await withoutAddress.whenStable();

    expect(
      (withoutAddress.nativeElement as HTMLElement).querySelector('#email'),
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

  it('renders every fields section with the Signal Forms renderer', async () => {
    for (const step of ['your-vehicle', 'additional-drivers', 'your-policy']) {
      const fixture = await renderAt(`/PC/${step}`);
      const host = fixture.nativeElement as HTMLElement;

      expect(host.querySelector('app-signal-form')).not.toBeNull();
      // The reactive renderer is gone; nothing should reintroduce it.
      expect(host.querySelector('app-dynamic-form')).toBeNull();
    }
  });

  it('renders the address section forms with the Signal Forms renderer too', async () => {
    const fixture = await renderAt('/PC/your-details');
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('app-address-section app-signal-form')).not.toBeNull();
    expect(host.textContent).toContain('Find address');
  });

  it('renders every field type of the Signal Forms section', async () => {
    const fixture = await renderAt('/PC/your-policy');
    const host = fixture.nativeElement as HTMLElement;

    // date rendered as text, radio group, numbers with prefix/suffix, and a checkbox.
    expect(host.querySelector('#startDate')).not.toBeNull();
    expect(host.querySelectorAll('input[type=radio]').length).toBe(3);
    expect(host.querySelector('#voluntaryExcess')).not.toBeNull();
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
      startDate: '01/09/2026',
      coverType: 'comprehensive',
      voluntaryExcess: 250,
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
      startDate: '31/02/2026',
      coverType: 'comprehensive',
      voluntaryExcess: 250,
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

  it('hides the driver list until additional drivers are declared', async () => {
    const fixture = await renderAt('/PC/additional-drivers');
    const host = fixture.nativeElement as HTMLElement;

    // Defaults to no, so the list is not shown.
    expect(host.querySelector('app-repeat-section')).toBeNull();

    journeyState.setSectionAnswers('PC', 'additional-drivers', 'drivers', {
      hasAdditionalDrivers: 'yes',
      noClaimsBonusYears: '3',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.querySelector('app-repeat-section')).not.toBeNull();
    expect(host.textContent).toContain('Additional driver 1');
  });

  it('adds and removes drivers up to the slots available', async () => {
    journeyState.setSectionAnswers('PC', 'additional-drivers', 'drivers', {
      hasAdditionalDrivers: 'yes',
      noClaimsBonusYears: '3',
    });

    const fixture = await renderAt('/PC/additional-drivers');
    const host = fixture.nativeElement as HTMLElement;

    const addButton = () =>
      Array.from(host.querySelectorAll('button')).find(button =>
        button.textContent?.includes('Add another'),
      ) as HTMLButtonElement | undefined;

    expect(host.textContent).toContain('Additional driver 1');

    addButton()?.click();
    fixture.detectChanges();
    expect(host.textContent).toContain('Additional driver 2');

    addButton()?.click();
    fixture.detectChanges();
    expect(host.textContent).toContain('Additional driver 3');

    // Three slots beyond the proposer, so no fourth.
    expect(addButton()).toBeUndefined();
    expect(host.textContent).toContain('up to 3 additional drivers');

    const removeButton = Array.from(host.querySelectorAll('button')).find(button =>
      button.textContent?.includes('Remove'),
    ) as HTMLButtonElement | undefined;
    removeButton?.click();
    fixture.detectChanges();

    expect(host.textContent).not.toContain('Additional driver 3');
    expect(addButton()).toBeDefined();
  });

  it('drives the property journey from the same shell', async () => {
    const fixture = await renderAt('/HC/your-property');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Your property');
    expect(text).toContain('Step 2 of 6');
    expect(text).toContain('Property details');
  });
});
