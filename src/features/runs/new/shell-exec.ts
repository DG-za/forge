import { execFile } from 'child_process';

export function shellExec(command: string, cwd: string): Promise<{ exitCode: number; output: string }> {
  const [cmd, ...args] = command.split(' ');

  return new Promise((resolve) => {
    execFile(cmd, args, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({
        exitCode: typeof error?.code === 'number' ? error.code : error ? 1 : 0,
        output: stdout + stderr,
      });
    });
  });
}
