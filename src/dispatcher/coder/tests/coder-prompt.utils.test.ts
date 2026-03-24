import { describe, expect, it } from 'vitest';
import { buildCoderPrompt, buildFixPrompt } from '../coder-prompt.utils';
import { CODER_SYSTEM_PROMPT } from '../coder-system-prompt.utils';
import type { CoderTask, QualityGateResult } from '../coder.types';

const task: CoderTask = {
  issueNumber: 42,
  title: 'Add login endpoint',
  body: 'Build a POST /login endpoint that returns a JWT token.',
  acceptanceCriteria: ['POST /login returns JWT on valid credentials', 'Invalid credentials return 401'],
};

describe('CODER_SYSTEM_PROMPT', () => {
  it('should emphasize TDD workflow', () => {
    expect(CODER_SYSTEM_PROMPT).toContain('test');
    expect(CODER_SYSTEM_PROMPT).toContain('TDD');
  });

  it('should mention quality gates', () => {
    expect(CODER_SYSTEM_PROMPT).toContain('lint');
    expect(CODER_SYSTEM_PROMPT).toContain('type');
  });
});

describe('buildCoderPrompt', () => {
  it('should include the issue title and number', () => {
    const prompt = buildCoderPrompt(task);

    expect(prompt).toContain('#42');
    expect(prompt).toContain('Add login endpoint');
  });

  it('should include the issue body', () => {
    const prompt = buildCoderPrompt(task);

    expect(prompt).toContain('POST /login endpoint that returns a JWT token');
  });

  it('should include all acceptance criteria', () => {
    const prompt = buildCoderPrompt(task);

    expect(prompt).toContain('POST /login returns JWT on valid credentials');
    expect(prompt).toContain('Invalid credentials return 401');
  });

  it('should handle null issue number', () => {
    const newTask: CoderTask = { ...task, issueNumber: null };
    const prompt = buildCoderPrompt(newTask);

    expect(prompt).toContain('Add login endpoint');
    expect(prompt).not.toContain('#null');
  });
});

describe('buildFixPrompt', () => {
  const gateResult: QualityGateResult = {
    passed: false,
    gates: [
      { gate: 'lint', passed: true, output: '' },
      { gate: 'typecheck', passed: false, output: "TS2322: Type 'string' is not assignable to type 'number'" },
      { gate: 'test', passed: false, output: 'FAIL src/auth.test.ts\n  Expected 200, received 500' },
    ],
  };

  it('should include only failed gate outputs', () => {
    const prompt = buildFixPrompt(gateResult);

    expect(prompt).toContain('typecheck');
    expect(prompt).toContain('TS2322');
    expect(prompt).toContain('FAIL src/auth.test.ts');
    expect(prompt).not.toContain('lint');
  });

  it('should instruct the agent to fix failures', () => {
    const prompt = buildFixPrompt(gateResult);

    expect(prompt).toContain('Fix');
  });
});
