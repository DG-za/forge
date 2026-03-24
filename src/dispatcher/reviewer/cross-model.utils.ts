import type { Platform } from '../agent-runner.types';

export class CrossModelError extends Error {
  constructor(platform: Platform) {
    super(`Cross-model violation: coder and reviewer both use ${platform}. They must use different vendors.`);
    this.name = 'CrossModelError';
  }
}

export function assertCrossModel(coderPlatform: Platform, reviewerPlatform: Platform): void {
  if (coderPlatform === reviewerPlatform) throw new CrossModelError(coderPlatform);
}
