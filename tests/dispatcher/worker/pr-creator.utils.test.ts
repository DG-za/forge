import { describe, expect, it, vi } from 'vitest';
import type { CommandExecutor } from '@/dispatcher/coder/coder.types';
import { createPullRequest } from '@/dispatcher/worker/pr-creator.utils';

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

const task = {
  issueNumber: 42,
  title: 'Add user authentication',
  body: 'Implement OAuth2 login flow',
  acceptanceCriteria: ['Users can log in with GitHub'],
};

describe('createPullRequest', () => {
  it('should push the branch before creating a PR', async () => {
    const { exec, calls } = createMockExec({
      'gh pr create': { exitCode: 0, output: 'https://github.com/owner/repo/pull/1' },
    });

    await createPullRequest({ worktreePath: '/worktree.utils', branch: 'feature/42-add-auth', task, exec });

    const pushCall = calls.find((c) => c.command.includes('git push'));
    const prCall = calls.find((c) => c.command.includes('gh pr create'));
    const pushIndex = calls.indexOf(pushCall!);
    const prIndex = calls.indexOf(prCall!);
    expect(pushIndex).toBeLessThan(prIndex);
  });

  it('should push with -u origin and branch name', async () => {
    const { exec, calls } = createMockExec({
      'gh pr create': { exitCode: 0, output: 'https://github.com/owner/repo/pull/1' },
    });

    await createPullRequest({ worktreePath: '/worktree.utils', branch: 'feature/42-add-auth', task, exec });

    const pushCall = calls.find((c) => c.command.includes('git push'));
    expect(pushCall?.command).toContain('-u origin feature/42-add-auth');
  });

  it('should return PR URL on success', async () => {
    const { exec } = createMockExec({
      'gh pr create': { exitCode: 0, output: 'https://github.com/owner/repo/pull/1\n' },
    });

    const result = await createPullRequest({ worktreePath: '/worktree.utils', branch: 'feature/42-add-auth', task, exec });

    expect(result).toBe('https://github.com/owner/repo/pull/1');
  });

  it('should return null when push fails', async () => {
    const { exec } = createMockExec({
      'git push': { exitCode: 1, output: 'fatal: remote rejected' },
    });

    const result = await createPullRequest({ worktreePath: '/worktree.utils', branch: 'feature/42-add-auth', task, exec });

    expect(result).toBeNull();
  });

  it('should return null when gh pr create fails', async () => {
    const { exec } = createMockExec({
      'gh pr create': { exitCode: 1, output: 'error creating PR' },
    });

    const result = await createPullRequest({ worktreePath: '/worktree.utils', branch: 'feature/42-add-auth', task, exec });

    expect(result).toBeNull();
  });

  it('should include issue number in PR title', async () => {
    const { exec, calls } = createMockExec({
      'gh pr create': { exitCode: 0, output: 'https://github.com/owner/repo/pull/1' },
    });

    await createPullRequest({ worktreePath: '/worktree.utils', branch: 'feature/42-add-auth', task, exec });

    const prCall = calls.find((c) => c.command.includes('gh pr create'));
    expect(prCall?.command).toContain('#42');
  });

  it('should run commands in the worktree directory', async () => {
    const { exec, calls } = createMockExec({
      'gh pr create': { exitCode: 0, output: 'https://github.com/owner/repo/pull/1' },
    });

    await createPullRequest({ worktreePath: '/worktree.utils', branch: 'feature/42-add-auth', task, exec });

    for (const call of calls) {
      expect(call.cwd).toBe('/worktree.utils');
    }
  });
});
