// @vitest-environment jsdom
import type { StateChangeEvent } from '@/dispatcher/state-machine.types';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RunSummary } from './runs/runs.types';

let mockEvents: StateChangeEvent[] = [];
vi.mock('@/app/use-run-events.hook', () => ({
  useRunEvents: () => mockEvents,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { Dashboard } from './dashboard.component';

function buildRun(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    id: 'r1',
    status: 'completed',
    repo: 'owner/repo',
    epicNumber: 5,
    totalCostUsd: 2.0,
    createdAt: new Date('2026-03-24T10:00:00Z'),
    ...overrides,
  };
}

describe('Dashboard', () => {
  beforeEach(() => {
    mockEvents = [];
  });

  it('should render initial runs', () => {
    render(<Dashboard runs={[buildRun({ id: 'r1', repo: 'acme/api' }), buildRun({ id: 'r2', repo: 'acme/web' })]} />);

    expect(screen.getByText('acme/api')).toBeDefined();
    expect(screen.getByText('acme/web')).toBeDefined();
  });

  it('should update run status when SSE event arrives', () => {
    const runs = [buildRun({ id: 'run-1', status: 'pending' })];

    mockEvents = [{ kind: 'run', transition: { runId: 'run-1', from: 'pending', to: 'planning' } }];

    render(<Dashboard runs={runs} />);

    expect(screen.getByText('Planning')).toBeDefined();
  });

  it('should not update runs that do not match the event runId', () => {
    const runs = [buildRun({ id: 'run-1', status: 'pending' }), buildRun({ id: 'run-2', status: 'completed' })];

    mockEvents = [{ kind: 'run', transition: { runId: 'run-1', from: 'pending', to: 'in_progress' } }];

    render(<Dashboard runs={runs} />);

    expect(screen.getByText('Running')).toBeDefined();
    expect(screen.getByText('Completed')).toBeDefined();
  });

  it('should handle multiple sequential status updates', () => {
    const runs = [buildRun({ id: 'run-1', status: 'pending' })];

    mockEvents = [
      { kind: 'run', transition: { runId: 'run-1', from: 'pending', to: 'planning' } },
      { kind: 'run', transition: { runId: 'run-1', from: 'planning', to: 'in_progress' } },
    ];

    render(<Dashboard runs={runs} />);

    // Last event wins
    expect(screen.getByText('Running')).toBeDefined();
  });

  it('should ignore non-run events', () => {
    const runs = [buildRun({ id: 'run-1', status: 'pending' })];

    mockEvents = [
      {
        kind: 'budget_warning',
        warning: { runId: 'run-1', currentCostUsd: 8, budgetUsd: 10, percentUsed: 0.8 },
      },
    ];

    render(<Dashboard runs={runs} />);

    expect(screen.getByText('Pending')).toBeDefined();
  });
});
