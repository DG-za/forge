import type { Cost } from '../agent-runner.types';

export class PlannerError extends Error {
  readonly cost: Cost;

  constructor(message: string, cost: Cost) {
    super(message);
    this.name = 'PlannerError';
    this.cost = cost;
  }
}
