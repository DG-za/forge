import { z } from 'zod';

const platformSchema = z.enum(['claude', 'openai']);

export const startRunSchema = z
  .object({
    repo: z
      .string()
      .min(1, 'Repo is required')
      .regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, 'Repo must be in owner/name format'),
    epicNumber: z.coerce.number().int().positive('Epic number must be a positive integer'),
    budgetUsd: z.coerce.number().min(0.01, 'Budget must be at least $0.01').max(500, 'Budget cannot exceed $500'),
    plannerPlatform: platformSchema,
    plannerModel: z.string().min(1, 'Planner model is required'),
    coderPlatform: platformSchema,
    coderModel: z.string().min(1, 'Coder model is required'),
    reviewerPlatform: platformSchema,
    reviewerModel: z.string().min(1, 'Reviewer model is required'),
  })
  .refine((data) => data.reviewerPlatform !== data.coderPlatform, {
    message: 'Reviewer must use a different platform than coder for cross-model review',
    path: ['reviewerPlatform'],
  });

export type StartRunInput = z.infer<typeof startRunSchema>;
