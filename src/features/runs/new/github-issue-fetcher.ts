import type { EpicContext, EpicIssue, IssueFetcher } from '@/dispatcher/planner/planner.types';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

type GhIssue = {
  number: number;
  title: string;
  body: string;
  labels: { name: string }[];
  state: string;
};

const JSON_FIELDS = 'number,title,body,labels,state';

export class GithubIssueFetcher implements IssueFetcher {
  async fetchEpic(repo: string, epicNumber: number): Promise<EpicContext> {
    const [epic, allIssues] = await Promise.all([
      this.ghJson<GhIssue>(['issue', 'view', String(epicNumber), '--repo', repo, '--json', JSON_FIELDS]),
      this.ghJson<GhIssue[]>([
        'issue',
        'list',
        '--repo',
        repo,
        '--state',
        'all',
        '--limit',
        '200',
        '--json',
        JSON_FIELDS,
      ]),
    ]);

    const mapIssue = (i: GhIssue): EpicIssue => ({
      number: i.number,
      title: i.title,
      body: i.body,
      labels: i.labels.map((l) => l.name),
      state: i.state === 'OPEN' ? 'open' : 'closed',
    });

    return {
      repo,
      epicNumber,
      epicTitle: epic.title,
      epicBody: epic.body,
      issues: allIssues.filter((i) => i.body?.includes(`#${epicNumber}`)).map(mapIssue),
      repoIssues: allIssues.map(mapIssue),
    };
  }

  private async ghJson<T>(args: string[]): Promise<T> {
    const { stdout } = await execFileAsync('gh', args, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(stdout) as T;
  }
}
