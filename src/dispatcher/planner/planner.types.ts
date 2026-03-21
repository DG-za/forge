export type TaskComplexity = 'small' | 'medium' | 'large';

export type PlannedTask = {
  issueNumber: number | null;
  title: string;
  acceptanceCriteria: string[];
  dependencies: number[];
  complexity: TaskComplexity;
};

export type Plan = {
  tasks: PlannedTask[];
  summary: string;
};

export type EpicContext = {
  repo: string;
  epicNumber: number;
  epicTitle: string;
  epicBody: string;
  issues: EpicIssue[];
  repoIssues: EpicIssue[];
};

export type EpicIssue = {
  number: number;
  title: string;
  body: string;
  labels: string[];
  state: 'open' | 'closed';
};

export type CompletedIssue = {
  issueNumber: number;
  outcome: 'done' | 'failed' | 'escalated';
  notes: string;
};

export type ReplanContext = {
  originalPlan: Plan;
  completedIssues: CompletedIssue[];
  remainingIssues: EpicIssue[];
};

export interface IssueFetcher {
  fetchEpic(repo: string, epicNumber: number): Promise<EpicContext>;
}
