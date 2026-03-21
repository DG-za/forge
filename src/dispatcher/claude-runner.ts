import { query } from '@anthropic-ai/claude-agent-sdk';
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import type {
  AgentMessage,
  AgentRunner,
  RunOptions,
} from './agent-runner.types';

export class ClaudeRunner implements AgentRunner {
  readonly platform = 'claude' as const;

  async *run(task: string, options: RunOptions): AsyncGenerator<AgentMessage> {
    const conversation = query({
      prompt: task,
      options: {
        model: options.model,
        systemPrompt: options.systemPrompt,
        cwd: options.cwd,
        maxTurns: options.maxTurns,
        maxBudgetUsd: options.maxBudgetUsd,
        allowedTools: options.allowedTools,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
      },
    });

    for await (const message of conversation) {
      for (const normalised of normaliseMessage(message)) {
        yield normalised;
      }
    }
  }
}

function normaliseMessage(message: SDKMessage): AgentMessage[] {
  if (message.type === 'assistant') {
    return normaliseAssistant(message);
  } else if (message.type === 'result') {
    return [normaliseResult(message)];
  }
  return [];
}

function normaliseAssistant(
  message: Extract<SDKMessage, { type: 'assistant' }>,
): AgentMessage[] {
  const messages: AgentMessage[] = [];
  for (const block of message.message.content) {
    if (block.type === 'text') {
      messages.push({ type: 'progress', text: block.text });
    } else if (block.type === 'tool_use') {
      messages.push({
        type: 'tool_use',
        tool: block.name,
        input: JSON.stringify(block.input),
      });
    }
  }
  return messages;
}

function normaliseResult(
  message: Extract<SDKMessage, { type: 'result' }>,
): AgentMessage {
  const cost = {
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    costUsd: message.total_cost_usd,
  };

  if (message.subtype === 'success') {
    return {
      type: 'result',
      text: message.result,
      cost,
      durationMs: message.duration_ms,
      turns: message.num_turns,
    };
  }

  return {
    type: 'error',
    text: message.errors.join('\n'),
    cost,
  };
}
