import { Codex, type CodexOptions, type ThreadItem, type Usage } from '@openai/codex-sdk';
import type { AgentMessage, AgentRunner, Cost, RunOptions } from './agent-runner.types';

/**
 * Per-1M-token pricing for OpenAI models.
 * Update when new models are added or prices change.
 */
const PRICING: Record<string, { input: number; output: number }> = {
  'o4-mini': { input: 1.1, output: 4.4 },
  o3: { input: 2.0, output: 8.0 },
  'o3-mini': { input: 0.5, output: 1.1 },
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1-nano': { input: 0.1, output: 0.4 },
};

const DEFAULT_PRICING = { input: 2.0, output: 8.0 };

export class OpenAIRunner implements AgentRunner {
  readonly platform = 'openai' as const;
  private codexOptions: CodexOptions;

  constructor(codexOptions: CodexOptions = {}) {
    this.codexOptions = codexOptions;
  }

  async *run(task: string, options: RunOptions): AsyncGenerator<AgentMessage> {
    // TODO: Codex SDK doesn't support maxTurns, maxBudgetUsd, or allowedTools.
    // Budget enforcement and turn limits must be tracked externally by the dispatcher.
    const codex = new Codex(this.codexOptions);
    const thread = codex.startThread({
      model: options.model,
      workingDirectory: options.cwd,
      sandboxMode: 'workspace-write',
      approvalPolicy: 'never',
    });

    const input = `${options.systemPrompt}\n\n${task}`;

    try {
      const turn = await thread.run(input, {});

      for (const item of turn.items) {
        const normalised = normaliseItem(item);
        if (normalised) yield normalised;
      }

      const cost = computeCost(options.model, turn.usage);
      yield {
        type: 'result',
        text: turn.finalResponse,
        cost,
        durationMs: 0,
        turns: 1,
      };
    } catch (error) {
      yield {
        type: 'error',
        text: error instanceof Error ? error.message : String(error),
        cost: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
      };
    }
  }
}

function normaliseItem(item: ThreadItem): AgentMessage | null {
  if (item.type === 'agent_message') {
    return { type: 'progress', text: item.text };
  } else if (item.type === 'command_execution') {
    return { type: 'tool_use', tool: 'command_execution', input: item.command };
  } else if (item.type === 'file_change') {
    const paths = item.changes.map((c) => c.path).join(', ');
    return { type: 'tool_use', tool: 'file_change', input: paths };
  }
  return null;
}

function computeCost(model: string, usage: Usage | null): Cost {
  if (!usage) return { inputTokens: 0, outputTokens: 0, costUsd: 0 };

  const pricing = PRICING[model] ?? DEFAULT_PRICING;
  const costUsd = (usage.input_tokens / 1_000_000) * pricing.input + (usage.output_tokens / 1_000_000) * pricing.output;

  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    costUsd: Math.round(costUsd * 1_000_000) / 1_000_000,
  };
}
