import { z } from 'zod';

export const startRunSchema = z.object({
  repo: z
    .string()
    .min(1, 'Repo is required')
    .regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, 'Repo must be in owner/name format'),
  epicNumber: z.coerce.number().int().positive('Epic number must be a positive integer'),
  budgetUsd: z.coerce.number().min(0.01, 'Budget must be at least $0.01').max(500, 'Budget cannot exceed $500'),
});

export type StartRunInput = z.infer<typeof startRunSchema>;
