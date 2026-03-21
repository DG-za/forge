export class InvalidTransitionError extends Error {
  constructor(
    public readonly entity: 'run' | 'issue',
    public readonly from: string,
    public readonly to: string,
  ) {
    super(`Invalid ${entity} transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}
