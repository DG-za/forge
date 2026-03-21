# Claude Agent SDK — API Reference for Forge

> Date: 2026-03-21 | Source: npm `@anthropic-ai/claude-agent-sdk`

## Entry Point

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
```

`query({ prompt, options })` returns a `Query` object that extends `AsyncGenerator<SDKMessage>`.

## Options (relevant to Forge)

```typescript
interface Options {
  model: string;                    // e.g. "claude-sonnet-4-6"
  systemPrompt: string;             // custom system prompt
  cwd: string;                      // working directory
  allowedTools: string[];           // tools to auto-approve
  disallowedTools: string[];        // tools to always deny
  maxTurns: number;                 // max agentic turns (tool-use round trips)
  maxBudgetUsd: number;             // budget cap in USD
  permissionMode: PermissionMode;   // 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'dontAsk'
  allowDangerouslySkipPermissions: boolean; // required for bypassPermissions
  abortController: AbortController; // for cancellation
  env: Record<string, string | undefined>; // env vars passed to process
  settingSources: ('user' | 'project' | 'local')[]; // load CLAUDE.md etc.
  effort: 'low' | 'medium' | 'high' | 'max';
}
```

## Message Types (SDKMessage union)

The async generator yields a discriminated union. Key types for Forge:

### SDKAssistantMessage

```typescript
{
  type: "assistant";
  uuid: string;
  session_id: string;
  message: {
    content: ContentBlock[];  // text or tool_use blocks
    model: string;
    stop_reason: string;
    usage: { input_tokens: number; output_tokens: number };
  };
  parent_tool_use_id: string | null;
  error?: 'authentication_failed' | 'billing_error' | 'rate_limit' | 'invalid_request' | 'server_error' | 'unknown';
}
```

### SDKResultMessage (final message — has cost)

```typescript
// Success
{
  type: "result";
  subtype: "success";
  duration_ms: number;
  duration_api_ms: number;
  is_error: boolean;
  num_turns: number;
  result: string;
  total_cost_usd: number;
  usage: { input_tokens: number; output_tokens: number };
  modelUsage: Record<string, {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens: number;
    cacheCreationInputTokens: number;
    costUSD: number;
  }>;
}

// Error
{
  type: "result";
  subtype: "error_max_turns" | "error_during_execution" | "error_max_budget_usd";
  total_cost_usd: number;
  usage: { input_tokens: number; output_tokens: number };
  modelUsage: Record<string, ModelUsage>;
  errors: string[];
}
```

### SDKSystemMessage (first message — init)

```typescript
{
  type: "system";
  subtype: "init";
  session_id: string;
  model: string;
  tools: string[];
  cwd: string;
  permissionMode: string;
}
```

## Other message types

`SDKToolProgressMessage`, `SDKStatusMessage`, `SDKRateLimitEvent`, `SDKPartialAssistantMessage` (streaming) — useful for progress reporting but not critical for v1.

## Usage Example (Forge worker pattern)

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const conversation = query({
  prompt: "Implement issue #42: add user authentication",
  options: {
    model: "claude-sonnet-4-6",
    systemPrompt: "You are a senior TypeScript developer. Follow TDD.",
    cwd: "/path/to/repo",
    allowedTools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep"],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    maxTurns: 25,
    maxBudgetUsd: 5.0,
    settingSources: ["project"],
  },
});

for await (const message of conversation) {
  if (message.type === "assistant") {
    // Progress — forward to UI
  } else if (message.type === "result") {
    // Done — extract cost and result
    console.log(`Cost: $${message.total_cost_usd}`);
    if (message.subtype === "success") {
      console.log(`Result: ${message.result}`);
    } else {
      console.log(`Errors: ${message.errors}`);
    }
  }
}
```

## Query Object Methods

- `close()` — terminate the agent process
- `interrupt()` — interrupt streaming
- `setModel(model)` — change model mid-session

## Key Notes for Forge Integration

1. **SDK spawns a child process** — each `query()` runs a separate process
2. **Cost is only on the final `result` message** — accumulate progress events for UI, read cost at end
3. **`bypassPermissions` + `allowDangerouslySkipPermissions`** needed for unattended execution
4. **`settingSources: ["project"]`** loads the target repo's CLAUDE.md
5. **`maxBudgetUsd`** enforced by the SDK — emits `error_max_budget_usd` result if exceeded
