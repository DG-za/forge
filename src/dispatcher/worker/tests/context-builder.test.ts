import { describe, expect, it, vi } from 'vitest';
import type { CommandExecutor } from '../../coder/coder.types';
import { buildWorkerContext } from '../context-builder';

type ExecCall = { command: string; cwd: string };

function createMockExec(fileContents: Record<string, string> = {}): {
  exec: CommandExecutor;
  calls: ExecCall[];
} {
  const calls: ExecCall[] = [];
  const exec: CommandExecutor = vi.fn(async (command, cwd) => {
    calls.push({ command, cwd });
    for (const [filename, content] of Object.entries(fileContents)) {
      if (command.includes(filename)) return { exitCode: 0, output: content };
    }
    return { exitCode: 1, output: '' };
  });
  return { exec, calls };
}

const task = {
  issueNumber: 42,
  title: 'Add user authentication',
  body: 'Implement OAuth2 login flow',
  acceptanceCriteria: ['Users can log in with GitHub', 'Session persists across refreshes'],
};

describe('buildWorkerContext', () => {
  it('should include issue title and body', async () => {
    const { exec } = createMockExec();

    const context = await buildWorkerContext('/worktree', task, exec);

    expect(context).toContain('Add user authentication');
    expect(context).toContain('Implement OAuth2 login flow');
  });

  it('should include acceptance criteria', async () => {
    const { exec } = createMockExec();

    const context = await buildWorkerContext('/worktree', task, exec);

    expect(context).toContain('Users can log in with GitHub');
    expect(context).toContain('Session persists across refreshes');
  });

  it('should include CLAUDE.md content when present', async () => {
    const { exec } = createMockExec({
      'CLAUDE.md': '# Project Rules\nUse TypeScript strict mode',
    });

    const context = await buildWorkerContext('/worktree', task, exec);

    expect(context).toContain('Use TypeScript strict mode');
  });

  it('should include AGENTS.md content when present', async () => {
    const { exec } = createMockExec({
      'AGENTS.md': '# Agent Rules\nFollow TDD',
    });

    const context = await buildWorkerContext('/worktree', task, exec);

    expect(context).toContain('Follow TDD');
  });

  it('should include PROJECT.md content when present', async () => {
    const { exec } = createMockExec({
      'PROJECT.md': '# Project Conventions\nUse Prisma ORM',
    });

    const context = await buildWorkerContext('/worktree', task, exec);

    expect(context).toContain('Use Prisma ORM');
  });

  it('should work gracefully when no context files exist', async () => {
    const { exec } = createMockExec();

    const context = await buildWorkerContext('/worktree', task, exec);

    expect(context).toContain('Add user authentication');
    expect(context).not.toContain('CLAUDE.md');
  });

  it('should read files from the worktree path', async () => {
    const { exec, calls } = createMockExec();

    await buildWorkerContext('/worktree', task, exec);

    const catCalls = calls.filter((c) => c.command.includes('cat'));
    for (const call of catCalls) {
      expect(call.cwd).toBe('/worktree');
    }
  });
});
