import { asString } from './string-value';

describe('asString', () => {
  it('passes strings through and coerces everything else to empty', () => {
    expect(asString('M16 0PQ')).toBe('M16 0PQ');
    expect(asString(undefined)).toBe('');
    expect(asString(null)).toBe('');
    expect(asString(42)).toBe('');
    expect(asString(false)).toBe('');
  });
});

