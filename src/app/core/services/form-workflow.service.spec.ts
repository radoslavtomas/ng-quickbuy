import { TestBed } from '@angular/core/testing';
import { FormWorkflowService } from './form-workflow.service';

describe('FormWorkflowService', () => {
  let service: FormWorkflowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormWorkflowService);
  });

  it('stores and retrieves step values by key', () => {
    service.setStepValue('TX:your-details', { firstName: 'Alex', email: 'alex@example.com' });

    expect(service.getStepValue('TX:your-details')).toEqual({ firstName: 'Alex', email: 'alex@example.com' });
    expect(service.getStepValue('TX:your-policy')).toEqual({});
  });

  it('merges journey values across steps', () => {
    service.setStepValue('TX:your-details', { firstName: 'Alex' });
    service.setStepValue('TX:your-vehicle', { registration: 'AB12CDE' });
    service.setStepValue('TX:your-policy', { coverType: 'comprehensive' });

    expect(service.journeyValue()).toEqual({
      firstName: 'Alex',
      registration: 'AB12CDE',
      coverType: 'comprehensive',
    });
  });

  it('clears a single step without removing other steps', () => {
    service.setStepValue('TX:your-details', { firstName: 'Alex' });
    service.setStepValue('TX:your-policy', { coverType: 'comprehensive' });

    service.clearStep('TX:your-policy');

    expect(service.getStepValue('TX:your-policy')).toEqual({});
    expect(service.getStepValue('TX:your-details')).toEqual({ firstName: 'Alex' });
  });

  it('maps server errors to field-level and summary buckets', () => {
    service.mapServerErrors({
      errors: [
        { field: 'email', message: 'Email is invalid.' },
        { field: 'email', message: 'Email domain is not allowed.' },
        { field: 'postcode', message: 'Postcode is invalid.' },
        { message: 'Quote unavailable right now.' },
      ],
    });

    expect(service.serverErrors()).toEqual({
      email: ['Email is invalid.', 'Email domain is not allowed.'],
      postcode: ['Postcode is invalid.'],
      _summary: ['Quote unavailable right now.'],
    });
  });

  it('clears all state', () => {
    service.setStepValue('TX:your-details', { firstName: 'Alex' });
    service.mapServerErrors({ errors: [{ field: 'email', message: 'Email is invalid.' }] });

    service.clearAll();

    expect(service.journeyValue()).toEqual({});
    expect(service.serverErrors()).toEqual({});
  });
});