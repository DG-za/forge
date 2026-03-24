// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/runs/run.queries', () => ({
  getRuns: vi.fn(),
}));

vi.mock('@/features/runs/use-run-events.hook', () => ({
  useRunEvents: () => new Map(),
}));

import { getRuns } from '@/features/runs/run.queries';
import DashboardPage from './page';

const mockGetRuns = vi.mocked(getRuns);

function buildRun(id: string, repo: string) {
  return {
    id,
    status: 'completed',
    repo,
    epicNumber: 5,
    totalCostUsd: 2.0,
    createdAt: new Date('2026-03-24T10:00:00Z'),
  };
}

describe('DashboardPage', () => {
  it('should render run cards when runs exist', async () => {
    mockGetRuns.mockResolvedValue([buildRun('r1', 'acme/api'), buildRun('r2', 'acme/web')]);

    const page = await DashboardPage();
    render(page);

    expect(screen.getByText('acme/api')).toBeDefined();
    expect(screen.getByText('acme/web')).toBeDefined();
  });

  it('should render empty state when no runs exist', async () => {
    mockGetRuns.mockResolvedValue([]);

    const page = await DashboardPage();
    render(page);

    expect(screen.getByText('No runs yet.')).toBeDefined();
    expect(screen.getByText('Start one →')).toBeDefined();
  });

  it('should render New Run link', async () => {
    mockGetRuns.mockResolvedValue([]);

    const page = await DashboardPage();
    render(page);

    const links = screen.getAllByRole('link');
    const newRunLink = links.find((l) => l.getAttribute('href') === '/runs/new');
    expect(newRunLink).toBeDefined();
  });
});
