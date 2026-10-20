export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'open' | 'done';

export interface Task {
  id: number;
  title: string;
  priority: Priority;
  due: string | null; // YYYY-MM-DD
  status: TaskStatus;
  created_at: string;
  completed_at: string | null;
}

export interface TraceItem {
  id: string;
  step: string;
  method: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  ms: number;
  ok: boolean;
  timestamp: string;
  protocolVersion: string;
}

export interface McpToolSchema {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    idempotentHint?: boolean;
    [key: string]: unknown;
  };
}

export interface ToolCall {
  name: 'list_tasks' | 'create_task' | 'complete_task';
  arguments: Record<string, unknown>;
}

export interface PlanResult {
  thought?: string;
  toolCalls: ToolCall[];
  context?: Record<string, unknown>;
  replyTemplate?: string;
}

export interface ChatResponse {
  reply: string;
  planner: 'rule-based' | 'bedrock';
  toolCallsCount: number;
  tasks: Task[];
  trace: TraceItem[];
  ambiguousCandidates?: Task[];
}

export type NavTab = 'workspace' | 'mission' | 'tasks' | 'inspector' | 'settings';

export interface ProposedAction {
  id: string;
  action: 'create' | 'complete';
  title: string;
  priority: Priority;
  due: string | null;
  rationale: string;
  timeEstimate: string;
  selected: boolean;
}

export interface MissionPlan {
  missionTitle: string;
  goal: string;
  reasoning: string;
  proposedActions: ProposedAction[];
  clarifications: string[];
}
