import { TERMINAL_RUN_STATUSES } from '@/app/runs/runs.types';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { IssueFetcher } from '../planner/planner.types';
import type { StateChangeListener } from '../state-machine.types';
import type { PipelineConfig } from './pipeline.types';
import { computeResumeState, type ResumeState } from './resume-run';
import { runPipeline } from './run-pipeline';

export type RunInput = {
  config: PipelineConfig;
  issueFetcher: IssueFetcher;
  getDiff: () => Promise<string>;
};

export type RunStatus = {
  state: 'pending' | 'planning' | 'in_progress' | 'completed' | 'failed';
  error?: string;
};

export type PipelineApi = {
  startRun(input: RunInput): Promise<string>;
  getRunStatus(runId: string): Promise<RunStatus | null>;
  cancelRun(runId: string): Promise<boolean>;
  resumeRun(runId: string, input: RunInput): Promise<boolean>;
};

export function createPipelineApi(prisma: PrismaClient, onStateChange?: StateChangeListener): PipelineApi {
  const controllers = new Map<string, AbortController>();

  return { startRun, getRunStatus, cancelRun, resumeRun };

  async function startRun(input: RunInput): Promise<string> {
    const run = await prisma.run.create({
      data: {
        repo: input.config.repo,
        epicNumber: input.config.epicNumber,
        budgetUsd: input.config.maxBudgetUsd,
        config: {},
      },
    });

    launchPipeline(run.id, input);
    return run.id;
  }

  async function getRunStatus(runId: string): Promise<RunStatus | null> {
    const run = await prisma.run.findUnique({ where: { id: runId } });
    if (!run) return null;

    const isTerminal = TERMINAL_RUN_STATUSES.has(run.status);
    if (controllers.has(runId) && !isTerminal) return { state: 'in_progress' };
    return { state: run.status as RunStatus['state'] };
  }

  async function cancelRun(runId: string): Promise<boolean> {
    const controller = controllers.get(runId);
    if (!controller) return false;
    controller.abort();
    return true;
  }

  async function resumeRun(runId: string, input: RunInput): Promise<boolean> {
    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: { issues: true, planTasks: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!run || run.status === 'completed') return false;

    const resumeState = computeResumeState({
      planTasks: run.planTasks,
      planSummary: run.planSummary,
      issues: run.issues,
    });

    if (resumeState.remainingTasks.length === 0) return false;

    launchPipeline(run.id, input, resumeState);
    return true;
  }

  function launchPipeline(runId: string, input: RunInput, resumeState?: ResumeState): void {
    const controller = new AbortController();
    controllers.set(runId, controller);
    const config = onStateChange ? { ...input.config, onStateChange } : input.config;

    runPipeline({
      runId,
      config,
      issueFetcher: input.issueFetcher,
      getDiff: input.getDiff,
      signal: controller.signal,
      prisma,
      resumeState,
    })
      .catch((err) => {
        console.error(`Pipeline ${runId} failed:`, err);
        prisma.run.update({ where: { id: runId }, data: { status: 'failed' } }).catch(() => {});
      })
      .finally(() => controllers.delete(runId));
  }
}
