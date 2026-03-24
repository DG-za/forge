'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
          {state.error}
        </div>
      )}

      <fieldset className="space-y-4">
        <div>
          <Label htmlFor="repo" className="mb-1">
            Repository
          </Label>
          <Input id="repo" name="repo" type="text" required placeholder="owner/repo" />
        </div>

        <div>
          <Label htmlFor="epicNumber" className="mb-1">
            Epic number
          </Label>
          <Input id="epicNumber" name="epicNumber" type="number" required min={1} />
        </div>

        <div>
          <Label htmlFor="budgetUsd" className="mb-1">
            Budget (USD)
          </Label>
          <Input
            id="budgetUsd"
            name="budgetUsd"
            type="number"
            required
            min={0.01}
            max={500}
            step={0.01}
            defaultValue={DEFAULT_BUDGET_USD}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium">Model configuration</legend>
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

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Starting...' : 'Start Run'}
      </Button>
    </form>
  );
}
