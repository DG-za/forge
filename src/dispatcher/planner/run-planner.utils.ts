import type { AgentRunner, Cost } from '../agent-runner.types';
import { buildPlanPrompt, buildReplanPrompt } from './planner-prompt.utils';
import { PLANNER_SYSTEM_PROMPT } from './planner-system-prompt.utils';
import { PlannerError } from './planner.error';
import { parsePlan } from './planner.schema';
import type { EpicContext, Plan, ReplanContext } from './planner.types';

type PlannerOptions = {
  runner: AgentRunner;
  model: string;
  epicContext: EpicContext;
  maxBudgetUsd: number;
};

type ReplanOptions = PlannerOptions & {
  replanContext: ReplanContext;
};

type PlannerResult = {
  plan: Plan;
  cost: Cost;
};

export async function runPlanner(options: PlannerOptions): Promise<PlannerResult> {
  const prompt = buildPlanPrompt(options.epicContext);
  return executePlanner(options, prompt);
}

export async function replan(options: ReplanOptions): Promise<PlannerResult> {
  const prompt = buildReplanPrompt(options.epicContext, options.replanContext);
  return executePlanner(options, prompt);
}

async function executePlanner(options: PlannerOptions, prompt: string): Promise<PlannerResult> {
  const generator = options.runner.run(prompt, {
    model: options.model,
    systemPrompt: PLANNER_SYSTEM_PROMPT,
    cwd: '.',
    maxTurns: 1,
    maxBudgetUsd: options.maxBudgetUsd,
    allowedTools: [],
  });

  for await (const message of generator) {
    if (message.type === 'error') {
      throw new PlannerError(message.text, message.cost);
    }
    if (message.type === 'result') {
      return { plan: parsePlan(message.text), cost: message.cost };
    }
  }

  throw new Error('Planner returned no result');
}
