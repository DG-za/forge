import type { EpicContext, ReplanContext } from './planner.types';

export function buildPlanPrompt(context: EpicContext): string {
  const issueList = context.issues
    .map((i) => `- #${i.number}: ${i.title} [${i.state}]\n  ${i.body}\n  Labels: ${i.labels.join(', ') || 'none'}`)
    .join('\n');

  return `Decompose this epic into an ordered plan of tasks.

## Epic: ${context.epicTitle} (#${context.epicNumber})

${context.epicBody}

## Sub-issues

${issueList}

Produce a plan covering all open issues. Include closed issues in dependency references but don't re-plan them.${buildRepoIssuesSection(context)}`;
}

export function buildReplanPrompt(context: EpicContext, replanContext: ReplanContext): string {
  const completedList = replanContext.completedIssues
    .map((i) => `- #${i.issueNumber}: ${i.outcome} — ${i.notes}`)
    .join('\n');

  const remainingList = replanContext.remainingIssues.map((i) => `- #${i.number}: ${i.title}\n  ${i.body}`).join('\n');

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

function buildRepoIssuesSection(context: EpicContext): string {
  if (context.repoIssues.length === 0) return '';

  const repoIssueList = context.repoIssues
    .map((i) => `- #${i.number}: ${i.title} [${i.state}]\n  ${i.body}`)
    .join('\n');

  return `

## Other open issues in this repo

Check for overlap — if an existing issue covers a planned task, reference it instead of duplicating.

${repoIssueList}`;
}
