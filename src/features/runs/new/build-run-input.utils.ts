import type { Platform } from '@/dispatcher/agent-runner.types';
import { ClaudeRunner } from '@/dispatcher/claude-runner';
import { OpenAIRunner } from '@/dispatcher/openai-runner';
import type { RunInput } from '@/dispatcher/pipeline/pipeline-api';
import type { RoleConfig } from '@/dispatcher/pipeline/pipeline.types';
import type { RunInputBuilder } from '../run.actions';
import { GithubIssueFetcher } from './github-issue-fetcher';
import { shellExec } from './shell-exec.utils';

function createRunner(platform: Platform) {
  return platform === 'claude' ? new ClaudeRunner() : new OpenAIRunner();
}

function createRoleConfig(platform: Platform, model: string): RoleConfig {
  return { runner: createRunner(platform), model };
}

export const buildRunInput: RunInputBuilder = (input): RunInput => {
  const cwd = process.cwd();

  return {
    config: {
      repo: input.repo,
      epicNumber: input.epicNumber,
      maxBudgetUsd: input.budgetUsd,
      planner: createRoleConfig(input.plannerPlatform, input.plannerModel),
      coder: createRoleConfig(input.coderPlatform, input.coderModel),
      reviewer: createRoleConfig(input.reviewerPlatform, input.reviewerModel),
      gateConfig: {
        lintCommand: input.lintCommand,
        typecheckCommand: input.typecheckCommand,
        testCommand: input.testCommand,
      },
      cwd,
      repoBasePath: input.repoBasePath || undefined,
      exec: shellExec,
    },
    issueFetcher: new GithubIssueFetcher(),
    getDiff: () => getDiff(cwd),
  };
};

async function getDiff(cwd: string): Promise<string> {
  const { output } = await shellExec('git diff HEAD', cwd);
  return output;
}
