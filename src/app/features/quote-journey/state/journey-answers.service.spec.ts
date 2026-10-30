import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { JourneyStateService } from './journey-state.service';
import { JourneyAnswersService } from './journey-answers.service';
import { getJourneyForModule } from '../journey-registry';

describe('JourneyAnswersService', () => {
  let answers: JourneyAnswersService;
  let state: JourneyStateService;

  beforeEach(() => {
    sessionStorage.clear();
    answers = TestBed.inject(JourneyAnswersService);
    state = TestBed.inject(JourneyStateService);
  });
  afterEach(() => sessionStorage.clear());

  function completeJourney(moduleCode = 'PC'): void {
    for (const step of getJourneyForModule(moduleCode)?.steps ?? []) {
      state.markStepComplete(moduleCode, step.name);
    }
  }

  it('revokes the edited step and later completion but preserves answers and other modules', () => {
    state.setSectionAnswers('PC', 'your-vehicle', 'vehicle', { annualMileage: 10000 });
    state.setSectionAnswers('PC', 'your-policy', 'policy', { licenseYearsHeld: 8 });
    completeJourney();
    completeJourney('HC');

    answers.setSectionAnswers('pc', 'your-vehicle', 'vehicle', { annualMileage: 12000 });

    expect(state.completedSteps('PC')).toEqual(['your-details']);
    expect(state.sectionAnswers('PC', 'your-policy', 'policy')['licenseYearsHeld']).toBe(8);
    expect(state.completedSteps('HC')).toHaveLength(6);
  });

  it('does not change state for structurally equal answers', () => {
    const value = { selected: { code: '1', description: 'One' }, items: [{ a: 1, b: 2 }] };
    answers.setSectionAnswers('PC', 'your-details', 'occupation', value);
    completeJourney();
    const unchanged = state.moduleAnswers('PC');

    answers.setSectionAnswers('PC', 'your-details', 'occupation', {
      items: [{ b: 2, a: 1 }],
      selected: { description: 'One', code: '1' },
      absent: undefined,
    });

    expect(state.completedSteps('PC')).toHaveLength(5);
    expect(state.moduleAnswers('PC')).toBe(unchanged);
  });

  it('batches sections and invalidation into one state update', () => {
    completeJourney();
    const write = vi.spyOn(state, 'setAnswers');
    answers.setAnswers('PC', {
      'your-policy': { policy: { licenseYearsHeld: 8 } },
      'your-details': {
        proposer: { dateOfBirth: '01/09/1990' },
        occupation: { employmentStatus: 'R' },
      },
    });
    expect(write).toHaveBeenCalledTimes(1);
    expect(state.completedSteps('PC')).toEqual([]);
    expect(JSON.parse(sessionStorage.getItem('ngqb.journey.PC') ?? '{}')).toMatchObject({
      completedSteps: [],
      answers: { 'your-details': { proposer: { dateOfBirth: '01/09/1990' } } },
    });
    write.mockRestore();
  });

  it('resolves duplicate field names by section, step and active module reactively', () => {
    state.setSectionAnswers('PC', 'your-details', 'proposer', { dateOfBirth: 'A' });
    state.setSectionAnswers('PC', 'additional-drivers', 'drivers', { dateOfBirth: 'B' });
    state.setSectionAnswers('GV', 'your-details', 'proposer', { dateOfBirth: 'C' });
    const reader = answers.reader('pc');
    const reference = { step: 'your-details', section: 'proposer', field: 'dateOfBirth' };
    const value = computed(() => reader(reference));
    expect(value()).toBe('A');
    expect(answers.reader('GV')(reference)).toBe('C');
    answers.setSectionAnswers('PC', 'your-details', 'proposer', { dateOfBirth: 'D' });
    expect(value()).toBe('D');
  });

  it('rejects unknown modules, steps and sections without writing answers', () => {
    expect(() => answers.reader('ZZ')).toThrow(/Unknown module/);
    expect(() => answers.setSectionAnswers('PC', 'typo', 'proposer', {})).toThrow(/Unknown step/);
    expect(() => answers.setSectionAnswers('PC', 'your-details', 'typo', {})).toThrow(
      /Unknown step/,
    );
    expect(state.moduleAnswers('PC')).toEqual({});
  });

  it('restores invalidated completion and keeps equal writes harmless after reload', () => {
    answers.setSectionAnswers('PC', 'your-vehicle', 'vehicle', { annualMileage: 10000 });
    completeJourney();
    answers.setSectionAnswers('PC', 'your-vehicle', 'vehicle', { annualMileage: 12000 });
    TestBed.resetTestingModule();
    state = TestBed.inject(JourneyStateService);
    answers = TestBed.inject(JourneyAnswersService);
    expect(state.completedSteps('PC')).toEqual(['your-details']);
    expect(state.sectionAnswers('PC', 'your-vehicle', 'vehicle')['annualMileage']).toBe(12000);

    state.markStepComplete('PC', 'your-vehicle');
    answers.setSectionAnswers('PC', 'your-vehicle', 'vehicle', { annualMileage: 12000 });
    expect(state.completedSteps('PC')).toEqual(['your-details', 'your-vehicle']);
  });
});
