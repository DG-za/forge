# 001 — Multi-Platform Agent Support

> Date: 2026-03-21 | Status: Accepted

## Context

Forge dispatches AI agents to work through GitHub epics. We researched four platforms: Claude Agent SDK, OpenAI Codex SDK, Cursor Cloud, and Google ADK. Each has different strengths — Claude and OpenAI have the best built-in coding tools, Gemini is cheapest, Cursor has cloud VMs.

## Decision

Support **multiple agent platforms** behind an abstraction layer, starting with **Claude Agent SDK** and **OpenAI Codex SDK**. The dispatcher (orchestrator) and workers can use different platforms — mix and match is a first-class feature.

### Architecture

```
Config: { dispatcher: { platform, model }, worker: { platform, model } }

┌─────────────────────────────┐
│         Dispatcher          │
│  platform: claude | openai  │
│  model: opus-4.6 | gpt-5.3 │
└──────────┬──────────────────┘
           │
           ▼  (for each issue)
┌─────────────────────────────┐
│          Worker             │
│  platform: claude | openai  │
│  model: sonnet-4.6 | o3    │
└─────────────────────────────┘
```

### Interface

```typescript
interface AgentRunner {
  run(task: string, options: RunOptions): AsyncGenerator<AgentMessage>;
}
```

Two implementations initially:
- `ClaudeRunner` — wraps `@anthropic-ai/claude-agent-sdk` `query()`
- `OpenAIRunner` — wraps `@openai/codex` `codexTool()` + `@openai/agents`

### What this enables

- Use Claude Opus for planning (strong reasoning) + OpenAI Codex for implementation (strong terminal workflows)
- Use Claude for everything (simplest setup)
- Use OpenAI for everything (cloud containers)
- Switch models per task based on complexity or budget
- Add Gemini later if cost savings justify building file/shell tooling

## Alternatives Considered

1. **Claude-only** — Simplest but locks us in. Rejected because OpenAI's Codex is competitive and having options is low-cost.
2. **Google ADK as framework** — Model-agnostic orchestration but no built-in coding tools. Too much custom tooling for v1.
3. **Cursor Cloud** — REST-only API, subscription-tied. Better as a product than a platform to build on.

## Consequences

- Need a normalised message format across SDKs (cost, progress, result)
- Need normalised cost tracking (each SDK reports differently)
- Two SDK dependencies instead of one
- Slightly more code, but the abstraction is thin (~100 lines per runner)
