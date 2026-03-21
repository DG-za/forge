import { describe, expect, it } from 'vitest';
import { parsePlan, PlanParseError } from '../planner.schema';

const validPlan = {
  summary: 'Implement auth module with login and signup',
  tasks: [
    {
      issueNumber: 42,
      title: 'Add login endpoint',
      acceptanceCriteria: ['POST /login returns JWT', 'Invalid credentials return 401'],
      dependencies: [],
      complexity: 'medium',
    },
    {
      issueNumber: 43,
      title: 'Add signup endpoint',
      acceptanceCriteria: ['POST /signup creates user'],
      dependencies: [42],
      complexity: 'small',
    },
  ],
};

describe('parsePlan', () => {
  it('should parse valid plan JSON', () => {
    const plan = parsePlan(JSON.stringify(validPlan));

    expect(plan.summary).toBe('Implement auth module with login and signup');
    expect(plan.tasks).toHaveLength(2);
    expect(plan.tasks[0].title).toBe('Add login endpoint');
    expect(plan.tasks[1].dependencies).toEqual([42]);
  });

  it('should handle JSON wrapped in markdown code fences', () => {
    const wrapped = '```json\n' + JSON.stringify(validPlan) + '\n```';
    const plan = parsePlan(wrapped);

    expect(plan.tasks).toHaveLength(2);
  });

  it('should accept tasks with null issueNumber', () => {
    const planWithNew = {
      ...validPlan,
      tasks: [{ ...validPlan.tasks[0], issueNumber: null }],
    };
    const plan = parsePlan(JSON.stringify(planWithNew));

    expect(plan.tasks[0].issueNumber).toBeNull();
  });

  it('should accept empty dependencies array', () => {
    const plan = parsePlan(JSON.stringify(validPlan));
    expect(plan.tasks[0].dependencies).toEqual([]);
  });

  it('should throw PlanParseError for invalid JSON', () => {
    expect(() => parsePlan('not json {')).toThrow(PlanParseError);
  });

  it('should throw PlanParseError for missing summary', () => {
    const noSummary = { tasks: validPlan.tasks };
    expect(() => parsePlan(JSON.stringify(noSummary))).toThrow(PlanParseError);
  });

  it('should throw PlanParseError for missing tasks', () => {
    const noTasks = { summary: 'oops' };
    expect(() => parsePlan(JSON.stringify(noTasks))).toThrow(PlanParseError);
  });

  it('should throw PlanParseError for invalid complexity value', () => {
    const badComplexity = {
      ...validPlan,
      tasks: [{ ...validPlan.tasks[0], complexity: 'huge' }],
    };
    expect(() => parsePlan(JSON.stringify(badComplexity))).toThrow(PlanParseError);
  });
});
