# OpenAI Codex SDK + Agents SDK — API Reference for Forge

> Date: 2026-03-21 | Source: npm `@openai/codex-sdk`, `@openai/agents`, `@openai/agents-extensions`

## Packages

| Package | Purpose |
|---------|---------|
| `@openai/codex-sdk` | Programmatic wrapper around Codex CLI (spawns process, JSONL events) |
| `@openai/agents` | Umbrella re-export for Agents SDK |
| `@openai/agents-core` | Core agent primitives |
| `@openai/agents-openai` | OpenAI model provider |
| `@openai/agents-extensions` | Contains experimental `codexTool()` bridge |

## Codex SDK — Direct API

```typescript
import { Codex } from "@openai/codex-sdk";

const codex = new Codex({ apiKey: "sk-..." });
const thread = codex.startThread({
  workingDirectory: "/path/to/repo",
  sandboxMode: "workspace-write",        // "read-only" | "workspace-write" | "danger-full-access"
  model: "o4-mini",
  approvalPolicy: "never",              // "never" | "on-request" | "on-failure" | "untrusted"
  modelReasoningEffort: "medium",        // "minimal" | "low" | "medium" | "high" | "xhigh"
  networkAccessEnabled: true,
  additionalDirectories: [],
});

// Non-streaming
const turn = await thread.run("Fix the failing tests");
console.log(turn.finalResponse);  // string
console.log(turn.usage);          // { input_tokens, cached_input_tokens, output_tokens }
console.log(turn.items);          // ThreadItem[]

// Streaming
const { events } = await thread.runStreamed("Refactor the auth module");
for await (const event of events) { /* ThreadEvent */ }

// Resume
const thread2 = codex.resumeThread("thread-id-here");
```

### Thread Events (streaming)

```typescript
type ThreadEvent =
  | { type: "thread.started"; thread_id: string }
  | { type: "turn.started" }
  | { type: "turn.completed"; usage: Usage }
  | { type: "turn.failed"; error: { message: string } }
  | { type: "item.started"; item: ThreadItem }
  | { type: "item.updated"; item: ThreadItem }
  | { type: "item.completed"; item: ThreadItem }
  | { type: "error"; message: string };
```

### Thread Items

```typescript
type ThreadItem =
  | { type: "agent_message"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "command_execution"; command: string; status: string; exit_code: number; aggregated_output: string }
  | { type: "file_change"; changes: FileUpdateChange[]; status: string }
  | { type: "mcp_tool_call"; server: string; tool: string; arguments: unknown; result?: string; error?: string }
  | { type: "web_search"; query: string }
  | { type: "todo_list"; items: { text: string; completed: boolean }[] }
  | { type: "error"; message: string };
```

## Agents SDK — Agent + run()

```typescript
import { Agent, run } from "@openai/agents";

const agent = new Agent({
  name: "Coder",
  instructions: "You are a coding assistant. Follow TDD.",
  model: "gpt-4.1",
  tools: [myTool],
  handoffs: [otherAgent],
  outputType: "text",
});

// Non-streaming
const result = await run(agent, "Write a haiku about recursion", {
  maxTurns: 10,
  signal: abortController.signal,
});
console.log(result.finalOutput);

// Streaming
const streamedResult = await run(agent, input, { stream: true });
```

### RunResult Shape

```typescript
interface RunResultData<TAgent> {
  input: string | AgentInputItem[];
  newItems: RunItem[];
  rawResponses: ModelResponse[];
  finalOutput?: string;  // for text output type
  lastAgent: TAgent;
}
```

### Usage Tracking

```typescript
class Usage {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}
```

## codexTool() — Bridge (experimental)

```typescript
import { Agent, run } from "@openai/agents";
import { codexTool } from "@openai/agents-extensions/experimental/codex";

const codex = codexTool({
  sandboxMode: "workspace-write",
  defaultThreadOptions: {
    model: "gpt-5.4",
    approvalPolicy: "never",
    workingDirectory: "/path/to/repo",
  },
  persistSession: true,
  onStream: async (event) => console.log(event.event.type),
});

const agent = new Agent({
  name: "Developer",
  instructions: "Use the codex tool to inspect and modify the workspace.",
  tools: [codex],
});

const result = await run(agent, "Fix the failing tests in src/auth/");
```

### codexTool Result

```typescript
type CodexToolResult = {
  threadId: string | null;
  response: string;
  usage: { input_tokens: number; cached_input_tokens: number; output_tokens: number } | null;
};
```

## Key Differences from Claude Agent SDK

| Concern | Claude Agent SDK | OpenAI Codex SDK |
|---------|-----------------|------------------|
| Entry point | `query()` async generator | `Codex` class → `thread.run()` |
| System prompt | `systemPrompt` option | No system prompt — instructions via input |
| Budget caps | Built-in `maxBudgetUsd` | **None** — must track externally |
| USD cost | `total_cost_usd` on result | **None** — raw tokens only, compute yourself |
| Working directory | `cwd` option | `workingDirectory` on thread |
| Permissions | `permissionMode` + `allowedTools` | `sandboxMode` + `approvalPolicy` |
| Process model | Spawns child process | Spawns child process (CLI wrapper) |
| Streaming | Yields `SDKMessage` from generator | `runStreamed()` returns `AsyncGenerator<ThreadEvent>` |

## Notes for Forge Integration

1. **No budget enforcement** — must abort via `AbortSignal` when token limit reached
2. **No USD cost** — need a pricing table to convert tokens → dollars
3. **No system prompt** — prepend instructions to the task input
4. **`codexTool()` is experimental** — may change between versions
5. **Two composition patterns:** Use Codex SDK directly (simpler) or via Agents SDK + `codexTool()` (more orchestration features)
