import { describe, expect, it } from 'vitest';
import type { CommandExecutor, QualityGateConfig } from '../coder.types';
import { runQualityGates } from '../quality-gates';

const gateConfig: QualityGateConfig = {
  lintCommand: 'npm run lint',
  typecheckCommand: 'npm run typecheck',
  testCommand: 'npm test',
};

function buildExecutor(results: Record<string, { exitCode: number; output: string }>): CommandExecutor {
  return async (command: string) => results[command] ?? { exitCode: 1, output: 'Unknown command' };
}

const allPass = buildExecutor({
  'npm run lint': { exitCode: 0, output: 'No lint errors' },
  'npm run typecheck': { exitCode: 0, output: 'No type errors' },
  'npm test': { exitCode: 0, output: 'All tests passed' },
});

describe('runQualityGates', () => {
  it('should pass when all gates succeed', async () => {
    const result = await runQualityGates(gateConfig, '/repo', allPass);

    expect(result.passed).toBe(true);
    expect(result.gates).toHaveLength(3);
    expect(result.gates.every((g) => g.passed)).toBe(true);
  });

  it('should fail when lint fails', async () => {
    const exec = buildExecutor({
      'npm run lint': { exitCode: 1, output: 'Lint error on line 5' },
      'npm run typecheck': { exitCode: 0, output: '' },
      'npm test': { exitCode: 0, output: '' },
    });

    const result = await runQualityGates(gateConfig, '/repo', exec);

    expect(result.passed).toBe(false);
    expect(result.gates[0]).toEqual({ gate: 'lint', passed: false, output: 'Lint error on line 5' });
  });

  it('should fail when typecheck fails', async () => {
    const exec = buildExecutor({
      'npm run lint': { exitCode: 0, output: '' },
      'npm run typecheck': { exitCode: 1, output: 'TS2322: Type error' },
      'npm test': { exitCode: 0, output: '' },
    });

    const result = await runQualityGates(gateConfig, '/repo', exec);

    expect(result.passed).toBe(false);
    expect(result.gates[1]).toEqual({ gate: 'typecheck', passed: false, output: 'TS2322: Type error' });
  });

  it('should fail when tests fail', async () => {
    const exec = buildExecutor({
      'npm run lint': { exitCode: 0, output: '' },
      'npm run typecheck': { exitCode: 0, output: '' },
      'npm test': { exitCode: 1, output: '3 tests failed' },
    });

    const result = await runQualityGates(gateConfig, '/repo', exec);

    expect(result.passed).toBe(false);
    expect(result.gates[2]).toEqual({ gate: 'test', passed: false, output: '3 tests failed' });
  });

  it('should report all failures when multiple gates fail', async () => {
    const exec = buildExecutor({
      'npm run lint': { exitCode: 1, output: 'lint error' },
      'npm run typecheck': { exitCode: 1, output: 'type error' },
      'npm test': { exitCode: 1, output: 'test failure' },
    });

    const result = await runQualityGates(gateConfig, '/repo', exec);

    expect(result.passed).toBe(false);
    expect(result.gates.filter((g) => !g.passed)).toHaveLength(3);
  });

  it('should run gates in order: lint, typecheck, test', async () => {
    const result = await runQualityGates(gateConfig, '/repo', allPass);

    expect(result.gates.map((g) => g.gate)).toEqual(['lint', 'typecheck', 'test']);
  });

  it('should pass cwd to the executor', async () => {
    const calls: string[] = [];
    const exec: CommandExecutor = async (_cmd, cwd) => {
      calls.push(cwd);
      return { exitCode: 0, output: '' };
    };

    await runQualityGates(gateConfig, '/my/repo', exec);

    expect(calls).toEqual(['/my/repo', '/my/repo', '/my/repo']);
  });
});
