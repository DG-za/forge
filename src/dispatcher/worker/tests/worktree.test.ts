import { describe, expect, it, vi } from 'vitest';
import type { CommandExecutor } from '../../coder/coder.types';
import { cleanupWorktree, createWorktree } from '../worktree';

type ExecCall = { command: string; cwd: string };

function createMockExec(responses: Record<string, { exitCode: number; output: string }> = {}): {
  exec: CommandExecutor;
  calls: ExecCall[];
} {
  const calls: ExecCall[] = [];
  const exec: CommandExecutor = vi.fn(async (command, cwd) => {
    calls.push({ command, cwd });
    for (const [pattern, response] of Object.entries(responses)) {
      if (command.includes(pattern)) return response;
    }
    return { exitCode: 0, output: '' };
  });
  return { exec, calls };
}

describe('createWorktree', () => {
  it('should create a branch and worktree', async () => {
    const { exec, calls } = createMockExec();

    const result = await createWorktree('/repos/owner/repo', 'feature/42-add-auth', exec);

    expect(result.ok).toBe(true);
    const branchCall = calls.find((c) => c.command.includes('git branch'));
    expect(branchCall?.command).toContain('feature/42-add-auth');
    const worktreeCall = calls.find((c) => c.command.includes('git worktree add'));
    expect(worktreeCall).toBeDefined();
  });

  it('should return the worktree path', async () => {
    const { exec } = createMockExec();

    const result = await createWorktree('/repos/owner/repo', 'feature/42-add-auth', exec);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.worktreePath).toContain('feature/42-add-auth');
  });

  it('should return failure when branch creation fails', async () => {
    const { exec } = createMockExec({
      'git branch': { exitCode: 128, output: 'fatal: branch already exists' },
    });

    const result = await createWorktree('/repos/owner/repo', 'feature/42-add-auth', exec);

    expect(result.ok).toBe(false);
  });

  it('should return failure when worktree add fails', async () => {
    const { exec } = createMockExec({
      'git worktree add': { exitCode: 128, output: 'fatal: worktree already exists' },
    });

    const result = await createWorktree('/repos/owner/repo', 'feature/42-add-auth', exec);

    expect(result.ok).toBe(false);
  });
});

describe('cleanupWorktree', () => {
  it('should remove worktree and delete branch', async () => {
    const { exec, calls } = createMockExec();

    await cleanupWorktree('/repos/owner/repo', '/repos/owner/repo/.worktrees/feature/42-add-auth', 'feature/42-add-auth', exec);

    const removeCall = calls.find((c) => c.command.includes('git worktree remove'));
    expect(removeCall).toBeDefined();
    const branchCall = calls.find((c) => c.command.includes('git branch -D'));
    expect(branchCall?.command).toContain('feature/42-add-auth');
  });

  it('should prune worktrees after removal', async () => {
    const { exec, calls } = createMockExec();

    await cleanupWorktree('/repos/owner/repo', '/tmp/wt', 'feature/42', exec);

    const pruneCall = calls.find((c) => c.command.includes('git worktree prune'));
    expect(pruneCall).toBeDefined();
  });
});
