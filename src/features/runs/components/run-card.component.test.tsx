// @vitest-environment jsdom
import type { RunSummary } from '@/features/runs/run.types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RunCard } from './run-card.component';

function buildRun(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    id: 'run-abc',
    status: 'completed',
    repo: 'acme/widget',
    epicNumber: 7,
    totalCostUsd: 3.45,
    createdAt: new Date('2026-03-24T10:00:00Z'),
    ...overrides,
  };
}

describe('RunCard', () => {
  it('should render repo name and epic number', () => {
    render(<RunCard run={buildRun()} />);

    expect(screen.getByText('acme/widget')).toBeDefined();
    expect(screen.getByText('#7')).toBeDefined();
  });

  it('should render formatted cost', () => {
    render(<RunCard run={buildRun({ totalCostUsd: 12.5 })} />);

    expect(screen.getByText('$12.50')).toBeDefined();
  });

  it('should render status badge', () => {
    render(<RunCard run={buildRun({ status: 'in_progress' })} />);

    expect(screen.getByText('Running')).toBeDefined();
  });

  it('should link to run detail page', () => {
    render(<RunCard run={buildRun({ id: 'run-xyz' })} />);

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/runs/run-xyz');
  });
});
