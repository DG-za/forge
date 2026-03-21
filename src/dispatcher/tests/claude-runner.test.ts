import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { AgentMessage } from '../agent-runner.types';

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: vi.fn(),
}));

import { query } from '@anthropic-ai/claude-agent-sdk';
import { ClaudeRunner } from '../claude-runner';

const mockedQuery = vi.mocked(query);

function buildRunner(): ClaudeRunner {
  return new ClaudeRunner();
}

function buildRunOptions() {
  return {
    model: 'claude-sonnet-4-6',
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

function* fakeQueryGenerator(messages: Array<Record<string, unknown>>) {
  yield* messages;
}

describe('ClaudeRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have platform "claude"', () => {
    const runner = buildRunner();
    expect(runner.platform).toBe('claude');
  });

  it('should pass options to query()', async () => {
    const fakeMessages = [
      {
        type: 'result',
        subtype: 'success',
        result: 'Done',
        total_cost_usd: 0.05,
        usage: { input_tokens: 100, output_tokens: 50 },
        duration_ms: 1000,
        num_turns: 3,
      },
    ];
    mockedQuery.mockReturnValue(
      fakeQueryGenerator(fakeMessages) as ReturnType<typeof query>,
    );

    const runner = buildRunner();
    const options = buildRunOptions();
    await collectMessages(runner.run('Fix the bug', options));

    expect(mockedQuery).toHaveBeenCalledWith({
      prompt: 'Fix the bug',
      options: {
        model: 'claude-sonnet-4-6',
        systemPrompt: 'You are a coding assistant.',
        cwd: '/tmp/repo',
        maxTurns: 10,
        maxBudgetUsd: 5.0,
        allowedTools: ['Read', 'Edit', 'Bash'],
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
      },
    });
  });

  it('should yield a progress message from assistant text', async () => {
    const fakeMessages = [
      {
        type: 'assistant',
        message: {
          content: [{ type: 'text', text: 'I will fix the bug now.' }],
        },
      },
      {
        type: 'result',
        subtype: 'success',
        result: 'Done',
        total_cost_usd: 0.01,
        usage: { input_tokens: 10, output_tokens: 5 },
        duration_ms: 500,
        num_turns: 1,
      },
    ];
    mockedQuery.mockReturnValue(
      fakeQueryGenerator(fakeMessages) as ReturnType<typeof query>,
    );

    const runner = buildRunner();
    const messages = await collectMessages(
      runner.run('Fix it', buildRunOptions()),
    );

    expect(messages[0]).toEqual({
      type: 'progress',
      text: 'I will fix the bug now.',
    });
  });

  it('should yield a tool_use message from assistant tool_use blocks', async () => {
    const fakeMessages = [
      {
        type: 'assistant',
        message: {
          content: [
            {
              type: 'tool_use',
              name: 'Read',
              input: { file_path: '/tmp/repo/src/main.ts' },
            },
          ],
        },
      },
      {
        type: 'result',
        subtype: 'success',
        result: 'Done',
        total_cost_usd: 0.01,
        usage: { input_tokens: 10, output_tokens: 5 },
        duration_ms: 500,
        num_turns: 1,
      },
    ];
    mockedQuery.mockReturnValue(
      fakeQueryGenerator(fakeMessages) as ReturnType<typeof query>,
    );

    const runner = buildRunner();
    const messages = await collectMessages(
      runner.run('Read file', buildRunOptions()),
    );

    expect(messages[0]).toEqual({
      type: 'tool_use',
      tool: 'Read',
      input: JSON.stringify({ file_path: '/tmp/repo/src/main.ts' }),
    });
  });

  it('should yield all content blocks from a single assistant message', async () => {
    const fakeMessages = [
      {
        type: 'assistant',
        message: {
          content: [
            { type: 'text', text: 'Let me read that file.' },
            {
              type: 'tool_use',
              name: 'Read',
              input: { file_path: '/tmp/repo/src/main.ts' },
            },
          ],
        },
      },
      {
        type: 'result',
        subtype: 'success',
        result: 'Done',
        total_cost_usd: 0.01,
        usage: { input_tokens: 10, output_tokens: 5 },
        duration_ms: 500,
        num_turns: 1,
      },
    ];
    mockedQuery.mockReturnValue(
      fakeQueryGenerator(fakeMessages) as ReturnType<typeof query>,
    );

    const runner = buildRunner();
    const messages = await collectMessages(
      runner.run('Read file', buildRunOptions()),
    );

    expect(messages[0]).toEqual({
      type: 'progress',
      text: 'Let me read that file.',
    });
    expect(messages[1]).toEqual({
      type: 'tool_use',
      tool: 'Read',
      input: JSON.stringify({ file_path: '/tmp/repo/src/main.ts' }),
    });
  });

  it('should yield a result message on success', async () => {
    const fakeMessages = [
      {
        type: 'result',
        subtype: 'success',
        result: 'All tests pass.',
        total_cost_usd: 0.12,
        usage: { input_tokens: 500, output_tokens: 200 },
        duration_ms: 3000,
        num_turns: 5,
      },
    ];
    mockedQuery.mockReturnValue(
      fakeQueryGenerator(fakeMessages) as ReturnType<typeof query>,
    );

    const runner = buildRunner();
    const messages = await collectMessages(
      runner.run('Run tests', buildRunOptions()),
    );

    expect(messages[0]).toEqual({
      type: 'result',
      text: 'All tests pass.',
      cost: { inputTokens: 500, outputTokens: 200, costUsd: 0.12 },
      durationMs: 3000,
      turns: 5,
    });
  });

  it('should yield an error message on failure', async () => {
    const fakeMessages = [
      {
        type: 'result',
        subtype: 'error_max_turns',
        errors: ['Max turns exceeded'],
        total_cost_usd: 0.50,
        usage: { input_tokens: 2000, output_tokens: 1000 },
        duration_ms: 10000,
        num_turns: 10,
      },
    ];
    mockedQuery.mockReturnValue(
      fakeQueryGenerator(fakeMessages) as ReturnType<typeof query>,
    );

    const runner = buildRunner();
    const messages = await collectMessages(
      runner.run('Big task', buildRunOptions()),
    );

    expect(messages[0]).toEqual({
      type: 'error',
      text: 'Max turns exceeded',
      cost: { inputTokens: 2000, outputTokens: 1000, costUsd: 0.50 },
    });
  });

  it('should skip irrelevant message types', async () => {
    const fakeMessages = [
      { type: 'system', subtype: 'init', session_id: 'abc' },
      { type: 'user', message: { role: 'user' } },
      {
        type: 'result',
        subtype: 'success',
        result: 'Done',
        total_cost_usd: 0.01,
        usage: { input_tokens: 10, output_tokens: 5 },
        duration_ms: 100,
        num_turns: 1,
      },
    ];
    mockedQuery.mockReturnValue(
      fakeQueryGenerator(fakeMessages) as ReturnType<typeof query>,
    );

    const runner = buildRunner();
    const messages = await collectMessages(
      runner.run('Quick task', buildRunOptions()),
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]!.type).toBe('result');
  });
});
