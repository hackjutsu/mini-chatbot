const { normalizeTimestamp } = require('../dates');

describe('normalizeTimestamp', () => {
  it('returns null for falsy values', () => {
    expect(normalizeTimestamp(null)).toBeNull();
    expect(normalizeTimestamp('')).toBeNull();
  });

  it('converts SQLite CURRENT_TIMESTAMP output into UTC ISO strings', () => {
    expect(normalizeTimestamp('2024-11-19 07:36:00')).toBe('2024-11-19T07:36:00.000Z');
  });

  it('preserves timezone-aware inputs', () => {
    expect(normalizeTimestamp('2024-05-01T12:00:00-05:00')).toBe('2024-05-01T17:00:00.000Z');
  });

  it('handles Date instances', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    expect(normalizeTimestamp(date)).toBe('2024-01-01T00:00:00.000Z');
  });
});
