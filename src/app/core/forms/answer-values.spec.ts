import { answersEqual } from './answer-values';

describe('answersEqual', () => {
  it('compares nested JSON answers independent of key order and omitted undefined keys', () => {
    expect(
      answersEqual(
        { a: 1, b: [2, { c: false }], omitted: undefined },
        { b: [2, { c: false }], a: 1 },
      ),
    ).toBe(true);
  });
  it('distinguishes answer edits, array order, missing answers and primitive types', () => {
    for (const [a, b] of [
      [0, false],
      [1, '1'],
      [null, undefined],
      [{ a: 1 }, { a: 2 }],
      [
        [1, 2],
        [2, 1],
      ],
      [{ a: 1 }, {}],
      [[], {}],
    ]) {
      expect(answersEqual(a, b)).toBe(false);
    }
  });
  it('compares dates by value', () => {
    expect(answersEqual(new Date(2026, 0, 1), new Date(2026, 0, 1))).toBe(true);
    expect(answersEqual(new Date(2026, 0, 1), new Date(2026, 0, 2))).toBe(false);
  });
});
