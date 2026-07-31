import { TestBed } from '@angular/core/testing';
import { FormWorkflowService } from '../../../../core/services/form-workflow.service';
import { QuoteRecallHydrationService } from './quote-recall-hydration.service';

describe('QuoteRecallHydrationService', () => {
  let service: QuoteRecallHydrationService;
  let workflowService: FormWorkflowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuoteRecallHydrationService);
    workflowService = TestBed.inject(FormWorkflowService);
  });

  it('maps known recall fields and stores prepopulated workflow step data', () => {
    const result = service.hydrateAndStore('GV', {
      data: {
        'proposer-name-forenames': 'Test',
        'proposer-name-surname': 'Xyz',
        'proposer-dateofbirth': '28/10/1984',
        'proposer-email': 'test@example.com',
        'proposer-daytimetelephone': '07000000000',
        'proposer-address-addressline1': '1 Talbot Road',
        'proposer-address-addressline2': 'Old Trafford',
        'proposer-address-addressline3': 'Manchester',
        'proposer-address-postcode': 'M16 0PQ',
        'vehicle-regnumber': 'EF56ODM',
        'policy-totalmileage': '12000',
        'vehicle-wherekept': 'G',
        'policy-inceptiondate': '17/01/2022',
        'policy-cover': 'C',
        'policy-volxs': '0',
        unknown_extra: 'left-unresolved',
      },
    });

    expect(workflowService.getStepValue('GV:your-details')).toEqual({
      'proposer-name-forenames': 'Test',
      'proposer-name-surname': 'Xyz',
      'proposer-dateofbirth': '28/10/1984',
      'proposer-email': 'test@example.com',
      'proposer-daytimetelephone': '07000000000',
      addressLine1: '1 Talbot Road',
      addressLine2: 'Old Trafford',
      addressLine3: 'Manchester',
      postcode: 'M16 0PQ',
    });

    expect(workflowService.getStepValue('GV:your-vehicle')).toEqual({
      'vehicle-regnumber': 'EF56ODM',
      'policy-totalmileage': 12000,
      'vehicle-wherekept': 'garage',
    });

    expect(workflowService.getStepValue('GV:your-policy')).toEqual({
      'policy-inceptiondate': '17/01/2022',
      'policy-cover': 'comprehensive',
      'policy-volxs': 0,
    });

    expect(result.unresolvedFields['unknown_extra']).toBe('left-unresolved');
  });

  it('supports alias fallback for legacy field keys', () => {
    const result = service.mapRecallToJourneySteps('PC', {
      data: {
        firstName: 'LegacyFirstName',
        lastName: 'LegacyLastName',
      },
    });

    expect(result.hydratedSteps['your-details']).toEqual({
      'proposer-name-forenames': 'LegacyFirstName',
      'proposer-name-surname': 'LegacyLastName',
    });
  });
});
