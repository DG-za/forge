import { describe, expect, it } from 'vitest';
import { formatCost, formatRelativeTime } from '@/features/runs/format.utils';

const now = new Date('2026-03-24T12:00:00Z');

describe('formatRelativeTime', () => {
  it('should return "just now" for less than a minute', () => {
    expect(formatRelativeTime(new Date('2026-03-24T11:59:30Z'), now)).toBe('just now');
  });

  it('should return minutes for less than an hour', () => {
    expect(formatRelativeTime(new Date('2026-03-24T11:45:00Z'), now)).toBe('15m ago');
  });

  it('should return hours for less than a day', () => {
    expect(formatRelativeTime(new Date('2026-03-24T09:00:00Z'), now)).toBe('3h ago');
  });

  it('should return days for less than 30 days', () => {
    expect(formatRelativeTime(new Date('2026-03-20T12:00:00Z'), now)).toBe('4d ago');
  });

  it('should return formatted date for 30+ days', () => {
    expect(formatRelativeTime(new Date('2026-01-15T12:00:00Z'), now)).toBe('Jan 15, 2026');
  });
});

describe('formatCost', () => {
  it('should format with dollar sign and two decimals', () => {
    expect(formatCost(1.5)).toBe('$1.50');
  });

  it('should format zero', () => {
    expect(formatCost(0)).toBe('$0.00');
  });
});
