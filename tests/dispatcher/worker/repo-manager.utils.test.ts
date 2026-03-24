import { describe, expect, it, vi } from 'vitest';
import type { CommandExecutor } from '@/dispatcher/coder/coder.types';
import { ensureRepo } from '@/dispatcher/worker/repo-manager.utils';

type ExecCall = { command: string; cwd: string };

function createMockExec(responses: Record<string, { exitCode: number; output: string }>): {
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

describe('ensureRepo', () => {
  it('should clone when repo directory does not exist', async () => {
    const { exec, calls } = createMockExec({
      'test -d': { exitCode: 1, output: '' },
      'git clone': { exitCode: 0, output: 'Cloning...' },
    });

    const result = await ensureRepo('owner/repo', '/repos', exec);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.repoDir).toBe('/repos/owner/repo');
    const cloneCall = calls.find((c) => c.command.includes('git clone'));
    expect(cloneCall?.command).toContain('https://github.com/owner/repo.git');
    expect(cloneCall?.command).toContain('/repos/owner/repo');
  });

  it('should pull when repo directory already exists', async () => {
    const { exec, calls } = createMockExec({
      'test -d': { exitCode: 0, output: '' },
      'git pull': { exitCode: 0, output: 'Already up to date.' },
    });

    const result = await ensureRepo('owner/repo', '/repos', exec);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.repoDir).toBe('/repos/owner/repo');
    const pullCall = calls.find((c) => c.command.includes('git pull'));
    expect(pullCall).toBeDefined();
    expect(pullCall?.cwd).toBe('/repos/owner/repo');
  });

  it('should return failure when clone fails', async () => {
    const { exec } = createMockExec({
      'test -d': { exitCode: 1, output: '' },
      'git clone': { exitCode: 128, output: 'fatal: repository not found' },
    });

    const result = await ensureRepo('owner/repo', '/repos', exec);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('owner/repo');
  });

  it('should create parent directory before cloning', async () => {
    const { exec, calls } = createMockExec({
      'test -d': { exitCode: 1, output: '' },
      mkdir: { exitCode: 0, output: '' },
      'git clone': { exitCode: 0, output: 'Cloning...' },
    });

    await ensureRepo('owner/repo', '/repos', exec);

    const mkdirCall = calls.find((c) => c.command.includes('mkdir'));
    expect(mkdirCall?.command).toContain('/repos/owner');
  });

  it('should checkout default branch and pull on existing repo', async () => {
    const { exec, calls } = createMockExec({
      'test -d': { exitCode: 0, output: '' },
      'git checkout': { exitCode: 0, output: '' },
      'git pull': { exitCode: 0, output: 'Already up to date.' },
    });

    await ensureRepo('owner/repo', '/repos', exec);

    const checkoutCall = calls.find((c) => c.command.includes('git checkout'));
    expect(checkoutCall).toBeDefined();
  });
});
