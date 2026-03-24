import type { PrismaClient } from '../../generated/prisma/client';
import { transitionIssue } from './issue-state-machine.utils';
import { transitionRun } from './run-state-machine.utils';
import type { IssueState, IssueTransition, RunState, RunTransition, StateChangeListener } from './state-machine.types';

export async function persistRunTransition(
  prisma: PrismaClient,
  runId: string,
  to: RunState,
  onStateChange?: StateChangeListener,
): Promise<RunTransition> {
  const run = await prisma.run.findUniqueOrThrow({ where: { id: runId } });
  const from = run.status as RunState;

  transitionRun(from, to);

  await prisma.run.update({ where: { id: runId }, data: { status: to } });

  const transition: RunTransition = { runId, from, to };
  onStateChange?.({ kind: 'run', transition });
  return transition;
}

export async function persistIssueTransition(
  prisma: PrismaClient,
  issueId: string,
  to: IssueState,
  onStateChange?: StateChangeListener,
): Promise<IssueTransition> {
  const issue = await prisma.issue.findUniqueOrThrow({ where: { id: issueId } });
  const from = issue.status as IssueState;

  transitionIssue(from, to);

  await prisma.issue.update({ where: { id: issueId }, data: { status: to } });

  const transition: IssueTransition = { issueId, from, to };
  onStateChange?.({ kind: 'issue', transition });
  return transition;
}
