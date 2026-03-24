'use client';

import { useActionState, useState } from 'react';
import type { ActionResult } from '../runs.types';
import { DEFAULT_BUDGET_USD, DEFAULT_ROLES, MODEL_OPTIONS, PLATFORM_OPTIONS, type Platform } from './form.types';
import { RoleFields } from './role-fields.component';

type Props = {
  action: (formData: FormData) => Promise<ActionResult<{ runId: string }>>;
};

export function RunForm({ action }: Props) {
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [state, formAction, isPending] = useActionState(
    async (_prev: ActionResult<{ runId: string }> | null, formData: FormData) => action(formData),
    null,
  );

  function handlePlatformChange(role: keyof typeof roles, platform: Platform) {
    setRoles((prev) => ({
      ...prev,
      [role]: { platform, model: MODEL_OPTIONS[platform][0].value },
    }));
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <fieldset className="space-y-4">
        <div>
          <label htmlFor="repo" className="text-text mb-1 block text-sm font-medium">
            Repository
          </label>
          <input
            id="repo"
            name="repo"
            type="text"
            required
            placeholder="owner/repo"
            className="bg-surface border-border text-text placeholder:text-text-muted w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="epicNumber" className="text-text mb-1 block text-sm font-medium">
            Epic number
          </label>
          <input
            id="epicNumber"
            name="epicNumber"
            type="number"
            required
            min={1}
            className="bg-surface border-border text-text w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="budgetUsd" className="text-text mb-1 block text-sm font-medium">
            Budget (USD)
          </label>
          <input
            id="budgetUsd"
            name="budgetUsd"
            type="number"
            required
            min={0.01}
            max={500}
            step={0.01}
            defaultValue={DEFAULT_BUDGET_USD}
            className="bg-surface border-border text-text w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-text text-sm font-medium">Model configuration</legend>
        {(['planner', 'coder', 'reviewer'] as const).map((role) => (
          <RoleFields
            key={role}
            role={role}
            platform={roles[role].platform}
            model={roles[role].model}
            platformOptions={PLATFORM_OPTIONS}
            modelOptions={MODEL_OPTIONS[roles[role].platform]}
            onPlatformChange={(p) => handlePlatformChange(role, p)}
            onModelChange={(m) => setRoles((prev) => ({ ...prev, [role]: { ...prev[role], model: m } }))}
          />
        ))}
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="bg-accent hover:bg-accent-hover disabled:bg-accent-muted w-full rounded-md px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed"
      >
        {isPending ? 'Starting...' : 'Start Run'}
      </button>
    </form>
  );
}
