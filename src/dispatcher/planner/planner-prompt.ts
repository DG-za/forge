import type { EpicContext, ReplanContext } from './planner.types';

export const PLANNER_SYSTEM_PROMPT = `You are a senior software architect decomposing a GitHub epic into ordered tasks.

Output ONLY valid JSON matching the schema below. No markdown, no explanation — just JSON.

Schema:
{
  "summary": "Brief human-readable summary of the plan",
  "tasks": [
    {
      "issueNumber": number | null,
      "title": "Task title",
      "acceptanceCriteria": ["criterion 1", "criterion 2"],
      "dependencies": [issueNumber, ...],
      "complexity": "small" | "medium" | "large"
    }
  ]
}

Rules:
- Order tasks by dependency (dependencies first) then by complexity (smaller first).
- Use existing issue numbers where applicable. Set issueNumber to null for new suggested tasks.
- Keep acceptance criteria specific and testable.
- "small" = under 100 lines, "medium" = 100-300, "large" = 300+.`;

export function buildPlanPrompt(context: EpicContext): string {
  const issueList = context.issues
    .map(
      (i) =>
        `- #${i.number}: ${i.title} [${i.state}]\n  ${i.body}\n  Labels: ${i.labels.join(', ') || 'none'}`,
    )
    .join('\n');

  return `Decompose this epic into an ordered plan of tasks.

## Epic: ${context.epicTitle} (#${context.epicNumber})

${context.epicBody}

## Sub-issues

${issueList}

Produce a plan covering all open issues. Include closed issues in dependency references but don't re-plan them.`;
}

export function buildReplanPrompt(context: EpicContext, replanContext: ReplanContext): string {
  const completedList = replanContext.completedIssues
    .map((i) => `- #${i.issueNumber}: ${i.outcome} — ${i.notes}`)
    .join('\n');

  const remainingList = replanContext.remainingIssues
    .map((i) => `- #${i.number}: ${i.title}\n  ${i.body}`)
    .join('\n');

  return `Re-evaluate the remaining tasks for this epic based on what has been completed.

## Epic: ${context.epicTitle} (#${context.epicNumber})

${context.epicBody}

## Original plan

${replanContext.originalPlan.summary}

## Completed issues

${completedList}

## Remaining issues

${remainingList}

Produce a revised plan for the remaining work only. Adjust order, scope, or add tasks based on what was learned.`;
}
