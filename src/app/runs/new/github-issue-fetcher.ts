import type { EpicContext, EpicIssue, IssueFetcher } from '@/dispatcher/planner/planner.types';
import { execSync } from 'child_process';

type GhIssue = {
  number: number;
  title: string;
  body: string;
  labels: { name: string }[];
  state: string;
};

export class GithubIssueFetcher implements IssueFetcher {
  async fetchEpic(repo: string, epicNumber: number): Promise<EpicContext> {
    const epic = this.ghJson<GhIssue>(
      `gh issue view ${epicNumber} --repo ${repo} --json number,title,body,labels,state`,
    );
    const allIssues = this.ghJson<GhIssue[]>(
      `gh issue list --repo ${repo} --state all --limit 200 --json number,title,body,labels,state`,
    );

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

  private ghJson<T>(command: string): T {
    const output = execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(output) as T;
  }
}
