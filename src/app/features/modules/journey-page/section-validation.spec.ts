import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { FormFieldConfig } from '../../../core/models/form-field.model';
import type {
  JourneyFieldsSection,
  JourneyRepeatSection,
} from '../../../core/models/journey.model';
import { JourneyStateService } from '../../../core/services/journey-state.service';
import { SignalFormComponent } from '../../../shared/components/signal-form/signal-form';
import { SectionOutletComponent } from './section-outlet.component';
import { RepeatSectionComponent } from './sections/repeat-section.component';
import { AddressSectionComponent } from './sections/address-section.component';

const MATCH_SOURCE: readonly FormFieldConfig[] = [
  {
    type: 'text',
    label: 'Confirm surname',
    name: 'surname',
    validators: [
      {
        type: 'cross-field',
        name: 'matchesProposer',
        dependencies: { surname: { step: 'your-details', section: 'proposer', field: 'surname' } },
        message: 'Must match the proposer.',
        validate: (value, dependencies) =>
          value !== dependencies['surname'] ? { kind: 'matchesProposer' } : undefined,
      },
    ],
  },
];

@Component({
  selector: 'app-cross-section-test',
  imports: [SectionOutletComponent],
  template: `
    <app-section-outlet [section]="source" moduleCode="PC" stepName="your-details" />
    <app-section-outlet [section]="target" moduleCode="PC" stepName="your-details" />
  `,
})
class CrossSectionHost {
  readonly source: JourneyFieldsSection = {
    kind: 'fields',
    id: 'proposer',
    fields: [{ type: 'text', label: 'Surname', name: 'surname' }],
  };
  readonly target: JourneyFieldsSection = {
    kind: 'fields',
    id: 'occupation',
    fields: MATCH_SOURCE,
  };
}

@Component({
  selector: 'app-repeat-validation-test',
  imports: [RepeatSectionComponent],
  template: `<app-repeat-section
    [section]="section"
    moduleCode="PC"
    stepName="additional-drivers"
  />`,
})
class RepeatHost {
  readonly section: JourneyRepeatSection = {
    kind: 'repeat',
    id: 'additionalDrivers',
    itemLabel: 'Driver',
    itemFields: MATCH_SOURCE,
    slots: ['driver-2', 'driver-3'],
  };
}

describe('rendered cross-section dependencies', () => {
  let state: JourneyStateService;
  beforeEach(() => {
    sessionStorage.clear();
    state = TestBed.inject(JourneyStateService);
    state.setSectionAnswers('PC', 'your-details', 'proposer', { surname: 'Taylor' });
  });
  afterEach(() => sessionStorage.clear());

  it('updates errors across same-page sections without rebuilding or overwriting the consumer', async () => {
    state.setSectionAnswers('PC', 'your-details', 'occupation', { surname: 'Taylor' });
    const fixture = TestBed.createComponent(CrossSectionHost);
    await fixture.whenStable();
    const forms = fixture.debugElement
      .queryAll(By.directive(SignalFormComponent))
      .map((node) => node.componentInstance as SignalFormComponent);
    expect(forms[1].collect().valid).toBe(true);

    const source = fixture.nativeElement.querySelector(
      '[data-field="surname"]',
    ) as HTMLInputElement;
    source.value = 'Smith';
    source.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(forms[1].collect().valid).toBe(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Must match the proposer.');
    expect(forms[1].snapshot()['surname']).toBe('Taylor');
    expect(state.sectionAnswers('PC', 'your-details', 'occupation')['surname']).toBe('Taylor');

    source.value = 'Taylor';
    source.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(forms[1].collect().valid).toBe(true);
    expect(
      fixture.debugElement.queryAll(By.directive(SignalFormComponent))[1].componentInstance,
    ).toBe(forms[1]);
  });

  it('does not discard or accept a newly added item before its form has rendered', async () => {
    state.setSectionAnswers('PC', 'additional-drivers', 'additionalDrivers', {
      items: [{ surname: 'Taylor' }],
    });
    const fixture = TestBed.createComponent(RepeatHost);
    await fixture.whenStable();
    const repeat = fixture.debugElement.query(By.directive(RepeatSectionComponent))
      .componentInstance as RepeatSectionComponent;
    expect(repeat.collect().valid).toBe(true);
    repeat.addItem();
    expect(repeat.snapshot()).toEqual({ items: [{ surname: 'Taylor' }, {}] });
    expect(repeat.collect().valid).toBe(false);
    expect(
      state.sectionAnswers('PC', 'additional-drivers', 'additionalDrivers')['items'],
    ).toHaveLength(2);
    await fixture.whenStable();
    expect(repeat.collect().valid).toBe(false);
  });

  it('preserves an already resolved separate risk address when its question first emits', async () => {
    const value = {
      postcode: 'M16 0PQ',
      addressLine1: '17 Talbot Road',
      houseNameNumber: '17',
      addressLine4: 'Manchester',
      riskAddressMatches: 'no',
      riskPostcode: 'M1 1AA',
      riskAddressLine1: '1 Main Street',
      riskAddressLine4: 'Manchester',
    };
    state.setSectionAnswers('HC', 'your-details', 'address', value);
    state.markStepComplete('HC', 'your-details');
    const fixture = TestBed.createComponent(AddressSectionComponent);
    fixture.componentRef.setInput('moduleCode', 'HC');
    fixture.componentRef.setInput('stepName', 'your-details');
    fixture.componentRef.setInput('sectionId', 'address');
    fixture.componentRef.setInput('riskAddress', true);
    await fixture.whenStable();
    expect(state.sectionAnswers('HC', 'your-details', 'address')).toEqual(value);
    expect(state.isStepComplete('HC', 'your-details')).toBe(true);
    expect(fixture.componentInstance.collect().valid).toBe(true);
  });

  it('gives each repeat item an isolated model with the same external source', async () => {
    state.setSectionAnswers('PC', 'additional-drivers', 'additionalDrivers', {
      items: [{ surname: 'Taylor' }, { surname: 'Smith' }],
    });
    const fixture = TestBed.createComponent(RepeatHost);
    await fixture.whenStable();
    const forms = fixture.debugElement
      .queryAll(By.directive(SignalFormComponent))
      .map((node) => node.componentInstance as SignalFormComponent);
    expect(forms.map((form) => form.collect().valid)).toEqual([true, false]);

    state.setSectionAnswers('PC', 'your-details', 'proposer', { surname: 'Smith' });
    await fixture.whenStable();
    expect(forms.map((form) => form.collect().valid)).toEqual([false, true]);
    const repeat = fixture.debugElement.query(By.directive(RepeatSectionComponent))
      .componentInstance as RepeatSectionComponent;
    expect(repeat.snapshot()).toEqual({ items: [{ surname: 'Taylor' }, { surname: 'Smith' }] });
    expect(repeat.collect().valid).toBe(false);
  });
});
