// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { RunDetail } from '../runs.types';
import { IssueCard } from './issue-card.component';

afterEach(cleanup);

type Issue = RunDetail['issues'][number];

function buildIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'issue-1',
    issueNumber: 7,
    title: 'Add login page',
    status: 'coding',
    costUsd: 1.25,
    agentLogs: [],
    ...overrides,
  };
}

describe('IssueCard', () => {
  it('should render issue number, title, cost, and status', () => {
    render(<IssueCard issue={buildIssue()} />);

    expect(screen.getByText('#7')).toBeDefined();
    expect(screen.getByText('Add login page')).toBeDefined();
    expect(screen.getByText('$1.25')).toBeDefined();
  });

  it('should show agent logs table when expanded', async () => {
    const agentLogs = [
      {
        id: 'log-1',
        role: 'coder',
        platform: 'claude',
        model: 'opus-4',
        costUsd: 0.8,
        durationMs: 45000,
        createdAt: new Date(),
      },
      {
        id: 'log-2',
        role: 'reviewer',
        platform: 'openai',
        model: 'o3',
        costUsd: 0.45,
        durationMs: 120000,
        createdAt: new Date(),
      },
    ];
    render(<IssueCard issue={buildIssue({ agentLogs })} />);

    await userEvent.click(screen.getByText('Add login page'));

    expect(screen.getByText('coder')).toBeDefined();
    expect(screen.getByText('reviewer')).toBeDefined();
    expect(screen.getByText('claude')).toBeDefined();
    expect(screen.getByText('openai')).toBeDefined();
    expect(screen.getByText('opus-4')).toBeDefined();
    expect(screen.getByText('o3')).toBeDefined();
    expect(screen.getByText('$0.80')).toBeDefined();
    expect(screen.getByText('$0.45')).toBeDefined();
    expect(screen.getByText('45s')).toBeDefined();
    expect(screen.getByText('2m 0s')).toBeDefined();
  });

  it('should not show logs table when issue has no agent logs', async () => {
    render(<IssueCard issue={buildIssue({ agentLogs: [] })} />);

    await userEvent.click(screen.getByText('Add login page'));

    expect(screen.queryByText('Role')).toBeNull();
  });
});
