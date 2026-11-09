import { formatVolume, formatWeight, fromDisplayWeight, toDisplayWeight } from './units';

describe('units', () => {
  test('kg is identity (2 decimals)', () => {
    expect(toDisplayWeight(61.235, 'kg')).toBe(61.24);
    expect(fromDisplayWeight(60, 'kg')).toBe(60);
  });

  test('lb round-trips to the same displayed value', () => {
    for (const lb of [45, 95, 135, 225, 315, 2.5]) {
      const kg = fromDisplayWeight(lb, 'lb');
      expect(toDisplayWeight(kg, 'lb')).toBe(lb);
    }
  });

  test('formatting', () => {
    expect(formatWeight(100, 'kg')).toBe('100kg');
    expect(formatWeight(100, 'lb')).toBe('220.5lb');
    expect(formatVolume(840, 'kg')).toBe('840kg');
    expect(formatVolume(840, 'lb')).toBe('1,852lb');
    expect(formatVolume(12000, 'kg')).toBe('12t');
    expect(formatVolume(12000, 'lb')).toBe('26.5k lb');
  });
});

describe('isNetworkError', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { isNetworkError } = require('./errors') as typeof import('./errors');
  test.each([
    [{ message: 'TypeError: Network request failed' }, true],
    [{ name: 'AbortError', message: 'Aborted' }, true],
    [{ message: 'Request timed out' }, true],
    [{ status: 503 }, true],
    [{ code: '42501', message: 'new row violates row-level security policy' }, false],
  ])('%j → %s', (err, expected) => expect(isNetworkError(err)).toBe(expected));
});
