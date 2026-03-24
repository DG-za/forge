import type { CoderTask, CommandExecutor } from '../coder/coder.types';

const CONTEXT_FILES = ['CLAUDE.md', 'AGENTS.md', 'PROJECT.md'];

export async function buildWorkerContext(
  worktreePath: string,
  task: CoderTask,
  exec: CommandExecutor,
): Promise<string> {
  const sections: string[] = [];

  const repoContext = await readContextFiles(worktreePath, exec);
  if (repoContext) sections.push(repoContext);

  sections.push(buildIssueSection(task));

  return sections.join('\n\n---\n\n');
}

async function readContextFiles(worktreePath: string, exec: CommandExecutor): Promise<string | null> {
  const found: string[] = [];

  for (const file of CONTEXT_FILES) {
    const { exitCode, output } = await exec(`cat ${file}`, worktreePath);
    if (exitCode === 0 && output.trim()) {
      found.push(output.trim());
    }
  }

  return found.length > 0 ? found.join('\n\n') : null;
}

function buildIssueSection(task: CoderTask): string {
  const lines = [`# Issue #${task.issueNumber}: ${task.title}`, '', task.body];

  if (task.acceptanceCriteria.length > 0) {
    lines.push('', '## Acceptance Criteria', '');
    for (const criterion of task.acceptanceCriteria) {
      lines.push(`- ${criterion}`);
    }
  }

  return lines.join('\n');
}
