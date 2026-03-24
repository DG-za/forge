// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RunDetail } from '@/features/runs/run.types';
import { RunDetailView } from '@/features/runs/components/run-detail.component';

vi.mock('@/features/runs/use-run-events.hook', () => ({
  useRunEvents: vi.fn().mockReturnValue(new Map()),
}));

vi.mock('@/features/runs/cancel-run.action', () => ({
  cancelRunAction: vi.fn().mockResolvedValue({ success: true }),
}));

afterEach(cleanup);

function buildRun(overrides: Partial<RunDetail> = {}): RunDetail {
  return {
    id: 'run-1',
    status: 'in_progress',
    repo: 'my-org/my-repo',
    epicNumber: 42,
    budgetUsd: 10,
    totalCostUsd: 3.5,
    planSummary: 'Build the feature in 3 steps',
    createdAt: new Date('2026-03-20T10:00:00Z'),
    updatedAt: new Date('2026-03-20T12:00:00Z'),
    issues: [],
    planTasks: [],
    ...overrides,
  };
}

const defaultTimestamps = { createdAtLabel: '4d ago', updatedAtLabel: '4d ago' };

describe('RunDetailView', () => {
  it('should render repo name and epic number', () => {
    render(<RunDetailView run={buildRun()} {...defaultTimestamps} />);

    expect(screen.getByText('my-org/my-repo')).toBeDefined();
    expect(screen.getByText(/Epic #42/)).toBeDefined();
  });

  it('should render budget progress when budget is set', () => {
    render(<RunDetailView run={buildRun({ budgetUsd: 10, totalCostUsd: 3.5 })} {...defaultTimestamps} />);

    expect(screen.getByText('$3.50 / $10.00')).toBeDefined();
    expect(screen.getByText('35%')).toBeDefined();
  });

  it('should not render budget section when budget is null', () => {
    render(<RunDetailView run={buildRun({ budgetUsd: null })} {...defaultTimestamps} />);

    expect(screen.queryByText(/\$/)).toBeNull();
  });

  it('should render plan summary when present', () => {
    render(<RunDetailView run={buildRun({ planSummary: 'Build the feature in 3 steps' })} {...defaultTimestamps} />);

    expect(screen.getByText('Build the feature in 3 steps')).toBeDefined();
  });

  it('should not render plan section when summary is null', () => {
    render(<RunDetailView run={buildRun({ planSummary: null })} {...defaultTimestamps} />);

    expect(screen.queryByText('Plan')).toBeNull();
  });

  it('should render cancel button for active runs', () => {
    render(<RunDetailView run={buildRun({ status: 'in_progress' })} {...defaultTimestamps} />);

    expect(screen.getByText('Cancel Run')).toBeDefined();
  });

  it('should not render cancel button for completed runs', () => {
    render(<RunDetailView run={buildRun({ status: 'completed' })} {...defaultTimestamps} />);

    expect(screen.queryByText('Cancel Run')).toBeNull();
  });

  it('should not render cancel button for failed runs', () => {
    render(<RunDetailView run={buildRun({ status: 'failed' })} {...defaultTimestamps} />);

    expect(screen.queryByText('Cancel Run')).toBeNull();
  });

  it('should render issue count when issues exist', () => {
    const issues = [
      { id: 'i1', issueNumber: 1, title: 'First', status: 'done', costUsd: 1, agentLogs: [] },
      { id: 'i2', issueNumber: 2, title: 'Second', status: 'coding', costUsd: 0.5, agentLogs: [] },
    ];
    render(<RunDetailView run={buildRun({ issues })} {...defaultTimestamps} />);

    expect(screen.getByText('Issues (1/2 done)')).toBeDefined();
  });

  it('should render pre-formatted timestamps', () => {
    render(<RunDetailView run={buildRun()} createdAtLabel="4d ago" updatedAtLabel="2h ago" />);

    expect(screen.getByText('Created 4d ago')).toBeDefined();
    expect(screen.getByText('Updated 2h ago')).toBeDefined();
  });

  it('should update status from SSE events', async () => {
    const { useRunEvents } = await import('@/features/runs/use-run-events.hook');
    vi.mocked(useRunEvents).mockReturnValue(new Map([['run-1', 'completed']]));

    render(<RunDetailView run={buildRun({ status: 'in_progress' })} {...defaultTimestamps} />);

    // Cancel button should be hidden since SSE says completed
    expect(screen.queryByText('Cancel Run')).toBeNull();
  });

  it('should call cancelRunAction when cancel is clicked', async () => {
    const { useRunEvents } = await import('@/features/runs/use-run-events.hook');
    vi.mocked(useRunEvents).mockReturnValue(new Map());

    const { cancelRunAction } = await import('@/features/runs/cancel-run.action');

    render(<RunDetailView run={buildRun({ status: 'in_progress' })} {...defaultTimestamps} />);

    await userEvent.click(screen.getByText('Cancel Run'));

    expect(cancelRunAction).toHaveBeenCalledWith('run-1');
  });

  it('should show error when cancel fails', async () => {
    const { useRunEvents } = await import('@/features/runs/use-run-events.hook');
    vi.mocked(useRunEvents).mockReturnValue(new Map());

    const { cancelRunAction } = await import('@/features/runs/cancel-run.action');
    vi.mocked(cancelRunAction).mockResolvedValue({ error: 'Run not found or not running' });

    render(<RunDetailView run={buildRun({ status: 'in_progress' })} {...defaultTimestamps} />);

    await userEvent.click(screen.getByText('Cancel Run'));

    expect(await screen.findByText('Run not found or not running')).toBeDefined();
  });
});
