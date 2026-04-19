import { ICollaborationProvider } from '@/providers/collaboration-provider';
import { AppConfig } from '@/core/config-validator';
import { DiscordProvider } from '@/providers/discord-provider';

/**
 * Factory function to create a collaboration provider based on the configuration.
 * @param config Validated application configuration.
 * @returns An instance of ICollaborationProvider.
 * @throws {Error} If the provider is not supported or not yet implemented.
 */
export const createProvider = (config: AppConfig): ICollaborationProvider => {
  switch (config.ABC_PROVIDER) {
    case 'discord':
      return new DiscordProvider(config);
    case 'slack':
      throw new Error('Provider slack is not yet implemented');
    case 'teams':
      throw new Error('Provider teams is not yet implemented');
    default:
      // This case should ideally be unreachable due to Zod validation in AppConfig
      throw new Error(`Provider ${(config as any).ABC_PROVIDER} is not supported`);
  }
};
