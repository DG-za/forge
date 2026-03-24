// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { RunDetail } from '../runs.types';
import { PlanTaskList } from './plan-task-list.component';

afterEach(cleanup);

type PlanTask = RunDetail['planTasks'][number];
type Issue = RunDetail['issues'][number];

function buildTask(overrides: Partial<PlanTask> = {}): PlanTask {
  return {
    id: 'task-1',
    orderIndex: 0,
    issueNumber: 10,
    title: 'Set up auth module',
    acceptanceCriteria: ['Users can log in', 'Session persists across refresh'],
    complexity: 'medium',
    ...overrides,
  };
}

function buildIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'issue-1',
    issueNumber: 10,
    title: 'Set up auth module',
    status: 'done',
    costUsd: 2,
    agentLogs: [],
    ...overrides,
  };
}

describe('PlanTaskList', () => {
  it('should render task title, order index, and complexity', () => {
    render(<PlanTaskList tasks={[buildTask()]} issues={[]} />);

    expect(screen.getByText('1.')).toBeDefined();
    expect(screen.getByText('Set up auth module')).toBeDefined();
    expect(screen.getByText('medium')).toBeDefined();
  });

  it('should render status badge when matching issue exists', () => {
    render(
      <PlanTaskList
        tasks={[buildTask({ issueNumber: 10 })]}
        issues={[buildIssue({ issueNumber: 10, status: 'done' })]}
      />,
    );

    expect(screen.getByText('Done')).toBeDefined();
  });

  it('should not render status badge when no matching issue', () => {
    render(<PlanTaskList tasks={[buildTask({ issueNumber: null })]} issues={[]} />);

    expect(screen.queryByText('Done')).toBeNull();
  });

  it('should show acceptance criteria when expanded', async () => {
    render(<PlanTaskList tasks={[buildTask()]} issues={[]} />);

    await userEvent.click(screen.getByText('Set up auth module'));

    expect(screen.getByText('Users can log in')).toBeDefined();
    expect(screen.getByText('Session persists across refresh')).toBeDefined();
  });

  it('should render multiple tasks', () => {
    const tasks = [
      buildTask({ id: 't1', orderIndex: 0, title: 'First task' }),
      buildTask({ id: 't2', orderIndex: 1, title: 'Second task' }),
    ];
    render(<PlanTaskList tasks={tasks} issues={[]} />);

    expect(screen.getByText('First task')).toBeDefined();
    expect(screen.getByText('Second task')).toBeDefined();
    expect(screen.getByText('1.')).toBeDefined();
    expect(screen.getByText('2.')).toBeDefined();
  });
});
