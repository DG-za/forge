# Claude Agent SDK — Research Brief

> Issue: #3 | Date: 2026-03-20

## 1. Agent SDK API Surface

### Package

- **TypeScript:** `@anthropic-ai/claude-agent-sdk` (npm, v0.2.71)
- **Python:** `claude-agent-sdk` (PyPI, v0.1.48)
- Formerly "Claude Code SDK" — renamed late 2025

### Core Function: `query()`

Async generator that streams messages as the agent works.

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix the bug in auth.py",
  options: {
    allowedTools: ["Read", "Edit", "Bash"],
    permissionMode: "acceptEdits",
    maxTurns: 30,
    maxBudgetUsd: 5.00,
    effort: "high",
    systemPrompt: "You are a senior developer.",
    cwd: "/path/to/project",
    settingSources: ["project"],
  }
})) {
  if (message.type === "result") {
    console.log(`Done: ${message.result}`);
    console.log(`Cost: $${message.total_cost_usd}`);
  }
}
```

### Key Options

| Option | Type | Description |
|--------|------|-------------|
| `allowedTools` | `string[]` | Tools to auto-approve |
| `disallowedTools` | `string[]` | Tools to always deny |
| `permissionMode` | `PermissionMode` | `"default"` / `"acceptEdits"` / `"bypassPermissions"` / `"plan"` / `"dontAsk"` |
| `canUseTool` | callback | Custom per-tool permission logic |
| `maxTurns` | `number` | Max agentic turns |
| `maxBudgetUsd` | `number` | Spending cap in USD |
| `effort` | `string` | `"low"` / `"medium"` / `"high"` / `"max"` |
| `model` | `string` | e.g. `"claude-sonnet-4-6"` |
| `systemPrompt` | `string \| preset` | Custom or Claude Code preset with optional append |
| `agents` | `Record<string, AgentDef>` | Subagent definitions |
| `mcpServers` | `Record<string, McpConfig>` | MCP server configs |
| `resume` | `string` | Session ID to resume |
| `cwd` | `string` | Working directory |
| `settingSources` | `string[]` | Which settings to load (loads CLAUDE.md etc.) |
| `outputFormat` | `json_schema` | Structured JSON output |
| `sandbox` | `SandboxSettings` | Sandbox configuration |
| `abortController` | `AbortController` | Cancellation |

### Built-in Tools

`Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `WebSearch`, `WebFetch`, `Agent` (subagents), `Skill`, `AskUserQuestion`, `ToolSearch`, `TodoWrite`

### Subagents

```typescript
agents: {
  "code-reviewer": {
    description: "Security-focused code reviewer",
    prompt: "You are a security specialist...",
    tools: ["Read", "Grep", "Glob"],
    model: "sonnet",
    maxTurns: 15,
  }
}
```

- Fresh context window per subagent (no parent history)
- Only the final response returns to parent
- Cannot spawn nested subagents (one level deep)
- Can run concurrently
- Model options: `"sonnet"`, `"opus"`, `"haiku"`, `"inherit"`

### Sessions

Sessions persist and can be resumed via `resume: sessionId`. The result message contains `session_id` and full usage stats. Sessions can also be forked.

### Other Functions

- `tool()` — create type-safe MCP tool definitions with Zod
- `createSdkMcpServer()` — in-process MCP server
- `listSessions()` / `getSessionMessages()` — session history

---

## 2. Cost Model

### Pricing (March 2026)

| Model | Input | Output | Context |
|-------|-------|--------|---------|
| **Opus 4.6** | $5/MTok | $25/MTok | 1M tokens |
| **Sonnet 4.6** | $3/MTok | $15/MTok | 1M tokens |
| **Haiku 4.5** | $1/MTok | $5/MTok | 200k tokens |

Opus 4.6 and Sonnet 4.6 have **no long-context pricing premium**.

### Prompt Caching

| Operation | Multiplier |
|-----------|-----------|
| 5-min cache write | 1.25x input |
| 1-hour cache write | 2x input |
| Cache read | **0.1x input** |

