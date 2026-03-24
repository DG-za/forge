import type { CommandExecutor } from '../coder/coder.types';

type RepoResult = { ok: true; repoDir: string } | { ok: false; error: string };

export async function ensureRepo(repo: string, basePath: string, exec: CommandExecutor): Promise<RepoResult> {
  const repoDir = `${basePath}/${repo}`;
  const exists = await exec(`test -d ${repoDir}`, '.');

  if (exists.exitCode === 0) return pullLatest(repo, repoDir, exec);

  return cloneRepo(repo, basePath, repoDir, exec);
}

async function pullLatest(repo: string, repoDir: string, exec: CommandExecutor): Promise<RepoResult> {
  await exec('git checkout main || git checkout master', repoDir);
  const { exitCode, output } = await exec('git pull', repoDir);

  if (exitCode !== 0) return { ok: false, error: `Failed to pull ${repo}: ${output.trim()}` };

  return { ok: true, repoDir };
}

async function cloneRepo(repo: string, basePath: string, repoDir: string, exec: CommandExecutor): Promise<RepoResult> {
  const ownerDir = `${basePath}/${repo.split('/')[0]}`;
  await exec(`mkdir -p ${ownerDir}`, '.');

  const url = `https://github.com/${repo}.git`;
  const { exitCode, output } = await exec(`git clone ${url} ${repoDir}`, '.');

  if (exitCode !== 0) return { ok: false, error: `Failed to clone ${repo}: ${output.trim()}` };

  return { ok: true, repoDir };
}
