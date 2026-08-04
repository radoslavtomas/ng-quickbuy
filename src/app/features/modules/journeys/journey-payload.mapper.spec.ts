import type { JourneyAnswers } from '../../../core/models/journey-payload.model';
import {
  ADDITIONAL_DRIVER_SLOTS,
  MOTOR_DRIVER_SLOTS,
  MOTOR_PAYLOAD_MAPPER,
  PROPERTY_PAYLOAD_MAPPER,
  PROPERTY_PROPOSER_SLOTS,
} from './journey-payload.mapper';

const MOTOR_ANSWERS: JourneyAnswers = {
  'your-details': {
    address: { postcode: 'M16 0PQ', addressLine1: '17 Talbot Road', addressLine2: '' },
    proposer: { forenames: 'Alex', email: 'alex@example.com' },
  },
  'your-vehicle': {
    vehicle: { registration: 'AB12CDE', annualMileage: 12000, overnightLocation: 'garage' },
  },
  'your-policy': {
    policy: { coverType: 'comprehensive', declarationAccepted: true },
  },
};

describe('journey payload mappers', () => {
  it('identifies its contract version', () => {
    expect(MOTOR_PAYLOAD_MAPPER.version).toBe('motor-1');
    expect(PROPERTY_PAYLOAD_MAPPER.version).toBe('property-1');
  });

  it('sends each answer under the insurer key rather than the internal name', () => {
    const fields = MOTOR_PAYLOAD_MAPPER.toStoreFields(MOTOR_ANSWERS);

    expect(fields['proposer-address-postcode']).toBe('M16 0PQ');
    expect(fields['proposer-name-forenames']).toBe('Alex');
    expect(fields['proposer-email']).toBe('alex@example.com');
    expect(fields['vehicle-regnumber']).toBe('AB12CDE');

    // Internal names must not leak onto the wire.
    expect(fields['forenames']).toBeUndefined();
    expect(fields['registration']).toBeUndefined();
  });

  it('translates coded values, not just names', () => {
    const fields = MOTOR_PAYLOAD_MAPPER.toStoreFields(MOTOR_ANSWERS);

    expect(fields['policy-cover']).toBe('C');
    expect(fields['vehicle-wherekept']).toBe('G');
  });

  it('round-trips a coded value back to the form representation', () => {
    expect(MOTOR_PAYLOAD_MAPPER.fromWireValueFor('coverType', 'TPFT')).toBe('tpft');
    expect(MOTOR_PAYLOAD_MAPPER.fromWireValueFor('overnightLocation', 'R')).toBe('roadside');
    // Unknown codes pass through rather than becoming undefined.
    expect(MOTOR_PAYLOAD_MAPPER.fromWireValueFor('coverType', 'ZZ')).toBe('ZZ');
  });

  it('maps names in both directions consistently', () => {
    for (const internal of ['forenames', 'registration', 'startDate', 'voluntaryExcess']) {
      const key = MOTOR_PAYLOAD_MAPPER.backendKeyFor(internal);
      expect(key).not.toBe(internal);
      expect(MOTOR_PAYLOAD_MAPPER.internalNameFor(key)).toBe(internal);
    }
  });

  it('passes through a name with no known insurer key', () => {
    expect(MOTOR_PAYLOAD_MAPPER.backendKeyFor('declarationAccepted')).toBe('declarationAccepted');
    expect(MOTOR_PAYLOAD_MAPPER.internalNameFor('somethingNew')).toBe('somethingNew');
  });

  it('files the proposer under the proposer slot', () => {
    // The existing keys were always slot-prefixed; this makes that explicit.
    expect(MOTOR_PAYLOAD_MAPPER.backendKeyFor('forenames')).toBe('proposer-name-forenames');
    expect(MOTOR_PAYLOAD_MAPPER.backendKeyFor('dateOfBirth')).toBe('proposer-dateofbirth');
    expect(MOTOR_PAYLOAD_MAPPER.backendKeyFor('postcode')).toBe('proposer-address-postcode');
  });

  it('files another person under their own slot, reusing the same field names', () => {
    expect(MOTOR_PAYLOAD_MAPPER.backendKeyForSlot('driver-2', 'forenames')).toBe(
      'driver-2-name-forenames',
    );
    expect(MOTOR_PAYLOAD_MAPPER.backendKeyForSlot('driver-4', 'dateOfBirth')).toBe(
      'driver-4-dateofbirth',
    );
    expect(PROPERTY_PAYLOAD_MAPPER.backendKeyForSlot('jointproposer', 'surname')).toBe(
      'jointproposer-name-surname',
    );
  });

  it('recognises any slot on the way back in', () => {
    expect(MOTOR_PAYLOAD_MAPPER.internalNameFor('driver-3-name-surname')).toBe('surname');
    expect(MOTOR_PAYLOAD_MAPPER.internalNameFor('proposer-dateofbirth')).toBe('dateOfBirth');
    expect(PROPERTY_PAYLOAD_MAPPER.internalNameFor('jointproposer-dateofbirth')).toBe('dateOfBirth');
  });

  it('exposes the slots each product allows, which is also the ceiling on people', () => {
    expect(MOTOR_PAYLOAD_MAPPER.personSlots).toEqual(MOTOR_DRIVER_SLOTS);
    expect(PROPERTY_PAYLOAD_MAPPER.personSlots).toEqual(PROPERTY_PROPOSER_SLOTS);

    // Four driver slots means the customer plus three others.
    expect(MOTOR_DRIVER_SLOTS).toHaveLength(4);
    expect(ADDITIONAL_DRIVER_SLOTS).toEqual(['driver-2', 'driver-3', 'driver-4']);
    // One joint proposer, never more.
    expect(PROPERTY_PROPOSER_SLOTS).toHaveLength(2);
  });

  it('does not treat a property policy as having driver slots', () => {
    expect(PROPERTY_PAYLOAD_MAPPER.internalNameFor('driver-2-name-surname')).toBe(
      'driver-2-name-surname',
    );
  });

  it('files list items under slots by position', () => {
    const fields = MOTOR_PAYLOAD_MAPPER.toStoreFields({
      'additional-drivers': {
        additionalDrivers: {
          items: [
            { forenames: 'Jordan', surname: 'Taylor', dateOfBirth: '01/09/1990' },
            { forenames: 'Sam', surname: 'Patel', dateOfBirth: '02/10/1985' },
          ],
        },
      },
    });

    expect(fields['driver-2-name-forenames']).toBe('Jordan');
    expect(fields['driver-2-dateofbirth']).toBe('01/09/1990');
    expect(fields['driver-3-name-forenames']).toBe('Sam');
    expect(fields['driver-3-name-surname']).toBe('Patel');

    // The customer's own slot is untouched by the list.
    expect(fields['proposer-name-forenames']).toBeUndefined();
  });

  it('re-packs slots when an item is removed', () => {
    // Three drivers, then the middle one removed: the survivors take slots 2 and 3.
    const fields = MOTOR_PAYLOAD_MAPPER.toStoreFields({
      'additional-drivers': {
        additionalDrivers: { items: [{ forenames: 'Jordan' }, { forenames: 'Ravi' }] },
      },
    });

    expect(fields['driver-2-name-forenames']).toBe('Jordan');
    expect(fields['driver-3-name-forenames']).toBe('Ravi');
    expect(fields['driver-4-name-forenames']).toBeUndefined();
  });

  it('drops items beyond the available slots rather than merging them', () => {
    const fields = MOTOR_PAYLOAD_MAPPER.toStoreFields({
      'additional-drivers': {
        additionalDrivers: {
          items: [
            { forenames: 'One' },
            { forenames: 'Two' },
            { forenames: 'Three' },
            { forenames: 'Overflow' },
          ],
        },
      },
    });

    expect(fields['driver-4-name-forenames']).toBe('Three');
    expect(Object.values(fields)).not.toContain('Overflow');
  });

  it('treats a section with no slot mapping as ordinary answers', () => {
    const fields = MOTOR_PAYLOAD_MAPPER.toStoreFields({
      'your-vehicle': { vehicle: { registration: 'AB12CDE' } },
    });

    expect(fields['vehicle-regnumber']).toBe('AB12CDE');
  });

  it('differs per product where the products differ', () => {
    // Cover type is a motor concept; property has no mapping or codes for it.
    expect(MOTOR_PAYLOAD_MAPPER.backendKeyFor('coverType')).toBe('policy-cover');
    expect(PROPERTY_PAYLOAD_MAPPER.backendKeyFor('coverType')).toBe('coverType');
    expect(PROPERTY_PAYLOAD_MAPPER.toWireValueFor('coverType', 'comprehensive')).toBe(
      'comprehensive',
    );
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
        address: {
          addressLine2: '',
          addressLine3: null,
          addressLine4: undefined,
          postcode: 'M1 1AA',
        },
      },
    });

    expect(Object.keys(fields)).toEqual(['proposer-address-postcode']);
  });

  it('keeps zero, which is a real answer rather than an absent one', () => {
    const fields = MOTOR_PAYLOAD_MAPPER.toStoreFields({
      'your-policy': { policy: { voluntaryExcess: 0 } },
    });

    expect(fields['policy-volxs']).toBe('0');
  });

  it('produces nothing for a journey with no answers', () => {
    expect(MOTOR_PAYLOAD_MAPPER.toStoreFields({})).toEqual({});
  });
});
