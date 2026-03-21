import type { AgentRunner, Cost } from '../agent-runner.types';
import type { CommandExecutor, QualityGateConfig } from '../coder/coder.types';
import { runQualityGates } from '../coder/quality-gates';
import { assertCrossModel } from './cross-model';
import { buildReviewFixPrompt, buildReviewPrompt } from './reviewer-prompt';
import { REVIEWER_SYSTEM_PROMPT } from './reviewer-system-prompt';
import { ReviewerError } from './reviewer.error';
import { parseReview } from './reviewer.schema';
import type { ReviewContext, ReviewFeedback, ReviewResult } from './reviewer.types';

const DEFAULT_MAX_ITERATIONS = 4;

export type ReviewerOptions = {
  reviewerRunner: AgentRunner;
  coderRunner: AgentRunner;
  reviewerModel: string;
  coderModel: string;
  context: ReviewContext;
  gateConfig: QualityGateConfig;
  cwd: string;
  maxBudgetUsd: number;
  exec: CommandExecutor;
  maxIterations?: number;
};

export async function runReviewer(options: ReviewerOptions): Promise<ReviewResult> {
  assertCrossModel(options.coderRunner.platform, options.reviewerRunner.platform);

  const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const totalCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  let feedback: ReviewFeedback = { verdict: 'request_changes', summary: '', issues: [] };

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const reviewCost = await executeReviewer(options);
    addCost(totalCost, reviewCost.cost);
    feedback = reviewCost.feedback;

    if (feedback.verdict === 'approve') {
      return { cost: totalCost, feedback, iterations: iteration, escalated: false };
    }

    if (iteration < maxIterations) {
      const fixCost = await executeCoder(options, feedback);
      addCost(totalCost, fixCost);
      await runQualityGates(options.gateConfig, options.cwd, options.exec);
    }
  }

  return { cost: totalCost, feedback, iterations: maxIterations, escalated: true };
}

async function executeReviewer(options: ReviewerOptions): Promise<{ cost: Cost; feedback: ReviewFeedback }> {
  const prompt = buildReviewPrompt(options.context);
  const generator = options.reviewerRunner.run(prompt, {
    model: options.reviewerModel,
    systemPrompt: REVIEWER_SYSTEM_PROMPT,
    cwd: options.cwd,
    maxTurns: 10,
    maxBudgetUsd: options.maxBudgetUsd,
    allowedTools: ['Read', 'Glob', 'Grep', 'Bash'],
  });

  for await (const message of generator) {
    if (message.type === 'error') throw new ReviewerError(message.text, message.cost);
    if (message.type === 'result') return { cost: message.cost, feedback: parseReview(message.text) };
  }

  throw new Error('Reviewer agent returned no result');
}

async function executeCoder(options: ReviewerOptions, feedback: ReviewFeedback): Promise<Cost> {
  const prompt = buildReviewFixPrompt(feedback);
  const generator = options.coderRunner.run(prompt, {
    model: options.coderModel,
    systemPrompt: 'You are a software engineer fixing review issues. Fix each issue and ensure tests still pass.',
    cwd: options.cwd,
    maxTurns: 50,
    maxBudgetUsd: options.maxBudgetUsd,
    allowedTools: ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep'],
  });

  for await (const message of generator) {
    if (message.type === 'error') throw new ReviewerError(message.text, message.cost);
    if (message.type === 'result') return message.cost;
  }

  throw new Error('Coder agent returned no result during review fix');
}

function addCost(total: Cost, addition: Cost): void {
  total.inputTokens += addition.inputTokens;
  total.outputTokens += addition.outputTokens;
  total.costUsd += addition.costUsd;
}
