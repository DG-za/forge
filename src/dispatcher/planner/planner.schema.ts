import { z } from 'zod/v4';
import type { Plan } from './planner.types';

const taskSchema = z.object({
  issueNumber: z.number().nullable(),
  title: z.string(),
  acceptanceCriteria: z.array(z.string()),
  dependencies: z.array(z.number()),
  complexity: z.enum(['small', 'medium', 'large']),
});

const planSchema = z.object({
  summary: z.string(),
  tasks: z.array(taskSchema),
});

export class PlanParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanParseError';
  }
}

export function parsePlan(agentOutput: string): Plan {
  const json = extractJson(agentOutput);

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new PlanParseError(`Invalid JSON in agent output: ${json.slice(0, 100)}`);
  }

  const result = planSchema.safeParse(parsed);
  if (!result.success) {
    throw new PlanParseError(`Plan validation failed: ${z.prettifyError(result.error)}`);
  }

  return result.data;
}

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  return fenceMatch ? fenceMatch[1] : text.trim();
}
