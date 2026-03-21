import type { Cost } from '../agent-runner.types';

export class CoderError extends Error {
  readonly cost: Cost;

  constructor(message: string, cost: Cost) {
    super(message);
    this.name = 'CoderError';
    this.cost = cost;
  }
}
