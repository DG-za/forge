import { describe, expect, it } from 'vitest';
import { buildPlanPrompt, buildReplanPrompt, PLANNER_SYSTEM_PROMPT } from '../planner-prompt';
import type { EpicContext, ReplanContext } from '../planner.types';

const epicContext: EpicContext = {
  repo: 'DG-za/forge',
  epicNumber: 15,
  epicTitle: 'Phase 2: Core Engine',
  epicBody: 'Build the dispatcher and agent pipeline.',
  issues: [
    {
      number: 22,
      title: 'AgentRunner abstraction',
      body: 'Define the AgentRunner interface.',
      labels: ['ai-task'],
      state: 'open',
    },
    {
      number: 23,
      title: 'State machine',
      body: 'Build run/issue lifecycle.',
      labels: ['ai-task'],
      state: 'closed',
    },
  ],
};

describe('PLANNER_SYSTEM_PROMPT', () => {
  it('should instruct the model to output JSON', () => {
    expect(PLANNER_SYSTEM_PROMPT).toContain('JSON');
  });
});

describe('buildPlanPrompt', () => {
  it('should include the epic title and body', () => {
    const prompt = buildPlanPrompt(epicContext);

    expect(prompt).toContain('Phase 2: Core Engine');
    expect(prompt).toContain('Build the dispatcher and agent pipeline.');
  });

  it('should include all sub-issues with details', () => {
    const prompt = buildPlanPrompt(epicContext);

    expect(prompt).toContain('#22');
    expect(prompt).toContain('AgentRunner abstraction');
    expect(prompt).toContain('#23');
    expect(prompt).toContain('State machine');
  });

  it('should include issue state', () => {
    const prompt = buildPlanPrompt(epicContext);

    expect(prompt).toContain('open');
    expect(prompt).toContain('closed');
  });

  it('should instruct the agent to produce a plan', () => {
    const prompt = buildPlanPrompt(epicContext);

    expect(prompt).toContain('Decompose this epic');
    expect(prompt).toContain('ordered plan');
  });
});

describe('buildReplanPrompt', () => {
  const replanContext: ReplanContext = {
    originalPlan: {
      summary: 'Build the core engine',
      tasks: [
        {
          issueNumber: 22,
          title: 'AgentRunner abstraction',
          acceptanceCriteria: ['Interface defined'],
          dependencies: [],
          complexity: 'medium',
        },
      ],
    },
    completedIssues: [{ issueNumber: 22, outcome: 'done', notes: 'Merged successfully' }],
    remainingIssues: [epicContext.issues[1]],
  };

  it('should include completed issue outcomes', () => {
    const prompt = buildReplanPrompt(epicContext, replanContext);

    expect(prompt).toContain('#22');
    expect(prompt).toContain('done');
    expect(prompt).toContain('Merged successfully');
  });

  it('should include remaining issues', () => {
    const prompt = buildReplanPrompt(epicContext, replanContext);

    expect(prompt).toContain('#23');
    expect(prompt).toContain('State machine');
  });

  it('should include the original plan summary', () => {
    const prompt = buildReplanPrompt(epicContext, replanContext);

    expect(prompt).toContain('Build the core engine');
  });
});
