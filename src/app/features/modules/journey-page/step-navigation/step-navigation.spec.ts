import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { JourneyStepDefinition } from '../../../../core/models/journey.model';
import { MOTOR_JOURNEY } from '../../journeys/motor.journey';
import { StepNavigationComponent } from './step-navigation';

const STEPS = MOTOR_JOURNEY.steps;

describe('StepNavigationComponent', () => {
  let fixture: ComponentFixture<StepNavigationComponent>;
  let component: StepNavigationComponent;

  async function render(
    currentStepName: string | null,
    completedStepNames: readonly string[] = [],
  ): Promise<void> {
    fixture = TestBed.createComponent(StepNavigationComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('steps', STEPS);
    fixture.componentRef.setInput('currentStepName', currentStepName);
    fixture.componentRef.setInput('completedStepNames', completedStepNames);

    fixture.detectChanges();
    await fixture.whenStable();
  }

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  /** A step's button on the desktop rail, by position. */
  function railButton(position: number): HTMLButtonElement {
    return host().querySelector(
      `.step-navigation__step-body[aria-label^="Step ${position} "]`,
    ) as HTMLButtonElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepNavigationComponent],
      // BrandService derives the active module from router events.
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('draws one marker per step, numbered in journey order', async () => {
    await render('your-details');

    const badges = Array.from(host().querySelectorAll('.marker__badge')).map((badge) =>
      badge.textContent?.trim(),
    );

    expect(badges).toEqual(STEPS.map((_, index) => `${index + 1}`));
  });

  it('shows each step icon, and a tick once the step is complete', async () => {
    await render('your-vehicle', ['your-details']);

    expect(railButton(1).querySelector('i')?.className).toContain('fa-check');
    expect(railButton(2).querySelector('i')?.className).toContain(`fa-${STEPS[1].icon}`);
    expect(railButton(3).querySelector('i')?.className).toContain(`fa-${STEPS[2].icon}`);
  });

  it('describes each step for a screen reader, including why it cannot be opened', async () => {
    await render('your-vehicle', ['your-details']);

    expect(railButton(1).getAttribute('aria-label')).toBe('Step 1 of 5: Your details, completed');
    expect(railButton(2).getAttribute('aria-label')).toBe(
      'Step 2 of 5: Your vehicle, current step',
    );
    // Where Continue goes, so it is offered from here.
    expect(railButton(3).getAttribute('aria-label')).toBe(
      'Step 3 of 5: Additional drivers, available',
    );
    expect(railButton(4).getAttribute('aria-label')).toBe(
      'Step 4 of 5: Your policy, locked, complete the earlier steps first',
    );
  });

  it('marks the current step and disables the ones that cannot be opened', async () => {
    await render('your-vehicle', ['your-details']);

    expect(railButton(2).getAttribute('aria-current')).toBe('step');
    expect(railButton(1).getAttribute('aria-current')).toBeNull();

    // Current and locked alike have nowhere to go.
    expect(railButton(2).getAttribute('aria-disabled')).toBe('true');
    expect(railButton(4).getAttribute('aria-disabled')).toBe('true');
    expect(railButton(1).getAttribute('aria-disabled')).toBeNull();
    expect(railButton(3).getAttribute('aria-disabled')).toBeNull();
  });

  it('reports the step the customer chose', async () => {
    await render('your-vehicle', ['your-details']);

    const selected: JourneyStepDefinition[] = [];
    component.stepSelected.subscribe((step) => selected.push(step));

    railButton(1).click();

    expect(selected.map((step) => step.name)).toEqual(['your-details']);
  });

  it('reports nothing for a locked or current step', async () => {
    await render('your-vehicle', ['your-details']);

    const selected: JourneyStepDefinition[] = [];
    component.stepSelected.subscribe((step) => selected.push(step));

    railButton(2).click();
    railButton(4).click();
    railButton(5).click();

    expect(selected).toEqual([]);
  });

  it('offers the step after the current one so it can act as Continue', async () => {
    await render('your-vehicle', ['your-details']);

    const selected: JourneyStepDefinition[] = [];
    component.stepSelected.subscribe((step) => selected.push(step));

    railButton(3).click();

    expect(selected.map((step) => step.name)).toEqual(['additional-drivers']);
  });

  it('opens up one more step once the current one is complete', async () => {
    await render('your-vehicle', ['your-details', 'your-vehicle']);

    expect(railButton(3).getAttribute('aria-label')).toContain('available');
    // Two ahead is still out of reach.
    expect(railButton(4).getAttribute('aria-disabled')).toBe('true');
  });

  it('names the current step and the one after it on small screens', async () => {
    await render('your-vehicle', ['your-details']);
    const summary = host().querySelector('.step-navigation__summary') as HTMLElement;

    expect(summary.textContent).toContain('Your vehicle');
    expect(summary.textContent).toContain('Next: Additional drivers');
    expect(host().querySelector('.step-navigation__dial-label')?.textContent).toContain('2 of 5');
  });

  it('says so rather than promising another step at the end', async () => {
    await render(
      'your-quotes',
      STEPS.slice(0, 4).map((step) => step.name),
    );

    expect(host().querySelector('.step-navigation__summary')?.textContent).toContain('Final step');
  });

  it('measures progress by answers given, not by how far the URL has got', async () => {
    // Two of five behind them, and standing in a third they have not finished.
    await render('additional-drivers', ['your-details', 'your-vehicle']);

    expect(component.progressPercent()).toBe(50);
  });

  it('toggles the small-screen list, and closes it once a step is chosen', async () => {
    await render('your-vehicle', ['your-details']);
    const summary = host().querySelector('.step-navigation__summary') as HTMLButtonElement;

    expect(component.isExpanded()).toBe(false);
    expect(summary.getAttribute('aria-expanded')).toBe('false');

    summary.click();
    fixture.detectChanges();
    expect(component.isExpanded()).toBe(true);
    expect((host().querySelector('#journey-step-list') as HTMLElement).hidden).toBe(false);

    (host().querySelector('.step-navigation__row') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(component.isExpanded()).toBe(false);
  });

  it('keeps the list in the document so aria-controls always resolves', async () => {
    await render('your-vehicle', ['your-details']);
    const summary = host().querySelector('.step-navigation__summary') as HTMLElement;

    expect(summary.getAttribute('aria-controls')).toBe('journey-step-list');
    expect(host().querySelector('#journey-step-list')).not.toBeNull();
  });
});
