import { validateEnv } from './validate-env';

export { validateEnv } from './validate-env';
export type { Env } from './validate-env';

export const env = validateEnv(process.env as Record<string, string | undefined>);
