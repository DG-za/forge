import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { AgentMessage } from '../agent-runner.types';

const mockThread = { run: vi.fn() };
const mockStartThread = vi.fn(() => mockThread);

vi.mock('@openai/codex-sdk', () => ({
  Codex: class MockCodex {
    startThread = mockStartThread;
  },
}));

import { OpenAIRunner } from '../openai-runner';

function buildRunner(): OpenAIRunner {
  return new OpenAIRunner({ apiKey: 'sk-test' });
}

function buildRunOptions() {
  return {
    model: 'o4-mini',
    systemPrompt: 'You are a coding assistant.',
    cwd: '/tmp/repo',
    maxTurns: 10,
    maxBudgetUsd: 5.0,
    allowedTools: ['Read', 'Edit', 'Bash'],
  };
}

function collectMessages(gen: AsyncGenerator<AgentMessage>): Promise<AgentMessage[]> {
  return Array.fromAsync(gen);
}

describe('OpenAIRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have platform "openai"', () => {
    const runner = buildRunner();
    expect(runner.platform).toBe('openai');
  });

  it('should pass options to Codex startThread()', async () => {
    mockThread.run.mockResolvedValue({
      finalResponse: 'Done',
      items: [],
      usage: { input_tokens: 100, output_tokens: 50, cached_input_tokens: 0 },
    });

    const runner = buildRunner();
    const options = buildRunOptions();
    await collectMessages(runner.run('Fix the bug', options));

    expect(mockStartThread).toHaveBeenCalledWith({
      model: 'o4-mini',
      workingDirectory: '/tmp/repo',
      sandboxMode: 'workspace-write',
      approvalPolicy: 'never',
    });
  });

  it('should prepend system prompt to task input', async () => {
    mockThread.run.mockResolvedValue({
      finalResponse: 'Done',
      items: [],
      usage: { input_tokens: 100, output_tokens: 50, cached_input_tokens: 0 },
    });

    const runner = buildRunner();
    await collectMessages(runner.run('Fix the bug', buildRunOptions()));

    expect(mockThread.run).toHaveBeenCalledWith(
      'You are a coding assistant.\n\nFix the bug',
      expect.any(Object),
    );
  });

  it('should yield progress from agent_message items', async () => {
    mockThread.run.mockResolvedValue({
      finalResponse: 'Done',
      items: [
        { type: 'agent_message', id: '1', text: 'Looking at the code...' },
      ],
      usage: { input_tokens: 100, output_tokens: 50, cached_input_tokens: 0 },
    });

    const runner = buildRunner();
    const messages = await collectMessages(
      runner.run('Fix it', buildRunOptions()),
    );

    expect(messages[0]).toEqual({
      type: 'progress',
      text: 'Looking at the code...',
    });
  });

  it('should yield tool_use from command_execution items', async () => {
    mockThread.run.mockResolvedValue({
      finalResponse: 'Done',
      items: [
        {
          type: 'command_execution',
          id: '1',
          command: 'npm test',
          aggregated_output: 'all pass',
          exit_code: 0,
          status: 'completed',
        },
      ],
      usage: { input_tokens: 100, output_tokens: 50, cached_input_tokens: 0 },
    });

    const runner = buildRunner();
    const messages = await collectMessages(
      runner.run('Run tests', buildRunOptions()),
    );

    expect(messages[0]).toEqual({
      type: 'tool_use',
      tool: 'command_execution',
      input: 'npm test',
    });
  });

  it('should yield tool_use from file_change items', async () => {
    mockThread.run.mockResolvedValue({
      finalResponse: 'Done',
      items: [
        {
          type: 'file_change',
          id: '1',
          changes: [{ path: 'src/main.ts', kind: 'update' }],
          status: 'completed',
        },
      ],
      usage: { input_tokens: 100, output_tokens: 50, cached_input_tokens: 0 },
    });

    const runner = buildRunner();
    const messages = await collectMessages(
      runner.run('Edit file', buildRunOptions()),
    );

    expect(messages[0]).toEqual({
      type: 'tool_use',
      tool: 'file_change',
      input: 'src/main.ts',
    });
  });

  it('should yield a result message with computed cost', async () => {
    mockThread.run.mockResolvedValue({
      finalResponse: 'All tests pass.',
      items: [],
      usage: { input_tokens: 1000, output_tokens: 500, cached_input_tokens: 200 },
    });

    const runner = buildRunner();
    const messages = await collectMessages(
      runner.run('Run tests', buildRunOptions()),
    );

    const result = messages.find((m) => m.type === 'result');
    expect(result).toBeDefined();
    expect(result!.type).toBe('result');
    if (result!.type === 'result') {
      expect(result!.text).toBe('All tests pass.');
      expect(result!.cost.inputTokens).toBe(1000);
      expect(result!.cost.outputTokens).toBe(500);
      expect(result!.cost.costUsd).toBeGreaterThan(0);
      expect(result!.turns).toBe(1);
    }
  });

  it('should yield an error when thread.run() throws', async () => {
    mockThread.run.mockRejectedValue(new Error('API rate limit'));

    const runner = buildRunner();
    const messages = await collectMessages(
      runner.run('Fail task', buildRunOptions()),
    );

    expect(messages[0]).toEqual({
      type: 'error',
      text: 'API rate limit',
      cost: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
    });
  });

  it('should handle null usage gracefully', async () => {
    mockThread.run.mockResolvedValue({
      finalResponse: 'Done',
      items: [],
      usage: null,
    });

    const runner = buildRunner();
    const messages = await collectMessages(
      runner.run('Quick task', buildRunOptions()),
    );

    const result = messages.find((m) => m.type === 'result');
    expect(result).toBeDefined();
    if (result!.type === 'result') {
      expect(result!.cost).toEqual({ inputTokens: 0, outputTokens: 0, costUsd: 0 });
    }
  });
});
