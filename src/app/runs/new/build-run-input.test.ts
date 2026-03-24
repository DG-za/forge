import { describe, expect, it } from 'vitest';
import type { StartRunInput } from '../validation';
import { buildRunInput } from './build-run-input';

const validInput: StartRunInput = {
  repo: 'owner/repo',
  epicNumber: 10,
  budgetUsd: 25,
  plannerPlatform: 'claude',
  plannerModel: 'claude-sonnet-4-6',
  coderPlatform: 'openai',
  coderModel: 'gpt-4.1',
  reviewerPlatform: 'claude',
  reviewerModel: 'claude-sonnet-4-6',
};

describe('buildRunInput', () => {
  it('should set repo and epicNumber from input', () => {
    const result = buildRunInput(validInput);

    expect(result.config.repo).toBe('owner/repo');
    expect(result.config.epicNumber).toBe(10);
  });

  it('should set maxBudgetUsd from input', () => {
    const result = buildRunInput(validInput);

    expect(result.config.maxBudgetUsd).toBe(25);
  });

  it('should configure planner with correct platform and model', () => {
    const result = buildRunInput(validInput);

    expect(result.config.planner.runner.platform).toBe('claude');
    expect(result.config.planner.model).toBe('claude-sonnet-4-6');
  });

  it('should configure coder with correct platform and model', () => {
    const result = buildRunInput(validInput);

    expect(result.config.coder.runner.platform).toBe('openai');
    expect(result.config.coder.model).toBe('gpt-4.1');
  });

  it('should configure reviewer with correct platform and model', () => {
    const result = buildRunInput(validInput);

    expect(result.config.reviewer.runner.platform).toBe('claude');
    expect(result.config.reviewer.model).toBe('claude-sonnet-4-6');
  });

  it('should include quality gate config with standard commands', () => {
    const result = buildRunInput(validInput);

    expect(result.config.gateConfig).toEqual({
      lintCommand: 'npm run lint',
      typecheckCommand: 'npm run typecheck',
      testCommand: 'npm test',
    });
  });

  it('should provide an issueFetcher', () => {
    const result = buildRunInput(validInput);

    expect(result.issueFetcher).toBeDefined();
    expect(typeof result.issueFetcher.fetchEpic).toBe('function');
  });

  it('should provide a getDiff function', () => {
    const result = buildRunInput(validInput);

    expect(typeof result.getDiff).toBe('function');
  });

  it('should provide an exec function', () => {
    const result = buildRunInput(validInput);

    expect(typeof result.config.exec).toBe('function');
  });
});
