import { describe, expect, it, vi } from 'vitest';
import type { CommandExecutor } from '@/dispatcher/coder/coder.types';
import { verifyGitAccess } from '@/dispatcher/worker/git-auth.utils';

function mockExec(exitCode: number, output: string): CommandExecutor {
  return vi.fn().mockResolvedValue({ exitCode, output });
}

describe('verifyGitAccess', () => {
  it('should return success when git ls-remote succeeds', async () => {
    const exec = mockExec(0, 'abc123\tHEAD\n');

    const result = await verifyGitAccess('owner/repo', exec);

    expect(result.ok).toBe(true);
    expect(exec).toHaveBeenCalledWith(
      'git ls-remote --exit-code https://github.com/owner/repo.git HEAD',
      expect.any(String),
    );
  });

  it('should return failure with message when git ls-remote fails', async () => {
    const exec = mockExec(128, 'fatal: Authentication failed');

    const result = await verifyGitAccess('owner/repo', exec);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Authentication failed');
  });

  it('should include the repo name in the error message', async () => {
    const exec = mockExec(1, 'remote: Repository not found');

    const result = await verifyGitAccess('owner/repo', exec);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('owner/repo');
  });
});
