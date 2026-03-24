import { z } from 'zod';

const databaseUrlSchema = z
  .string()
  .min(1, 'Required')
  .regex(/^postgres(ql)?:\/\//, 'Must be a PostgreSQL connection string (postgresql:// or postgres://)');

const envSchema = z.object({
  DATABASE_URL: databaseUrlSchema,
  ANTHROPIC_API_KEY: z.string().min(1, 'Required'),
  OPENAI_API_KEY: z.string().min(1, 'Required'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(env: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(env);

  if (result.success) return result.data;

  const lines = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
  const message = ['Missing or invalid environment variables:', ...lines, '', 'See .env.example for reference.'].join(
    '\n',
  );

  throw new Error(message);
}
