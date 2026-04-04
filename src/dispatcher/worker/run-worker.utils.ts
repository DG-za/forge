import type { Cost } from '../agent-runner.types';
import type { CommandExecutor } from '../coder/coder.types';
import { processIssue } from '../pipeline/process-issue.utils';
import { buildWorkerContext } from './context-builder.utils';
import { verifyGitAccess } from './git-auth.utils';
import { createPullRequest } from './pr-creator.utils';
import { ensureRepo } from './repo-manager.utils';
import type { WorkerOptions, WorkerResult } from './worker.types';
import { cleanupWorktree, createWorktree } from './worktree.utils';

const ZERO_COST: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 0 };

export async function runWorker(options: WorkerOptions): Promise<WorkerResult> {
  const { task, repoConfig, exec } = options;
  const issueNumber = task.issueNumber ?? 0;
  const branch = buildBranchName(issueNumber, task.title);
  const failed = (cost: Cost = ZERO_COST): WorkerResult => ({
    issueNumber,
    status: 'failed',
    cost,
    prUrl: null,
    branch,
  });

  const auth = await verifyGitAccess(repoConfig.repo, exec);
  if (!auth.ok) return failed();

  const repo = await ensureRepo(repoConfig.repo, repoConfig.basePath, exec);
  if (!repo.ok) return failed();

  const worktree = await createWorktree(repo.repoDir, branch, exec);
  if (!worktree.ok) return failed();

  try {
    const context = await buildWorkerContext(worktree.worktreePath, task, exec);
    const enrichedTask = { ...task, body: context };

    const outcome = await processIssue({
      task: enrichedTask,
      coder: options.coder,
      reviewer: options.reviewer,
      gateConfig: options.gateConfig,
      cwd: worktree.worktreePath,
      maxBudgetUsd: options.maxBudgetUsd,
      exec,
      getDiff: () => getDiff(worktree.worktreePath, exec),
      onAgentComplete: options.onAgentComplete,
    });

    const prUrl = outcome.status === 'done' ? await createPullRequest({ worktreePath: worktree.worktreePath, branch, task, exec }) : null;

    return { issueNumber, status: outcome.status, cost: outcome.cost, prUrl, branch };
  } catch {
    return failed();
  } finally {
    await cleanupWorktree({ repoDir: repo.repoDir, worktreePath: worktree.worktreePath, branch, exec });
  }
}

function buildBranchName(issueNumber: number, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-')
    .slice(0, 5)
    .join('-');
  return `feature/${issueNumber}-${slug}`;
}

async function getDiff(worktreePath: string, exec: CommandExecutor): Promise<string> {
  const { output } = await exec('git diff HEAD', worktreePath);
  return output;
}
