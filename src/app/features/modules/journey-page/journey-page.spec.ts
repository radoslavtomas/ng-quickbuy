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

  /**
   * Finds a control by its configured field name.
   *
   * Element ids are scoped to the rendered section so a repeat section cannot emit
   * duplicates, which makes them unstable to assert on; `data-field` is the stable
   * hook.
   */
  function field(fixture: ComponentFixture<App>, name: string): HTMLElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector(`[data-field="${name}"]`);
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
    const registration = field(fixture, 'registration') as HTMLInputElement | null;

    expect(registration?.value).toBe('AB12CDE');
  });

  // it('hides the proposer questions until an address is resolved', async () => {
  //   const withoutAddress = await renderAt('/PC/your-details');
  //   expect(field(withoutAddress, 'email')).toBeNull();

  //   journeyState.setSectionAnswers('PC', 'your-details', 'address', RESOLVED_ADDRESS);
  //   withoutAddress.detectChanges();
  //   await withoutAddress.whenStable();

  //   expect(field(withoutAddress, 'email')).not.toBeNull();
  // });

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

  it('asks for an occupation from ordinary field configuration, not a bespoke section', async () => {
    journeyState.setSectionAnswers('PC', 'your-details', 'address', RESOLVED_ADDRESS);

    const fixture = await renderAt('/PC/your-details');

    expect(field(fixture, 'employmentStatus')).not.toBeNull();
    // Nothing further is asked until we know the status.
    expect(field(fixture, 'occupation')).toBeNull();
    expect(field(fixture, 'occupationFte')).toBeNull();
  });

  it('asks how to describe the occupation according to the employment status', async () => {
    journeyState.setSectionAnswers('PC', 'your-details', 'address', RESOLVED_ADDRESS);
    journeyState.setSectionAnswers('PC', 'your-details', 'occupation', {
      employmentStatus: 'E',
    });

    const employed = await renderAt('/PC/your-details');
    expect(employed.nativeElement.querySelectorAll('app-autocomplete-input').length).toBe(2);
    expect(field(employed, 'occupationFte')).toBeNull();

    journeyState.setSectionAnswers('PC', 'your-details', 'occupation', {
      employmentStatus: 'FTE',
    });

    const studying = await renderAt('/PC/your-details');
    expect(field(studying, 'occupationFte')).not.toBeNull();
    expect(studying.nativeElement.querySelectorAll('app-autocomplete-input').length).toBe(0);
  });

  it('asks a retired customer nothing further, because the status says it all', async () => {
    journeyState.setSectionAnswers('PC', 'your-details', 'address', RESOLVED_ADDRESS);
    journeyState.setSectionAnswers('PC', 'your-details', 'occupation', {
      employmentStatus: 'R',
    });

    const fixture = await renderAt('/PC/your-details');

    expect(field(fixture, 'occupation')).toBeNull();
    expect(field(fixture, 'occupationFte')).toBeNull();
    // The second-job question still applies to them.
    expect(field(fixture, 'hasParttime')).not.toBeNull();
  });

  it('offers a limited company to a van customer only', async () => {
    journeyState.setSectionAnswers('GV', 'your-details', 'address', RESOLVED_ADDRESS);
    const van = await renderAt('/GV/your-details');
    expect(field(van, 'employmentStatus')?.textContent).toContain('Limited Company');

    journeyState.setSectionAnswers('PC', 'your-details', 'address', RESOLVED_ADDRESS);
    const car = await renderAt('/PC/your-details');
    expect(field(car, 'employmentStatus')?.textContent).not.toContain('Limited Company');
  });

  it('renders every field type of the Signal Forms section', async () => {
    const fixture = await renderAt('/PC/your-policy');
    const host = fixture.nativeElement as HTMLElement;

    // date rendered as text, radio group, numbers with prefix/suffix, and a checkbox.
    expect(field(fixture, 'startDate')).not.toBeNull();
    expect(host.querySelectorAll('input[type=radio]').length).toBe(3);
    expect(field(fixture, 'voluntaryExcess')).not.toBeNull();
    expect(field(fixture, 'licenseYearsHeld')).not.toBeNull();
    expect(field(fixture, 'declarationAccepted')).not.toBeNull();
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

  it('asks nothing about a joint proposer until one is declared', async () => {
    const fixture = await renderAt('/HC/joint-proposer');

    expect(field(fixture, 'hasJointProposer')).not.toBeNull();
    expect(field(fixture, 'forenames')).toBeNull();
    expect(field(fixture, 'employmentStatus')).toBeNull();
  });

  it('does not let unanswered joint proposer questions block the step', async () => {
    // Defaults to no, so every question about them is hidden and cannot object.
    const fixture = await renderAt('/HC/joint-proposer');

    continueButton(fixture)?.click();
    await fixture.whenStable();

    expect(router.url).toContain('/HC/your-policy');
    expect(journeyState.isStepComplete('HC', 'joint-proposer')).toBe(true);
  });

  it('asks a declared joint proposer for their occupation as well as their name', async () => {
    journeyState.setSectionAnswers('HC', 'joint-proposer', 'jointProposer', {
      hasJointProposer: 'yes',
      employmentStatus: 'E',
    });

    const fixture = await renderAt('/HC/joint-proposer');

    expect(field(fixture, 'forenames')).not.toBeNull();
    expect(field(fixture, 'surname')).not.toBeNull();
    expect(field(fixture, 'dateOfBirth')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('app-autocomplete-input').length).toBe(2);
  });

  describe('property risk address', () => {
    function radioInput(
      fixture: ComponentFixture<App>,
      name: string,
      value: string,
    ): HTMLInputElement | null {
      const inputs = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll(`[data-field="${name}"]`),
      ) as HTMLInputElement[];
      return inputs.find(input => input.value === value) ?? null;
    }

    function changeAddressButton(fixture: ComponentFixture<App>): HTMLButtonElement | undefined {
      return Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
      ).find(button => button.textContent?.includes('Change address')) as
        | HTMLButtonElement
        | undefined;
    }

    it('does not ask about the risk address until the correspondence address is resolved', async () => {
      const fixture = await renderAt('/HC/your-details');
      expect(field(fixture, 'riskAddressMatches')).toBeNull();
    });

    it('never asks a motor customer about a risk address', async () => {
      journeyState.setSectionAnswers('PC', 'your-details', 'address', RESOLVED_ADDRESS);
      const fixture = await renderAt('/PC/your-details');
      expect(field(fixture, 'riskAddressMatches')).toBeNull();
    });

    it('derives the risk address from the correspondence address when the answer is yes', async () => {
      journeyState.setSectionAnswers('HC', 'your-details', 'address', RESOLVED_ADDRESS);
      const fixture = await renderAt('/HC/your-details');

      radioInput(fixture, 'riskAddressMatches', 'yes')?.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const stored = journeyState.sectionAnswers('HC', 'your-details', 'address');
      expect(stored['riskAddressLine1']).toBe(RESOLVED_ADDRESS.addressLine1);
      expect(stored['riskAddressLine4']).toBe(RESOLVED_ADDRESS.addressLine4);
      expect(stored['riskPostcode']).toBe(RESOLVED_ADDRESS.postcode);
    });

    it('reveals a fresh address search for the risk address when the answer is no', async () => {
      journeyState.setSectionAnswers('HC', 'your-details', 'address', RESOLVED_ADDRESS);
      const fixture = await renderAt('/HC/your-details');

      radioInput(fixture, 'riskAddressMatches', 'no')?.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(
        (fixture.nativeElement as HTMLElement).querySelectorAll('app-address-search').length,
      ).toBe(2);
    });

    it('drops the derived risk address when the customer changes their answer to no', async () => {
      journeyState.setSectionAnswers('HC', 'your-details', 'address', RESOLVED_ADDRESS);
      const fixture = await renderAt('/HC/your-details');

      radioInput(fixture, 'riskAddressMatches', 'yes')?.click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(
        journeyState.sectionAnswers('HC', 'your-details', 'address')['riskAddressLine1'],
      ).toBe(RESOLVED_ADDRESS.addressLine1);

      radioInput(fixture, 'riskAddressMatches', 'no')?.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const stored = journeyState.sectionAnswers('HC', 'your-details', 'address');
      expect(stored['riskAddressLine1']).toBeUndefined();
      expect(stored['riskAddressMatches']).toBe('no');
    });

    it('resets the risk address once the customer starts editing the correspondence address', async () => {
      journeyState.setSectionAnswers('HC', 'your-details', 'address', RESOLVED_ADDRESS);
      const fixture = await renderAt('/HC/your-details');

      radioInput(fixture, 'riskAddressMatches', 'yes')?.click();
      fixture.detectChanges();
      await fixture.whenStable();

      changeAddressButton(fixture)?.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const stored = journeyState.sectionAnswers('HC', 'your-details', 'address');
      expect(stored['riskAddressMatches']).toBeUndefined();
      expect(stored['riskAddressLine1']).toBeUndefined();
      expect(field(fixture, 'riskAddressMatches')).toBeNull();
    });
  });
});