The SDK uses prompt caching automatically for system prompts, tool definitions, and CLAUDE.md.

### Batch API (50% Off)

Opus 4.6: $2.50/$12.50. Sonnet 4.6: $1.50/$7.50. Haiku 4.5: $0.50/$2.50.

### Cost Tracking in the SDK

```typescript
if (message.type === "result") {
  console.log(`Total: $${message.total_cost_usd}`);
  console.log(`Turns: ${message.num_turns}`);
  console.log(`Input: ${message.usage.input_tokens}`);
  console.log(`Output: ${message.usage.output_tokens}`);
  console.log(`Cache reads: ${message.usage.cache_read_input_tokens}`);
  // Per-model breakdown available via message.modelUsage
}
```

### Typical Costs

| Task | Estimate |
|------|----------|
| Simple file analysis | $0.01–0.05 |
| Bug fix (read, analyse, edit, test) | $0.10–0.50 |
| Complex refactor (30+ tool calls) | $0.50–5.00 |

---

## 3. Limitations

### Context Window

- Opus 4.6 / Sonnet 4.6: **1M tokens** (GA, no premium)
- Older models: 200k (1M in beta at Tier 4)
- **Automatic compaction** when approaching the limit — emits `compact_boundary` message

### Rate Limits

- Token bucket algorithm (continuous replenishment)
- Per-organization, per-model
- **Opus has stricter throughput** than Sonnet/Haiku
- 3+ parallel agents on Opus can exceed concurrent request limits
- Cached tokens don't count toward input TPM
- Tier system: Tier 1 ($5) through Tier 4 ($400+)

### Tool Execution

- Read-only tools run **concurrently** within a turn
- State-modifying tools run **sequentially**
- Subagents: one level deep only
- Windows: command line limit of 8191 chars for subagent prompts

### System Requirements

- Node.js 18+ (required even for Python SDK)
- ~1 GiB RAM, ~5 GiB disk, 1 CPU per SDK instance
- Outbound HTTPS to `api.anthropic.com`

### Other Gotchas

- `query()` creates a new session per call unless resuming
- No built-in cross-session cost aggregation
- SDK spawns a child process (Claude Code CLI) under the hood
- `settingSources` defaults to `[]` — must opt in to load CLAUDE.md

---

## 4. Comparison with Alternatives

### Agent SDK vs Raw Anthropic Client SDK

| Aspect | Agent SDK | Client SDK |
|--------|-----------|------------|
| Tool execution | Built-in, automatic | You implement the tool loop |
| File/shell operations | Built-in tools | DIY |
| Context management | Automatic compaction | Manual |
| Subagents | Built-in | DIY |
| Cost tracking | Built-in | DIY |
| Overhead | Spawns a child process | Direct API calls |
| Flexibility | Opinionated | Full control |

### Agent SDK vs Claude Code CLI

| Use case | Best choice |
|----------|-------------|
| Interactive development | CLI |
| CI/CD pipelines | SDK |
| Custom automation apps | SDK |
| One-off tasks | CLI |

### Agent SDK vs LangGraph / CrewAI

| Aspect | Agent SDK | LangGraph / CrewAI |
|--------|-----------|-------------------|
| Model support | Claude only | Multi-LLM |
| Built-in tools | File ops, shell, web | Requires implementation |
| Complexity | Simple (`query()`) | More complex, more flexible |
| Best for | Claude-centric coding automation | Complex multi-agent orchestration |

**Key differentiator:** Built-in tool execution. Other frameworks require you to implement file I/O, code editing, command execution. The Agent SDK provides all of this out of the box. The tradeoff is Claude-only lock-in.

---

## 5. Recommended Patterns for Forge

### Architecture

```
Dispatcher (Opus, high effort)
  ├── Read epic, plan work, sequence issues
  └── For each issue (sequential):
        Worker (Sonnet, per-issue)
          ├── Create branch
          ├── Implement changes
          ├── Self-review (subagent)
          └── Create PR
```

