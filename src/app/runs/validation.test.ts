import { describe, expect, it } from 'vitest';
import { startRunSchema } from './validation';

const validRoles = {
  plannerPlatform: 'claude',
  plannerModel: 'claude-sonnet-4-6',
  coderPlatform: 'openai',
  coderModel: 'gpt-4.1',
  reviewerPlatform: 'claude',
  reviewerModel: 'claude-sonnet-4-6',
};

const validGates = {
  lintCommand: 'npm run lint',
  typecheckCommand: 'npm run typecheck',
  testCommand: 'npm test',
};

const validInput = { repo: 'owner/repo', epicNumber: 42, budgetUsd: 25, ...validRoles, ...validGates };

describe('startRunSchema', () => {
  it('should accept valid input with role configs', () => {
    const result = startRunSchema.safeParse(validInput);

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      repo: 'owner/repo',
      epicNumber: 42,
      budgetUsd: 25,
      plannerPlatform: 'claude',
      plannerModel: 'claude-sonnet-4-6',
      coderPlatform: 'openai',
      coderModel: 'gpt-4.1',
      reviewerPlatform: 'claude',
      reviewerModel: 'claude-sonnet-4-6',
    });
  });

  it('should coerce string numbers', () => {
    const result = startRunSchema.safeParse({ ...validRoles, ...validGates, repo: 'owner/repo', epicNumber: '10', budgetUsd: '5.50' });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ repo: 'owner/repo', epicNumber: 10, budgetUsd: 5.5 });
  });

  it('should reject empty repo', () => {
    const result = startRunSchema.safeParse({ ...validInput, repo: '' });

    expect(result.success).toBe(false);
  });

  it('should reject repo without slash', () => {
    const result = startRunSchema.safeParse({ ...validInput, repo: 'justrepo' });

    expect(result.success).toBe(false);
  });

  it('should reject repo with spaces', () => {
    const result = startRunSchema.safeParse({ ...validInput, repo: 'owner/ repo' });

    expect(result.success).toBe(false);
  });

  it('should reject zero epic number', () => {
    const result = startRunSchema.safeParse({ ...validInput, epicNumber: 0 });

    expect(result.success).toBe(false);
  });

  it('should reject negative epic number', () => {
    const result = startRunSchema.safeParse({ ...validInput, epicNumber: -5 });

    expect(result.success).toBe(false);
  });

  it('should reject budget below minimum', () => {
    const result = startRunSchema.safeParse({ ...validInput, budgetUsd: 0 });

    expect(result.success).toBe(false);
  });

  it('should reject budget above maximum', () => {
    const result = startRunSchema.safeParse({ ...validInput, budgetUsd: 501 });

    expect(result.success).toBe(false);
  });

  it('should accept boundary budget values', () => {
    expect(startRunSchema.safeParse({ ...validInput, budgetUsd: 0.01 }).success).toBe(true);
    expect(startRunSchema.safeParse({ ...validInput, budgetUsd: 500 }).success).toBe(true);
  });

  it('should reject invalid platform', () => {
    const result = startRunSchema.safeParse({ ...validInput, coderPlatform: 'gemini' });

    expect(result.success).toBe(false);
  });

  it('should reject empty model', () => {
    const result = startRunSchema.safeParse({ ...validInput, plannerModel: '' });

    expect(result.success).toBe(false);
  });

  it('should reject when reviewer and coder use same platform', () => {
    const result = startRunSchema.safeParse({
      ...validInput,
      coderPlatform: 'claude',
      coderModel: 'claude-sonnet-4-6',
      reviewerPlatform: 'claude',
      reviewerModel: 'claude-opus-4-6',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain('different platform');
  });

  it('should accept when reviewer and coder use different platforms', () => {
    const result = startRunSchema.safeParse({
      ...validInput,
      coderPlatform: 'openai',
      coderModel: 'gpt-4.1',
      reviewerPlatform: 'claude',
      reviewerModel: 'claude-sonnet-4-6',
    });

    expect(result.success).toBe(true);
  });
});
