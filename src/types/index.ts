export type GcbCommandType = 'start' | 'stop' | 'status' | 'list';

export interface GcbCommand {
  type: GcbCommandType;
  projectId?: string;
  args?: string[];
  userId: string;
  channelId: string;
}

export type GcbEventName = 'LOG_EMITTED' | 'STATUS_CHANGED' | 'INPUT_REQUESTED';

export interface LogPayload {
  projectId: string;
  stream: 'stdout' | 'stderr';
  content: string;
}

export interface StatusPayload {
  projectId: string;
  status: 'starting' | 'running' | 'waiting' | 'stopped' | 'error';
  message?: string;
}

export interface InputRequestPayload {
  projectId: string;
  prompt: string;
  channelId: string;
}

export interface ProcessMetadata {
  pm2Id: number;
  projectId: string;
  channelId: string;
}

export interface ProjectContext {
  projectId: string;
  channelId: string;
  pm2Id: number;
}

export type GcbEvent =
  | { type: 'LOG_EMITTED'; payload: LogPayload }
  | { type: 'STATUS_CHANGED'; payload: StatusPayload }
  | { type: 'INPUT_REQUESTED'; payload: InputRequestPayload };

export interface AuditEntry {
  userId: string;
  action: string;
  projectId?: string;
  timestamp?: string;
}
