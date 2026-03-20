# AI Coding Agent Platforms — Research Brief

> Issue: #3 | Date: 2026-03-20

## Overview

Comparison of four platforms for building a fire-and-forget autonomous coding agent dispatcher: **Claude Agent SDK**, **OpenAI Codex SDK**, **Cursor Cloud Agents**, and **Google ADK + Gemini**.

---

## 1. Platform Summaries

### Claude Agent SDK

- **Package:** `@anthropic-ai/claude-agent-sdk` (npm, v0.2.71)
- **Type:** Embeddable TypeScript/Python SDK
- **Entry point:** `query()` — async generator that streams messages as the agent works
- **Built-in tools:** Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, Agent (subagents)
- **Subagents:** Built-in, one level deep, can run concurrently, separate context per subagent
- **Sessions:** Persist and resume via `session_id`
- **MCP:** Full support (stdio, SSE, HTTP, in-process)
- **Cost tracking:** Built-in per-session (`total_cost_usd`, token breakdown, per-model usage)
- **Permission modes:** `default`, `acceptEdits`, `bypassPermissions`, `plan`, `dontAsk`
- **Sandboxing:** Built-in sandbox runtime, Docker, gVisor, Firecracker VMs

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Fix the bug in auth.py",
  options: {
    allowedTools: ["Read", "Edit", "Bash"],
    permissionMode: "acceptEdits",
    maxTurns: 30,
    maxBudgetUsd: 5.00,
    model: "claude-sonnet-4-6",
    settingSources: ["project"],
  }
})) {
  if (message.type === "result") {
    console.log(`Cost: $${message.total_cost_usd}`);
  }
}
```

### OpenAI Codex SDK

- **Package:** `@openai/codex` (npm) + `@openai/agents` for orchestration
- **Type:** Embeddable TypeScript SDK + REST API (Responses API)
- **Entry point:** `codexTool()` wraps Codex CLI for agent delegation; Agents SDK for orchestration
- **Built-in tools:** Shell (full terminal), apply_patch (file editing), file search, code interpreter, web search, computer use
- **Subagents:** Built-in via Agents SDK, parallel execution, handoffs between agents
- **Sessions:** Server-side compaction allows hours/days of execution
- **MCP:** stdio-based only (no HTTP MCP yet)
- **Cost tracking:** Via Responses API usage stats
- **Sandboxing:** OpenAI-hosted containers (Debian 12), or local execution
- **Unique:** Cloud-native async execution — agents run in hosted VMs, return results later. Automations for CI/CD triggers.

```typescript
import { Agent, run } from "@openai/agents";
import { codexTool } from "@openai/codex";

const agent = new Agent({
  name: "worker",
  model: "gpt-5.3-codex",
  tools: [codexTool({ permissions: "auto-edit" })],
});

const result = await run(agent, "Implement issue #42");
```

### Cursor Cloud Agents

- **Type:** REST API (no embeddable SDK)
- **Entry point:** HTTP endpoints for launching, monitoring, and managing cloud agents
- **Built-in tools:** Full VM environment — file I/O, shell, tests, video recording
- **Subagents:** Launch multiple cloud agents in parallel (10-20+)
- **MCP:** Supported
- **Models:** Multi-model (Claude, GPT, Gemini — user's choice)
- **Unique:** Automations triggered by GitHub events, Slack messages, Linear issues, cron schedules. 35% of Cursor's internal PRs are created by cloud agents.
- **Limitation:** REST-only (no `import cursor`), tied to subscription pricing, real context ~70-120K despite 200K advertised

### Google ADK + Gemini

- **Package:** `@google/adk` (npm)
- **Type:** Embeddable TypeScript/Python SDK, model-agnostic
- **Entry point:** `LlmAgent` with custom tools
- **Built-in tools:** Code interpreter, Google Search, computer use — but **no built-in file I/O or shell tools** (must implement custom `FunctionTool` instances)
- **Subagents:** `SequentialAgent`, `ParallelAgent`, `LoopAgent` — structured orchestration patterns
- **MCP:** Supported
- **Models:** Gemini-optimised but works with any model
- **Unique:** Cheapest pricing by far. 1M context on even the cheapest models. Open-source framework.
- **Limitation:** You build all file/shell tooling yourself. ADK TypeScript is newer than Python version.

```typescript
import { LlmAgent, FunctionTool } from "@google/adk";

