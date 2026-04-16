import { ICollaborationProvider, GcbCommand } from '@/providers/collaboration-provider';
import { AppConfig } from '@/core/config-validator';
import { Client, GatewayIntentBits, ChannelType } from 'discord.js';

export class DiscordProvider implements ICollaborationProvider {
  private client: Client;

  constructor(private config: AppConfig) {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.on('ready', () => {
        resolve();
      });

      // Using type assertion for GCB_PROVIDER_TOKEN as it's guaranteed to be there for discord config
      const token = (this.config as any).GCB_PROVIDER_TOKEN;
      this.client.login(token).catch((err) => {
        reject(err);
      });
    });
  }

  async createSpace(projectId: string): Promise<string> {
    // We expect DISCORD_GUILD_ID and DISCORD_CATEGORY_ID to exist based on AppConfig validation for discord provider
    const guildId = (this.config as any).DISCORD_GUILD_ID;
    const categoryId = (this.config as any).DISCORD_CATEGORY_ID;

    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) {
      throw new Error(`Guild with ID ${guildId} not found`);
    }

    const channel = await guild.channels.create({
      name: projectId,
      type: ChannelType.GuildText,
      parent: categoryId,
    });

    return channel.id;
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
