import type { AgentRunner, Cost } from '../agent-runner.types';
import { buildCoderPrompt, buildFixPrompt } from './coder-prompt';
import { CODER_SYSTEM_PROMPT } from './coder-system-prompt';
import { CoderError } from './coder.error';
import type { CoderResult, CoderTask, CommandExecutor, QualityGateConfig, QualityGateResult } from './coder.types';
import { runQualityGates } from './quality-gates';

const DEFAULT_MAX_ATTEMPTS = 7;

type CoderOptions = {
  runner: AgentRunner;
  model: string;
  task: CoderTask;
  gateConfig: QualityGateConfig;
  cwd: string;
  maxBudgetUsd: number;
  exec: CommandExecutor;
  maxAttempts?: number;
};

export async function runCoder(options: CoderOptions): Promise<CoderResult> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const totalCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  let prompt = buildCoderPrompt(options.task);
  let gateResult: QualityGateResult = { passed: false, gates: [] };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const cost = await executeAgent(options, prompt);
    addCost(totalCost, cost);

    gateResult = await runQualityGates(options.gateConfig, options.cwd, options.exec);
    if (gateResult.passed) return { cost: totalCost, gatesPassed: true, attempts: attempt };

    prompt = buildFixPrompt(gateResult);
  }

  return { cost: totalCost, gatesPassed: false, attempts: maxAttempts };
}

async function executeAgent(options: CoderOptions, prompt: string): Promise<Cost> {
  const generator = options.runner.run(prompt, {
    model: options.model,
    systemPrompt: CODER_SYSTEM_PROMPT,
    cwd: options.cwd,
    maxTurns: 50,
    maxBudgetUsd: options.maxBudgetUsd,
    allowedTools: ['Read', 'Edit', 'Write', 'Bash', 'Glob', 'Grep'],
  });

  for await (const message of generator) {
    if (message.type === 'error') throw new CoderError(message.text, message.cost);
    if (message.type === 'result') return message.cost;
  }

  throw new Error('Coder agent returned no result');
}

function addCost(total: Cost, addition: Cost): void {
  total.inputTokens += addition.inputTokens;
  total.outputTokens += addition.outputTokens;
  total.costUsd += addition.costUsd;
}