const agent = new LlmAgent({
  name: "worker",
  model: "gemini-2.5-flash",
  instruction: "Implement the feature described.",
  tools: [readFileTool, editFileTool, shellTool], // custom tools
});
```

---

## 2. Pricing Comparison

### Per 1M Tokens

| Platform | Model | Input | Output | Context |
|----------|-------|-------|--------|---------|
| **Claude** | Opus 4.6 | $5.00 | $25.00 | 1M |
| **Claude** | Sonnet 4.6 | $3.00 | $15.00 | 1M |
| **Claude** | Haiku 4.5 | $1.00 | $5.00 | 200K |
| **OpenAI** | GPT-5.3-Codex | $3.00 | $15.00 | ~272K |
| **OpenAI** | o3 | $2.00 | $8.00 | 200K |
| **OpenAI** | o3-mini | $0.50 | $1.10 | 200K |
| **Gemini** | 2.5 Flash | **$0.30** | **$2.50** | 1M |
| **Gemini** | 2.5 Pro | $1.25 | $10.00 | 1M |
| **Gemini** | 3 Flash Preview | $0.50 | $3.00 | 1M |
| **Cursor** | Credit pool | $20/mo subscription | — | ~70-120K |

### Cost Optimisation

| Feature | Claude | OpenAI | Gemini |
|---------|--------|--------|--------|
| Prompt caching | 0.1x on read | 0.1–0.5x on read | 0.1x on read |
| Batch API | 50% off | 50% off | 50% off |
| Auto-caching in SDK | Yes | Yes | Manual |

### Estimated Cost per Worker Task (bug fix / small feature)

| Platform | Model | Estimate |
|----------|-------|----------|
| Claude | Sonnet 4.6 | $0.10–0.50 |
| OpenAI | GPT-5.3-Codex | $0.10–0.50 |
| Gemini | 2.5 Flash | **$0.01–0.10** |
| Gemini | 2.5 Pro | $0.05–0.30 |

---

## 3. Capability Comparison

| Capability | Claude SDK | OpenAI Codex | Cursor Cloud | Google ADK |
|------------|-----------|--------------|-------------|------------|
| Embeddable TS SDK | Yes | Yes | No (REST) | Yes |
| Built-in file I/O | Yes | Yes | Yes (VM) | No (DIY) |
| Built-in shell | Yes | Yes | Yes (VM) | No (DIY) |
| Subagents | 1 level deep | Multi-level | Parallel VMs | Sequential/Parallel/Loop |
| MCP support | Full | stdio only | Yes | Yes |
| Cost tracking | Built-in | Built-in | Subscription | Manual |
| Budget caps | `maxBudgetUsd` | Via API | Credit pool | Manual |
| Cloud execution | Docker (self-host) | Hosted containers | Hosted VMs | Self-host |
| Session resume | Yes | Yes | Via API | Manual |
| Structured output | JSON schema | JSON schema | N/A | JSON schema |
| Multi-model | Claude only | OpenAI only | Multi-model | Model-agnostic |

---

## 4. Strengths and Weaknesses

### Claude Agent SDK

**Strengths:**
- Simplest API for coding automation (`query()` does everything)
- Best built-in tool suite (Read, Edit, Bash, Glob, Grep)
- Strong code quality and multi-step reasoning
- Built-in cost tracking with `maxBudgetUsd`
- Loads project conventions via `settingSources`
- Mature sandboxing options

**Weaknesses:**
- Claude-only (vendor lock-in)
- Opus rate limits are strict for parallel agents
- SDK spawns a child process under the hood
- No hosted cloud execution (must self-host Docker)

### OpenAI Codex SDK

**Strengths:**
- Cloud-native async execution (hosted sandboxed containers)
- Parallel agent teams with subagent orchestration
- `codexTool()` bridges Codex CLI into Agents SDK cleanly
- Automations for CI/CD triggers
- GPT-5.3-Codex leads Terminal-Bench 2.0 (77.3% vs Claude's 65.4%)

**Weaknesses:**
- Codex context window limited (~272K vs Claude/Gemini 1M)
- Newer ecosystem, less battle-tested
- stdio-only MCP (no HTTP endpoints)
- Container pricing adds up ($0.03/container + $0.03/20min)

### Cursor Cloud Agents

**Strengths:**
- Full VM isolation with video recording of work
- Automations (GitHub, Slack, Linear, cron triggers)
- Multi-model choice (Claude, GPT, Gemini)
- 35% of Cursor's internal PRs come from cloud agents

**Weaknesses:**
- No embeddable SDK — REST API only, adds HTTP dependency layer
- Tied to subscription ($20+/mo)
- Real usable context ~70-120K despite 200K advertised
- Less control over agent behaviour than SDK approaches

### Google ADK + Gemini

**Strengths:**
- **5-10x cheaper** than Claude/OpenAI
- 1M context on all models including cheapest
- Model-agnostic framework (can use Claude/OpenAI models too)
- Structured multi-agent orchestration (Sequential/Parallel/Loop)
- Open-source, active development

**Weaknesses:**
- **No built-in file/shell tools** — must implement all coding tools yourself
- Weaker code quality on complex refactors vs Claude/OpenAI
- ADK TypeScript is newer, may lag behind Python version
- Free tier depletes quickly with agent workloads

---

## 5. Fit for Forge

Forge needs: fire-and-forget dispatch, read GitHub epics, sequence issues, spawn worker agents that branch/implement/PR.

| Platform | Fit | Rationale |
|----------|-----|-----------|
| **Claude Agent SDK** | **Strong** | Built-in coding tools, simple API, good code quality. Lock-in is the tradeoff. Least code to get working. |
| **OpenAI Codex SDK** | **Strong** | Cloud containers, async execution, coding-optimised model. Good alternative. Smaller context window. |
| **Cursor Cloud** | **Moderate** | REST-only adds complexity. Subscription-tied. Better as a product than a platform to build on. |
| **Google ADK** | **Moderate** | Cheapest by far, but building file/shell tooling is significant work. Best if cost is the primary concern. |

### Hybrid Option

Use **Google ADK as the framework** (model-agnostic orchestration) with **Claude or OpenAI as the model** for coding tasks. This gives you ADK's structured orchestration patterns without Gemini's weaker code quality, but you still need to build file/shell tools.

---

## 6. Security Comparison

| Concern | Claude SDK | OpenAI Codex | Cursor Cloud | Google ADK |
|---------|-----------|--------------|-------------|------------|
| Permission control | 5 modes + fine-grained tool filtering | Approval policies | Agent-level config | Custom (DIY) |
| Sandboxing | Built-in runtime, Docker, gVisor, VMs | Hosted containers | Hosted VMs | Self-managed |
| Credential isolation | Proxy pattern, env filtering | Container isolation | VM isolation | Self-managed |
| Network control | Configurable | Container networking | VM networking | Self-managed |
| Prompt injection defence | Opus 4.6 rated most robust | Model-level | Model-dependent | Model-dependent |

---

## Sources

### Claude
- [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Secure Deployment](https://platform.claude.com/docs/en/agent-sdk/secure-deployment)

### OpenAI
- [Codex SDK Docs](https://developers.openai.com/codex/sdk)
- [Agents SDK Guide](https://developers.openai.com/api/docs/guides/agents-sdk)
- [Codex + Agents SDK](https://developers.openai.com/codex/guides/agents-sdk)
- [API Pricing](https://developers.openai.com/api/docs/pricing)
- [Shell Tool](https://developers.openai.com/api/docs/guides/tools-shell)

### Cursor
- [Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints)
- [CLI Headless Mode](https://cursor.com/docs/cli/headless)
- [Automations](https://cursor.com/blog/automations)
- [Pricing](https://cursor.com/pricing)

### Google
- [ADK Overview](https://docs.cloud.google.com/agent-builder/agent-development-kit/overview)
- [ADK TypeScript](https://github.com/google/adk-js)
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Coding Agents Guide](https://ai.google.dev/gemini-api/docs/coding-agents)
