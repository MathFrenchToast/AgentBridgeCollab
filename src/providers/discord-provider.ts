import { ICollaborationProvider, GcbCommand } from '@/providers/collaboration-provider';
import { AppConfig } from '@/core/config-validator';
import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, TextChannel, Message } from 'discord.js';

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

  async disconnect(): Promise<void> {
    await this.client.destroy();
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
    const channel = this.client.channels.cache.get(spaceId) as TextChannel;
    if (!channel) {
      throw new Error(`Channel with ID ${spaceId} not found`);
    }

    const embed = new EmbedBuilder()
      .setColor('#0099ff') // Blue for Info/Logs
      .setDescription(content);

    await channel.send({ embeds: [embed] });
  }

  async waitForInput(spaceId: string, prompt: string): Promise<string> {
    const channel = this.client.channels.cache.get(spaceId) as TextChannel;
    if (!channel) {
      throw new Error(`Channel with ID ${spaceId} not found`);
    }

    const embed = new EmbedBuilder()
      .setColor('#ffff00') // Yellow for HITL
      .setTitle('WAITING FOR INPUT')
      .setDescription(prompt);

    await channel.send({ embeds: [embed] });

    const filter = (m: Message) => m.author.id !== this.client.user?.id;
    const timeoutMs = this.config.GCB_ASK_TIMEOUT;

    try {
      const collected = await channel.awaitMessages({
        filter,
        max: 1,
        time: timeoutMs,
        errors: ['time'],
      });

      const response = collected.first();
      if (!response) {
        throw new Error('Timeout waiting for user input');
      }

      return response.content;
    } catch (error) {
      // discord.js awaitMessages rejects with a Collection if time runs out
      throw new Error('Timeout waiting for user input');
    }
  }

  onCommand(callback: (command: GcbCommand) => Promise<void>): void {
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const authorizedUsersStr = (this.config as any).AUTHORIZED_USERS;
      if (authorizedUsersStr) {
        const authorizedUsers = authorizedUsersStr.split(',').map((u: string) => u.trim());
        if (!authorizedUsers.includes(interaction.user.id)) {
          await interaction.reply({
            content: 'You are not authorized to use this command.',
            ephemeral: true,
          });
          return;
        }
      }

      await interaction.deferReply();

      const commandType = interaction.commandName as GcbCommand['type'];
      const projectId = interaction.options.getString('id') || undefined;

      const gcbCommand: GcbCommand = {
        type: commandType,
        projectId,
        args: [], // Add parsing for other arguments if needed
        userId: interaction.user.id,
        channelId: interaction.channelId,
      };

      await callback(gcbCommand);
    });
  }
}
