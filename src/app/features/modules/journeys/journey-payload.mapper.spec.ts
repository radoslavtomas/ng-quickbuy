import type { JourneyAnswers } from '../../../core/models/journey-payload.model';
import { MOTOR_PAYLOAD_MAPPER, PROPERTY_PAYLOAD_MAPPER } from './journey-payload.mapper';

const MOTOR_ANSWERS: JourneyAnswers = {
  'your-details': {
    address: { postcode: 'M16 0PQ', addressLine1: '17 Talbot Road', addressLine2: '' },
    proposer: { 'proposer-name-forenames': 'Alex', 'proposer-email': 'alex@example.com' },
  },
  'your-vehicle': {
    vehicle: { 'vehicle-regnumber': 'AB12CDE', 'policy-totalmileage': 12000 },
  },
  'your-policy': {
    policy: { 'policy-cover': 'comprehensive', declarationAccepted: true },
  },
};

describe('journey payload mappers', () => {
  it('identifies its contract version', () => {
    expect(MOTOR_PAYLOAD_MAPPER.version).toBe('motor-1');
    expect(PROPERTY_PAYLOAD_MAPPER.version).toBe('property-1');
  });

  it('flattens every section of every step into wire fields', () => {
    const fields = MOTOR_PAYLOAD_MAPPER.toStoreFields(MOTOR_ANSWERS);

    expect(fields['postcode']).toBe('M16 0PQ');
    expect(fields['proposer-name-forenames']).toBe('Alex');
    expect(fields['vehicle-regnumber']).toBe('AB12CDE');
    expect(fields['policy-cover']).toBe('comprehensive');
  });

  it('sends numbers as strings, because the endpoints take form data', () => {
    expect(MOTOR_PAYLOAD_MAPPER.toStoreFields(MOTOR_ANSWERS)['policy-totalmileage']).toBe('12000');
  });

  it('sends booleans as Y and N', () => {
    const fields = MOTOR_PAYLOAD_MAPPER.toStoreFields({
      'your-policy': { policy: { declarationAccepted: true, claimsDisclosureAccepted: false } },
    });

    expect(fields['declarationAccepted']).toBe('Y');
    expect(fields['claimsDisclosureAccepted']).toBe('N');
  });

  it('omits empty answers rather than sending blanks', () => {
    const fields = MOTOR_PAYLOAD_MAPPER.toStoreFields({
      'your-details': {
        address: { addressLine2: '', addressLine3: null, addressLine4: undefined, postcode: 'M1 1AA' },
      },
    });

    expect(Object.keys(fields)).toEqual(['postcode']);
  });

  it('keeps zero, which is a real answer rather than an absent one', () => {
    const fields = MOTOR_PAYLOAD_MAPPER.toStoreFields({
      'your-policy': { policy: { 'policy-volxs': 0 } },
    });

    expect(fields['policy-volxs']).toBe('0');
  });

  it('produces nothing for a journey with no answers', () => {
    expect(MOTOR_PAYLOAD_MAPPER.toStoreFields({})).toEqual({});
  });
});
