/**
 * State machine types for run and issue lifecycle.
 *
 * String literal unions (not Prisma imports) keep the state machine
 * decoupled from the ORM and testable without a database.
 */

export type RunState = 'pending' | 'planning' | 'in_progress' | 'completed' | 'failed';

export type IssueState = 'queued' | 'coding' | 'gates' | 'reviewing' | 'fixing' | 'done' | 'failed' | 'escalated';

export type RunTransition = {
  runId: string;
  from: RunState;
  to: RunState;
};

export type IssueTransition = {
  issueId: string;
  from: IssueState;
  to: IssueState;
};

export type StateChangeEvent =
  | { kind: 'run'; transition: RunTransition }
  | { kind: 'issue'; transition: IssueTransition };

export type StateChangeListener = (event: StateChangeEvent) => void;
