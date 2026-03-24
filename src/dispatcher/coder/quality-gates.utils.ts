import type { CommandExecutor, GateKind, GateResult, QualityGateConfig, QualityGateResult } from './coder.types';

const GATE_ORDER: { gate: GateKind; key: keyof QualityGateConfig }[] = [
  { gate: 'lint', key: 'lintCommand' },
  { gate: 'typecheck', key: 'typecheckCommand' },
  { gate: 'test', key: 'testCommand' },
];

export async function runQualityGates(
  config: QualityGateConfig,
  cwd: string,
  exec: CommandExecutor,
): Promise<QualityGateResult> {
  const gates: GateResult[] = [];

  for (const { gate, key } of GATE_ORDER) {
    const { exitCode, output } = await exec(config[key], cwd);
    gates.push({ gate, passed: exitCode === 0, output });
  }

  return { passed: gates.every((g) => g.passed), gates };
}
