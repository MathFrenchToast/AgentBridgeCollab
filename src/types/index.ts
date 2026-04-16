export type GcbCommandType = 'start' | 'stop' | 'status' | 'list';

export interface GcbCommand {
  type: GcbCommandType;
  projectId?: string;
  args?: string[];
  userId: string;
  channelId: string;
}
