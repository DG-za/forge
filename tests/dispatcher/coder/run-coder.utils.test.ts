import { describe, expect, it, vi } from 'vitest';
import type { AgentMessage, AgentRunner, Cost } from '@/dispatcher/agent-runner.types';
import { CoderError } from '@/dispatcher/coder/coder.error';
import type { CoderTask, CommandExecutor, QualityGateConfig } from '@/dispatcher/coder/coder.types';
import { runCoder } from '@/dispatcher/coder/run-coder.utils';

const task: CoderTask = {
  issueNumber: 42,
  title: 'Add login endpoint',
  body: 'Build POST /login.',
  acceptanceCriteria: ['POST /login returns JWT'],
};

const gateConfig: QualityGateConfig = {
  lintCommand: 'npm run lint',
  typecheckCommand: 'npm run typecheck',
  testCommand: 'npm test',
};

const zeroCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 0 };

function resultMessage(text: string, cost: Cost = zeroCost): AgentMessage {
  return { type: 'result', text, cost, durationMs: 1000, turns: 1 };
}

function errorMessage(text: string, cost: Cost = zeroCost): AgentMessage {
  return { type: 'error', text, cost };
}

function buildMockRunner(messages: AgentMessage[]): AgentRunner {
  return {
    platform: 'claude',
    async *run() {
      yield* messages;
    },
  };
}

const allPassExec: CommandExecutor = async () => ({ exitCode: 0, output: '' });

const lintFailExec: CommandExecutor = async (cmd) =>
  cmd.includes('lint') ? { exitCode: 1, output: 'Lint error' } : { exitCode: 0, output: '' };

describe('runCoder', () => {
  it('should return success when agent completes and gates pass', async () => {
    const runner = buildMockRunner([resultMessage('Done implementing')]);

    const result = await runCoder({
      runner,
      model: 'claude-sonnet-4-5-20250514',
      task,
      gateConfig,
      cwd: '/repo',
      maxBudgetUsd: 5,
      exec: allPassExec,
    });

    expect(result.gatesPassed).toBe(true);
    expect(result.attempts).toBe(1);
  });

  it('should accumulate cost across attempts', async () => {
    const cost: Cost = { inputTokens: 100, outputTokens: 50, costUsd: 0.02 };
    let attempt = 0;
    const runner: AgentRunner = {
      platform: 'claude',
      async *run() {
        attempt++;
        yield resultMessage('Done', cost);
      },
    };
    const exec: CommandExecutor = async (cmd) =>
      attempt < 2 && cmd.includes('lint') ? { exitCode: 1, output: 'error' } : { exitCode: 0, output: '' };

    const result = await runCoder({
      runner,
      model: 'test',
      task,
      gateConfig,
      cwd: '/repo',
      maxBudgetUsd: 5,
      exec,
    });

    expect(result.attempts).toBe(2);
    expect(result.cost.inputTokens).toBe(200);
    expect(result.cost.outputTokens).toBe(100);
    expect(result.cost.costUsd).toBeCloseTo(0.04);
  });

  it('should retry up to maxAttempts when gates fail', async () => {
    const runSpy = vi.fn(async function* () {
      yield resultMessage('Fixed it');
    });
    const runner: AgentRunner = { platform: 'claude', run: runSpy };

    const result = await runCoder({
      runner,
      model: 'test',
      task,
      gateConfig,
      cwd: '/repo',
      maxBudgetUsd: 5,
      exec: lintFailExec,
      maxAttempts: 3,
    });

    expect(result.gatesPassed).toBe(false);
    expect(result.attempts).toBe(3);
    expect(runSpy).toHaveBeenCalledTimes(3);
  });

  it('should default to 7 max attempts', async () => {
    const runSpy = vi.fn(async function* () {
      yield resultMessage('attempt');
    });
    const runner: AgentRunner = { platform: 'claude', run: runSpy };

    const result = await runCoder({
      runner,
      model: 'test',
      task,
      gateConfig,
      cwd: '/repo',
      maxBudgetUsd: 5,
      exec: lintFailExec,
    });

    expect(result.attempts).toBe(7);
    expect(runSpy).toHaveBeenCalledTimes(7);
  });

  it('should pass gate failure feedback in fix prompt', async () => {
    let attempt = 0;
    const runSpy = vi.fn(async function* () {
      attempt++;
      yield resultMessage('Done');
    });
    const runner: AgentRunner = { platform: 'claude', run: runSpy };
    const exec: CommandExecutor = async (cmd) =>
      attempt < 2 && cmd.includes('test') ? { exitCode: 1, output: 'FAIL: expected 200' } : { exitCode: 0, output: '' };

    await runCoder({
      runner,
      model: 'test',
      task,
      gateConfig,
      cwd: '/repo',
      maxBudgetUsd: 5,
      exec,
    });

    const secondCallPrompt = runSpy.mock.calls[1][0] as string;
    expect(secondCallPrompt).toContain('FAIL: expected 200');
    expect(secondCallPrompt).toContain('test');
  });

  it('should throw CoderError when agent returns error message', async () => {
    const cost: Cost = { inputTokens: 50, outputTokens: 0, costUsd: 0.01 };
    const runner = buildMockRunner([errorMessage('Rate limited', cost)]);

    const error = await runCoder({
      runner,
      model: 'test',
      task,
      gateConfig,
      cwd: '/repo',
      maxBudgetUsd: 5,
      exec: allPassExec,
    }).catch((e) => e);

    expect(error).toBeInstanceOf(CoderError);
    expect(error.message).toBe('Rate limited');
    expect(error.cost).toEqual(cost);
  });

  it('should pass model and cwd to the runner', async () => {
    const runSpy = vi.fn(async function* () {
      yield resultMessage('Done');
    });
    const runner: AgentRunner = { platform: 'claude', run: runSpy };

    await runCoder({
      runner,
      model: 'claude-sonnet-4-5-20250514',
      task,
      gateConfig,
      cwd: '/my/repo',
      maxBudgetUsd: 10,
      exec: allPassExec,
    });

    expect(runSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ model: 'claude-sonnet-4-5-20250514', cwd: '/my/repo', maxBudgetUsd: 10 }),
    );
  });

  it('should stop retrying once gates pass', async () => {
    let attempt = 0;
    const runSpy = vi.fn(async function* () {
      attempt++;
      yield resultMessage('Attempt ' + attempt);
    });
    const runner: AgentRunner = { platform: 'claude', run: runSpy };
    const exec: CommandExecutor = async (cmd) =>
      attempt < 3 && cmd.includes('lint') ? { exitCode: 1, output: 'error' } : { exitCode: 0, output: '' };

    const result = await runCoder({
      runner,
      model: 'test',
      task,
      gateConfig,
      cwd: '/repo',
      maxBudgetUsd: 5,
      exec,
    });

    expect(result.gatesPassed).toBe(true);
    expect(result.attempts).toBe(3);
  });
});
