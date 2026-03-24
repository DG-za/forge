import { describe, expect, it } from 'vitest';
import { getStatusConfig } from './status-badge.utils';

describe('getStatusConfig', () => {
  it('should return yellow for pending', () => {
    const config = getStatusConfig('pending');

    expect(config.label).toBe('Pending');
    expect(config.colorClass).toContain('yellow');
  });

  it('should return yellow for planning', () => {
    const config = getStatusConfig('planning');

    expect(config.label).toBe('Planning');
    expect(config.colorClass).toContain('yellow');
  });

  it('should return blue for in_progress', () => {
    const config = getStatusConfig('in_progress');

    expect(config.label).toBe('Running');
    expect(config.colorClass).toContain('blue');
  });

  it('should return green for completed', () => {
    const config = getStatusConfig('completed');

    expect(config.label).toBe('Completed');
    expect(config.colorClass).toContain('green');
  });

  it('should return red for failed', () => {
    const config = getStatusConfig('failed');

    expect(config.label).toBe('Failed');
    expect(config.colorClass).toContain('red');
  });

  it('should return gray fallback for unknown status', () => {
    const config = getStatusConfig('something_else');

    expect(config.label).toBe('Unknown');
    expect(config.colorClass).toContain('gray');
  });
});
