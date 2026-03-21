import type { Cost } from '../agent-runner.types';

export class ReviewerError extends Error {
  readonly cost: Cost;

  constructor(message: string, cost: Cost) {
    super(message);
    this.name = 'ReviewerError';
    this.cost = cost;
  }
}
