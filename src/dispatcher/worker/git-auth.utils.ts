import type { CommandExecutor } from '../coder/coder.types';

type AuthResult = { ok: true } | { ok: false; error: string };

export async function verifyGitAccess(repo: string, exec: CommandExecutor): Promise<AuthResult> {
  const url = `https://github.com/${repo}.git`;
  const { exitCode, output } = await exec(`git ls-remote --exit-code ${url} HEAD`, '.');

  if (exitCode === 0) return { ok: true };

  return { ok: false, error: `Git access failed for ${repo}: ${output.trim()}` };
}
