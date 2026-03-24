// @vitest-environment jsdom
import type { RunState } from '@/dispatcher/state-machine.types';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RunSummary } from '@/features/runs/run.types';

let mockStatusMap = new Map<string, RunState>();
vi.mock('@/features/runs/use-run-events.hook', () => ({
  useRunEvents: () => mockStatusMap,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { Dashboard } from '@/features/runs/components/dashboard.component';

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
    mockStatusMap = new Map();
  });

  it('should render initial runs', () => {
    render(<Dashboard runs={[buildRun({ id: 'r1', repo: 'acme/api' }), buildRun({ id: 'r2', repo: 'acme/web' })]} />);

    expect(screen.getByText('acme/api')).toBeDefined();
    expect(screen.getByText('acme/web')).toBeDefined();
  });

  it('should update run status from SSE status map', () => {
    const runs = [buildRun({ id: 'run-1', status: 'pending' })];
    mockStatusMap = new Map([['run-1', 'planning']]);

    render(<Dashboard runs={runs} />);

    expect(screen.getByText('Planning')).toBeDefined();
  });

  it('should not update runs that are not in the status map', () => {
    const runs = [buildRun({ id: 'run-1', status: 'pending' }), buildRun({ id: 'run-2', status: 'completed' })];
    mockStatusMap = new Map([['run-1', 'in_progress']]);

    render(<Dashboard runs={runs} />);

    expect(screen.getByText('Running')).toBeDefined();
    expect(screen.getByText('Completed')).toBeDefined();
  });

  it('should reflect the latest status when map has been updated multiple times', () => {
    const runs = [buildRun({ id: 'run-1', status: 'pending' })];
    mockStatusMap = new Map([['run-1', 'in_progress']]);

    render(<Dashboard runs={runs} />);

    expect(screen.getByText('Running')).toBeDefined();
  });

  it('should render initial status when no SSE updates exist', () => {
    const runs = [buildRun({ id: 'run-1', status: 'pending' })];

    render(<Dashboard runs={runs} />);

    expect(screen.getByText('Pending')).toBeDefined();
  });
});
