import type { CommandExecutor } from '../coder/coder.types';

type WorktreeResult = { ok: true; worktreePath: string } | { ok: false; error: string };

export async function createWorktree(
  repoDir: string,
  branch: string,
  exec: CommandExecutor,
): Promise<WorktreeResult> {
  const worktreePath = `${repoDir}/.worktrees/${branch}`;

  const branchResult = await exec(`git branch ${branch}`, repoDir);
  if (branchResult.exitCode !== 0) {
    return { ok: false, error: `Failed to create branch ${branch}: ${branchResult.output.trim()}` };
  }

  const wtResult = await exec(`git worktree add ${worktreePath} ${branch}`, repoDir);
  if (wtResult.exitCode !== 0) {
    await exec(`git branch -D ${branch}`, repoDir);
    return { ok: false, error: `Failed to create worktree: ${wtResult.output.trim()}` };
  }

  return { ok: true, worktreePath };
}

export async function cleanupWorktree(
  repoDir: string,
  worktreePath: string,
  branch: string,
  exec: CommandExecutor,
): Promise<void> {
  await exec(`git worktree remove ${worktreePath} --force`, repoDir);
  await exec(`git worktree prune`, repoDir);
  await exec(`git branch -D ${branch}`, repoDir);
}
