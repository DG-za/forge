import type { Platform } from '@/dispatcher/agent-runner.types';

export type { Platform };

export type ModelOption = {
  value: string;
  label: string;
};

export const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: 'claude', label: 'Claude' },
  { value: 'openai', label: 'OpenAI' },
];

export const MODEL_OPTIONS: Record<Platform, ModelOption[]> = {
  claude: [
    { value: 'claude-opus-4-6', label: 'Opus 4.6' },
    { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
    { value: 'claude-haiku-4-5', label: 'Haiku 4.5' },
  ],
  openai: [
    { value: 'gpt-4.1', label: 'GPT-4.1' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    { value: 'o3', label: 'o3' },
    { value: 'o4-mini', label: 'o4-mini' },
  ],
};

export type RoleFormValues = {
  platform: Platform;
  model: string;
};

export const DEFAULT_ROLES: Record<'planner' | 'coder' | 'reviewer', RoleFormValues> = {
  planner: { platform: 'claude', model: 'claude-sonnet-4-6' },
  coder: { platform: 'openai', model: 'gpt-4.1' },
  reviewer: { platform: 'claude', model: 'claude-sonnet-4-6' },
};

export const DEFAULT_BUDGET_USD = 10;

export const DEFAULT_GATE_COMMANDS = {
  lintCommand: 'npm run lint',
  typecheckCommand: 'npm run typecheck',
  testCommand: 'npm test',
};

export const DEFAULT_REPO_BASE_PATH = '/repos';
