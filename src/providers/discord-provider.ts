import { ICollaborationProvider, GcbCommand } from '@/providers/collaboration-provider';
import { AppConfig } from '@/core/config-validator';

export class DiscordProvider implements ICollaborationProvider {
  constructor(private config: AppConfig) {}

  async connect(): Promise<void> {
    // Placeholder implementation
  }

  async createSpace(projectId: string): Promise<string> {
    return `discord-channel-${projectId}`;
  }

  async sendMessage(spaceId: string, content: string): Promise<void> {
    // Placeholder implementation
  }

  async waitForInput(spaceId: string, prompt: string): Promise<string> {
    return 'placeholder-input';
  }

  onCommand(callback: (command: GcbCommand) => Promise<void>): void {
    // Placeholder implementation
  }
}
