import { AbcCommand } from '@/types';

export interface ICollaborationProvider {
  /** Initialize connection to the platform */
  connect(): Promise<void>;
  /** Gracefully disconnect from the platform */
  disconnect(): Promise<void>;
  /** Create a dedicated space for a project (e.g., Discord Channel or Slack Thread) */
  createSpace(projectId: string): Promise<string>;
  /** Post a message to a specific space */
  sendMessage(spaceId: string, content: string, type?: 'info' | 'error' | 'success'): Promise<void>;
  /** Blocking call to wait for human input in a specific space */
  waitForInput(spaceId: string, prompt: string): Promise<string>;
  /** Listen for slash commands or mentions from users */
  onCommand(callback: (command: AbcCommand) => Promise<void>): void;
}

export { AbcCommand };
