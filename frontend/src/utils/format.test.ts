import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent } from './format-currency';
import { formatDate } from './format-date';

describe('format-currency utility', () => {
  it('should format FCFA currency properly', () => {
    const formatted = formatCurrency(50000);
    expect(formatted).toContain('50');
    expect(formatted).toContain('FCFA');
  });

  it('should format percent properly', () => {
    expect(formatPercent(15.5)).toBe('+15.5%');
    expect(formatPercent(-8.2)).toBe('-8.2%');
    expect(formatPercent(0)).toBe('0.0%');
  });
});

describe('format-date utility', () => {
  it('should format ISO dates into French standard format', () => {
    const formatted = formatDate('2026-05-15T10:00:00.000Z');
    expect(formatted).toBe('15/05/2026');
  });
});
