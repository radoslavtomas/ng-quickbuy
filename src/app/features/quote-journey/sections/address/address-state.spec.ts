import { hasAddressState } from './address-state';

describe('hasAddressState', () => {
  it('needs both a first line and a postcode to count as resolved', () => {
    expect(hasAddressState({ addressLine1: '17 Talbot Road', postcode: 'M16 0PQ' })).toBe(true);
    expect(hasAddressState({ addressLine1: '17 Talbot Road' })).toBe(false);
    expect(hasAddressState({ postcode: 'M16 0PQ' })).toBe(false);
    expect(hasAddressState({})).toBe(false);
  });

  it('treats blank values as absent, so a half-typed postcode does not resolve', () => {
    expect(hasAddressState({ addressLine1: '17 Talbot Road', postcode: '' })).toBe(false);
  });
});
