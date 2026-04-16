import { describe, it, expect } from 'vitest';
import { createProvider } from '@/providers/provider-factory';
import { AppConfig } from '@/core/config-validator';

describe('Provider Factory', () => {
  it('should create a DiscordProvider when GCB_PROVIDER is discord', () => {
    const mockConfig: AppConfig = {
      GCB_PROVIDER: 'discord',
      GCB_PROVIDER_TOKEN: 'mock-token',
      GEMINI_API_KEY: 'mock-api-key',
      DISCORD_GUILD_ID: 'mock-guild-id',
      DISCORD_CATEGORY_ID: 'mock-category-id',
    };

    const provider = createProvider(mockConfig);
    expect(provider.constructor.name).toBe('DiscordProvider');
  });

  it('should throw an error for unsupported providers', () => {
    // Note: AppConfig is a discriminated union, so in TS we can't easily pass a wrong GCB_PROVIDER
    // unless we cast it or use a runtime check if the union expands.
    // Currently Slack and Teams are in the union but might not be implemented.
    
    const mockConfig = {
      GCB_PROVIDER: 'slack',
      GCB_PROVIDER_TOKEN: 'mock-token',
      GEMINI_API_KEY: 'mock-api-key',
    } as AppConfig;

    expect(() => createProvider(mockConfig)).toThrow('Provider slack is not yet implemented');
  });
});
