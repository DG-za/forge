import { describe, expect, it } from 'vitest';
import type { PlannedTask } from '@/dispatcher/planner/planner.types';
import { computeResumeState, type PersistedIssue, type PersistedRun } from '@/dispatcher/pipeline/resume-run.utils';

const task1: PlannedTask = {
  issueNumber: 1,
  title: 'Task one',
  acceptanceCriteria: ['works'],
  dependencies: [],
  complexity: 'small',
};

const task2: PlannedTask = {
  issueNumber: 2,
  title: 'Task two',
  acceptanceCriteria: ['also works'],
  dependencies: [1],
  complexity: 'small',
};

const task3: PlannedTask = {
  issueNumber: 3,
  title: 'Task three',
  acceptanceCriteria: ['still works'],
  dependencies: [],
  complexity: 'medium',
};

function buildRun(overrides: Partial<PersistedRun> = {}): PersistedRun {
  return {
    planTasks: [task1, task2, task3].map((t, i) => ({
      orderIndex: i,
      issueNumber: t.issueNumber,
      title: t.title,
      acceptanceCriteria: t.acceptanceCriteria,
      dependencies: t.dependencies,
      complexity: t.complexity,
    })),
    planSummary: 'Three tasks.',
    issues: [],
    ...overrides,
  };
}

function buildIssue(overrides: Partial<PersistedIssue>): PersistedIssue {
  return {
    issueNumber: 1,
    status: 'done',
    costUsd: 0,
    inputTokens: 0,
    outputTokens: 0,
    ...overrides,
  };
}

describe('computeResumeState', () => {
  it('should identify completed issues from persisted state', () => {
    const run = buildRun({
      issues: [
        buildIssue({ issueNumber: 1, status: 'done', costUsd: 0.05 }),
        buildIssue({ issueNumber: 2, status: 'failed', costUsd: 0.02 }),
      ],
    });

    const state = computeResumeState(run);

    expect(state.completedOutcomes).toHaveLength(2);
    expect(state.completedOutcomes[0]).toEqual({
      issueNumber: 1,
      status: 'done',
      cost: { inputTokens: 0, outputTokens: 0, costUsd: 0.05 },
    });
    expect(state.completedOutcomes[1].status).toBe('failed');
  });

  it('should compute remaining tasks from plan minus completed issues', () => {
    const run = buildRun({
      issues: [buildIssue({ issueNumber: 1, status: 'done' })],
    });

    const state = computeResumeState(run);

    expect(state.remainingTasks).toHaveLength(2);
    expect(state.remainingTasks[0].issueNumber).toBe(2);
    expect(state.remainingTasks[1].issueNumber).toBe(3);
  });

  it('should sum costs from completed issues', () => {
    const run = buildRun({
      issues: [
        buildIssue({ issueNumber: 1, status: 'done', costUsd: 0.05, inputTokens: 100, outputTokens: 50 }),
        buildIssue({ issueNumber: 2, status: 'escalated', costUsd: 0.1, inputTokens: 200, outputTokens: 100 }),
      ],
    });

    const state = computeResumeState(run);

    expect(state.startingCost.costUsd).toBeCloseTo(0.15);
    expect(state.startingCost.inputTokens).toBe(300);
    expect(state.startingCost.outputTokens).toBe(150);
  });

  it('should handle run that died during planning with no completed issues', () => {
    const run = buildRun({ issues: [], planTasks: [] });

    const state = computeResumeState(run);

    expect(state.completedOutcomes).toHaveLength(0);
    expect(state.remainingTasks).toHaveLength(0);
    expect(state.startingCost.costUsd).toBe(0);
    expect(state.initialPlan.tasks).toHaveLength(0);
  });

  it('should preserve original task order for remaining tasks', () => {
    const run = buildRun({
      issues: [buildIssue({ issueNumber: 2, status: 'done' })],
    });

    const state = computeResumeState(run);

    // Task 1 and 3 remain, in original order (by orderIndex)
    expect(state.remainingTasks).toHaveLength(2);
    expect(state.remainingTasks[0].issueNumber).toBe(1);
    expect(state.remainingTasks[1].issueNumber).toBe(3);
  });

  it('should reconstruct the initial plan from persisted plan tasks', () => {
    const run = buildRun();

    const state = computeResumeState(run);

    expect(state.initialPlan.summary).toBe('Three tasks.');
    expect(state.initialPlan.tasks).toHaveLength(3);
    expect(state.initialPlan.tasks[0].issueNumber).toBe(1);
    expect(state.initialPlan.tasks[2].issueNumber).toBe(3);
  });
});
