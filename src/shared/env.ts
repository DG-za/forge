import { validateEnv } from './env.utils';

export { validateEnv } from './env.utils';
export type { Env } from './env.utils';

export const env = validateEnv(process.env as Record<string, string | undefined>);