### Implementation Sketch

```typescript
// Dispatcher
for await (const msg of query({
  prompt: `Read epic #${epicNumber}. Return issue numbers in dependency order.`,
  options: {
    model: "claude-opus-4-6",
    effort: "high",
    maxBudgetUsd: 1.00,
    outputFormat: { type: "json_schema", schema: issueListSchema },
    permissionMode: "bypassPermissions",
  }
})) { /* extract ordered issue list */ }

// Worker (per issue)
for await (const msg of query({
  prompt: `Implement #${issueNumber}. Branch, implement, commit, push, create PR.`,
  options: {
    model: "claude-sonnet-4-6",
    effort: "high",
    maxTurns: 50,
    maxBudgetUsd: 3.00,
    permissionMode: "bypassPermissions",
    settingSources: ["project"],
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append: "Follow AGENTS.md strictly.",
    },
  }
})) { /* track cost, log progress */ }
```

### Key Recommendations

1. **Opus for dispatcher, Sonnet for workers.** Saves significant cost since implementation generates far more tokens.
2. **Sequential workers** unless you have high rate limit tiers. Opus has strict throughput limits.
3. **Always set `maxBudgetUsd` and `maxTurns`** on every worker to prevent runaway costs.
4. **`permissionMode: "bypassPermissions"` only inside Docker.** Use `"acceptEdits"` on dev machines.
5. **Use subagents within workers** for self-review before PR creation.
6. **Track cumulative cost** manually across workers — the SDK doesn't aggregate across sessions.
7. **Use `resume`** if a worker hits limits — capture `session_id` and continue.
8. **Load CLAUDE.md via `settingSources: ["project"]`** so workers follow project conventions.
9. **Docker containers** for each worker — isolation and security.

---

## 6. Security Considerations

### Permission Modes

| Mode | Behaviour |
|------|-----------|
| `"default"` | Falls through to `canUseTool` callback |
| `"acceptEdits"` | Auto-approves file edits |
| `"dontAsk"` | Never prompts, denies unapproved tools |
| `"bypassPermissions"` | Runs everything (cannot run as root) |
| `"plan"` | No tool execution, plan only |

Fine-grained: `allowedTools: ["Bash(npm:*)"]` restricts Bash to npm commands only.

### Sandboxing Options

1. **Built-in sandbox** (`@anthropic-ai/sandbox-runtime`): OS-level primitives, 84% fewer permission prompts
2. **Docker**: `--cap-drop ALL`, `--network none`, `--read-only`, `--memory 2g`, `--user 1000:1000`
3. **gVisor**: Userspace syscall interception, stronger than plain Docker
4. **VMs (Firecracker)**: Hardware isolation, <125ms boot, <5 MiB overhead

### Credential Safety

Use the **proxy pattern** — place credentials outside the agent's boundary. Route API calls through a proxy that injects keys so the agent never sees secrets.

Never mount: `.env`, `~/.ssh`, `~/.aws`, `~/.config`, `~/.docker`, `.npmrc`, `*.pem`, `*.key`

### Threat Model

Primary risk: **prompt injection** via malicious content in processed files. Defence in depth: network controls, filesystem restrictions, credential isolation.

---

## Sources

- [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Agent SDK Quickstart](https://platform.claude.com/docs/en/agent-sdk/quickstart)
- [TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [Subagents Docs](https://platform.claude.com/docs/en/agent-sdk/subagents)
- [Hosting Guide](https://platform.claude.com/docs/en/agent-sdk/hosting)
- [Secure Deployment](https://platform.claude.com/docs/en/agent-sdk/secure-deployment)
- [Cost Tracking](https://platform.claude.com/docs/en/agent-sdk/cost-tracking)
- [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [npm: @anthropic-ai/claude-agent-sdk](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)
- [Agent SDK Demos](https://github.com/anthropics/claude-agent-sdk-demos)
