export type RunSummary = {
  id: string;
  status: string;
  repo: string;
  epicNumber: number;
  totalCostUsd: number;
  createdAt: Date;
};

export type RunDetail = {
  id: string;
  status: string;
  repo: string;
  epicNumber: number;
  budgetUsd: number | null;
  totalCostUsd: number;
  planSummary: string | null;
  createdAt: Date;
  updatedAt: Date;
  issues: {
    id: string;
    issueNumber: number;
    title: string;
    status: string;
    costUsd: number;
    agentLogs: {
      id: string;
      role: string;
      platform: string;
      model: string;
      costUsd: number;
      durationMs: number;
      createdAt: Date;
    }[];
  }[];
  planTasks: {
    id: string;
    orderIndex: number;
    issueNumber: number | null;
    title: string;
    acceptanceCriteria: string[];
    complexity: string;
  }[];
};

export type ActionResult<T = void> = { error: string } | ({ error?: never } & T);
