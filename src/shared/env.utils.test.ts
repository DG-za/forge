import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.utils';

const validEnv = {
  DATABASE_URL: 'postgresql://forge:forge@localhost:5432/forge',
  ANTHROPIC_API_KEY: 'sk-ant-test-key',
  OPENAI_API_KEY: 'sk-test-key',
};

describe('validateEnv', () => {
  it('should return typed config when all required vars are present', () => {
    const result = validateEnv(validEnv);

    expect(result).toEqual({
      DATABASE_URL: 'postgresql://forge:forge@localhost:5432/forge',
      ANTHROPIC_API_KEY: 'sk-ant-test-key',
      OPENAI_API_KEY: 'sk-test-key',
    });
  });

  it('should throw when DATABASE_URL is missing', () => {
    const env = { ...validEnv, DATABASE_URL: undefined };

    expect(() => validateEnv(env)).toThrow('DATABASE_URL');
  });

  it('should throw when DATABASE_URL is empty', () => {
    const env = { ...validEnv, DATABASE_URL: '' };

    expect(() => validateEnv(env)).toThrow('DATABASE_URL');
  });

  it('should throw when DATABASE_URL is not a postgres connection string', () => {
    const env = { ...validEnv, DATABASE_URL: 'mysql://localhost/db' };

    expect(() => validateEnv(env)).toThrow('DATABASE_URL');
  });

  it('should accept postgres:// scheme', () => {
    const env = { ...validEnv, DATABASE_URL: 'postgres://forge:forge@localhost:5432/forge' };

    const result = validateEnv(env);

    expect(result.DATABASE_URL).toBe('postgres://forge:forge@localhost:5432/forge');
  });

  it('should throw when ANTHROPIC_API_KEY is missing', () => {
    const env = { ...validEnv, ANTHROPIC_API_KEY: undefined };

    expect(() => validateEnv(env)).toThrow('ANTHROPIC_API_KEY');
  });

  it('should throw when OPENAI_API_KEY is missing', () => {
    const env = { ...validEnv, OPENAI_API_KEY: undefined };

    expect(() => validateEnv(env)).toThrow('OPENAI_API_KEY');
  });

  it('should list all missing vars in a single error message', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL[\s\S]*ANTHROPIC_API_KEY[\s\S]*OPENAI_API_KEY/);
  });

  it('should include .env.example hint in the error message', () => {
    expect(() => validateEnv({})).toThrow('.env.example');
  });
});
