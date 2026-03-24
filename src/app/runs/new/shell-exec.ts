import { exec } from 'child_process';

export function shellExec(command: string, cwd: string): Promise<{ exitCode: number; output: string }> {
  return new Promise((resolve) => {
    exec(command, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({
        exitCode: error?.code ?? 0,
        output: stdout + stderr,
      });
    });
  });
}
