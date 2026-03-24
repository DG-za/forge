import type { Platform } from '@/dispatcher/agent-runner.types';
import { ClaudeRunner } from '@/dispatcher/claude-runner';
import type { CommandExecutor } from '@/dispatcher/coder/coder.types';
import { OpenAIRunner } from '@/dispatcher/openai-runner';
import type { RunInput } from '@/dispatcher/pipeline/pipeline-api';
import type { RoleConfig } from '@/dispatcher/pipeline/pipeline.types';
import type { IssueFetcher } from '@/dispatcher/planner/planner.types';
import type { RunInputBuilder } from '../actions';
import { GithubIssueFetcher } from './github-issue-fetcher';
import { shellExec } from './shell-exec';

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
        lintCommand: 'npm run lint',
        typecheckCommand: 'npm run typecheck',
        testCommand: 'npm test',
      },
      cwd,
      exec: shellExec as CommandExecutor,
    },
    issueFetcher: new GithubIssueFetcher() as IssueFetcher,
    getDiff: () => getDiff(cwd),
  };
};

async function getDiff(cwd: string): Promise<string> {
  const { output } = await shellExec('git diff HEAD', cwd);
  return output;
}
