import { describe, expect, it } from 'vitest';
import { startRunSchema } from './validation';

describe('startRunSchema', () => {
  it('should accept valid input', () => {
    const result = startRunSchema.safeParse({ repo: 'owner/repo', epicNumber: 42, budgetUsd: 25 });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ repo: 'owner/repo', epicNumber: 42, budgetUsd: 25 });
  });

  it('should coerce string numbers', () => {
    const result = startRunSchema.safeParse({ repo: 'owner/repo', epicNumber: '10', budgetUsd: '5.50' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ repo: 'owner/repo', epicNumber: 10, budgetUsd: 5.5 });
  });

  it('should reject empty repo', () => {
    const result = startRunSchema.safeParse({ repo: '', epicNumber: 1, budgetUsd: 10 });

    expect(result.success).toBe(false);
  });

  it('should reject repo without slash', () => {
    const result = startRunSchema.safeParse({ repo: 'justrepo', epicNumber: 1, budgetUsd: 10 });

    expect(result.success).toBe(false);
  });

  it('should reject repo with spaces', () => {
    const result = startRunSchema.safeParse({ repo: 'owner/ repo', epicNumber: 1, budgetUsd: 10 });

    expect(result.success).toBe(false);
  });

  it('should reject zero epic number', () => {
    const result = startRunSchema.safeParse({ repo: 'owner/repo', epicNumber: 0, budgetUsd: 10 });

    expect(result.success).toBe(false);
  });

  it('should reject negative epic number', () => {
    const result = startRunSchema.safeParse({ repo: 'owner/repo', epicNumber: -5, budgetUsd: 10 });

    expect(result.success).toBe(false);
  });

  it('should reject budget below minimum', () => {
    const result = startRunSchema.safeParse({ repo: 'owner/repo', epicNumber: 1, budgetUsd: 0 });

    expect(result.success).toBe(false);
  });

  it('should reject budget above maximum', () => {
    const result = startRunSchema.safeParse({ repo: 'owner/repo', epicNumber: 1, budgetUsd: 501 });

    expect(result.success).toBe(false);
  });

  it('should accept boundary budget values', () => {
    expect(startRunSchema.safeParse({ repo: 'a/b', epicNumber: 1, budgetUsd: 0.01 }).success).toBe(true);
    expect(startRunSchema.safeParse({ repo: 'a/b', epicNumber: 1, budgetUsd: 500 }).success).toBe(true);
  });
});
