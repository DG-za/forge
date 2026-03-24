import { describe, expect, it } from 'vitest';
import { assertCrossModel, CrossModelError } from '@/dispatcher/reviewer/cross-model.utils';

describe('assertCrossModel', () => {
  it('should pass when coder is claude and reviewer is openai', () => {
    expect(() => assertCrossModel('claude', 'openai')).not.toThrow();
  });

  it('should pass when coder is openai and reviewer is claude', () => {
    expect(() => assertCrossModel('openai', 'claude')).not.toThrow();
  });

  it('should throw CrossModelError when both are claude', () => {
    expect(() => assertCrossModel('claude', 'claude')).toThrow(CrossModelError);
  });

  it('should throw CrossModelError when both are openai', () => {
    expect(() => assertCrossModel('openai', 'openai')).toThrow(CrossModelError);
  });

  it('should include platform name in error message', () => {
    expect(() => assertCrossModel('claude', 'claude')).toThrow(/claude/);
  });
});
