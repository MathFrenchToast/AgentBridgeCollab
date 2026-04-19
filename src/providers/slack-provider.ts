import { ICollaborationProvider, GcbCommand } from '@/providers/collaboration-provider';
import { AppConfig } from '@/core/config-validator';
import { StateStore } from '@/core/state-store';
import pkg from '@slack/bolt';
const { App } = pkg;

export class SlackProvider implements ICollaborationProvider {
  private app: any;
  private botUserId?: string;
  private pendingInputs = new Map<string, (input: string) => void>();

  constructor(private config: AppConfig) {
    this.app = new App({
      token: (this.config as any).GCB_PROVIDER_TOKEN,
      signingSecret: 'NOT_USED_WITH_SOCKET_MODE', // Required but not used for socket mode
      socketMode: true,
      appToken: (this.config as any).SLACK_APP_TOKEN,
    });

    this.setupMessageListener();
  }

  async connect(): Promise<void> {
    await this.app.start();
    const auth = await this.app.client.auth.test();
    this.botUserId = auth.user_id;
    console.log(`[Slack] Connected as ${auth.user} (${this.botUserId})`);
  }

  async disconnect(): Promise<void> {
    await this.app.stop();
  }

  async createSpace(projectId: string): Promise<string> {
    const channelId = (this.config as any).SLACK_CHANNEL_ID;
    const result = await this.app.client.chat.postMessage({
      channel: channelId,
      text: `Project ${projectId} started`,
    });

    if (!result.ok || !result.ts) {
      throw new Error(`Failed to create Slack thread: ${result.error}`);
    }

    return result.ts;
  }

  async sendMessage(spaceId: string, content: string, type: 'info' | 'error' | 'success' = 'info'): Promise<void> {
    const channelId = (this.config as any).SLACK_CHANNEL_ID;
    
    // Slack doesn't have exact Embed equivalents but has Blocks.
    // For now, we'll use simple text with emoji/formatting based on type.
    const prefix = {
      info: 'ℹ️ ',
      error: '❌ ',
      success: '✅ ',
    };

    await this.app.client.chat.postMessage({
      channel: channelId,
      thread_ts: spaceId,
      text: `${prefix[type]}${content}`,
    });
  }

  async waitForInput(spaceId: string, prompt: string): Promise<string> {
    const channelId = (this.config as any).SLACK_CHANNEL_ID;

    await this.app.client.chat.postMessage({
      channel: channelId,
      thread_ts: spaceId,
      text: `⚠️ *WAITING FOR INPUT*\n${prompt}`,
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingInputs.delete(spaceId);
        reject(new Error('Timeout waiting for user input'));
      }, this.config.GCB_ASK_TIMEOUT);

      this.pendingInputs.set(spaceId, (input: string) => {
        clearTimeout(timeout);
        resolve(input);
      });
    });
  }

  onCommand(callback: (command: GcbCommand) => Promise<void>): void {
    const commands: GcbCommand['type'][] = ['start', 'stop', 'status', 'list'];

    for (const cmdType of commands) {
      this.app.command(`/${cmdType}`, async ({ command, ack }: any) => {
        await ack();

        if (!this.isAuthorized(command.user_id)) {
          console.warn(`[Security] Unauthorized access attempt by Slack user ID: ${command.user_id}`);
          // Should send ephemeral message
          await this.app.client.chat.postEphemeral({
              channel: command.channel_id,
              user: command.user_id,
              text: 'You are not authorized to use this command.'
          });
          return;
        }

        const projectId = command.text.split(' ')[0] || undefined;
        // Parse args: everything after projectId
        const args = command.text.split(' ').slice(1);

        const gcbCommand: GcbCommand = {
          type: cmdType,
          projectId,
          args,
          userId: command.user_id,
          channelId: command.channel_id,
        };

        // Log command execution
        StateStore.getInstance().logEvent({
          userId: command.user_id,
          action: `command:${cmdType}`,
          projectId: projectId
        });

        await callback(gcbCommand);
      });
    }
  }

  private setupMessageListener(): void {
    this.app.message(async ({ message }: any) => {
      // Check if it's a message in a thread we are watching
      if (message.thread_ts && this.pendingInputs.has(message.thread_ts)) {
        // Ignore messages from the bot itself
        if (message.user !== this.botUserId) {
          const resolve = this.pendingInputs.get(message.thread_ts);
          if (resolve) {
            resolve(message.text);
            this.pendingInputs.delete(message.thread_ts);
          }
        }
      }
    });
  }

  private isAuthorized(userId: string): boolean {
    const authorizedUsersStr = (this.config as any).AUTHORIZED_USER_IDS;
    
    if (!authorizedUsersStr || authorizedUsersStr.trim() === '') {
      return true; // Allow all if not set or empty
    }

    const authorizedUsers = authorizedUsersStr.split(',').map((u: string) => u.trim());
    return authorizedUsers.includes(userId);
  }
}
