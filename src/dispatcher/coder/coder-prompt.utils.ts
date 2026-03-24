import type { CoderTask, QualityGateResult } from './coder.types';

export function buildCoderPrompt(task: CoderTask): string {
  const issueRef = task.issueNumber !== null ? ` (#${task.issueNumber})` : '';
  const criteria = task.acceptanceCriteria.map((c) => `- ${c}`).join('\n');

  return `Implement the following issue using TDD.

## Issue: ${task.title}${issueRef}

${task.body}

## Acceptance Criteria

${criteria}

Write tests first from the acceptance criteria, then implement until all tests pass.`;
}

export function buildFixPrompt(gateResult: QualityGateResult): string {
  const failures = gateResult.gates
    .filter((g) => !g.passed)
    .map((g) => `### ${g.gate}\n\n${g.output}`)
    .join('\n\n');

  return `Quality gates failed. Fix the following issues and try again.

${failures}`;
}
