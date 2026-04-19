import { describe, it, expect } from 'vitest';
import { createProvider } from '@/providers/provider-factory';
describe('Provider Factory', () => {
    it('should create a DiscordProvider when ABC_PROVIDER is discord', () => {
        const mockConfig = {
            ABC_PROVIDER: 'discord',
            ABC_PROVIDER_TOKEN: 'mock-token',
            AGENT_API_KEY: 'mock-api-key',
            DISCORD_GUILD_ID: 'mock-guild-id',
            DISCORD_CATEGORY_ID: 'mock-category-id',
        };
        const provider = createProvider(mockConfig);
        expect(provider.constructor.name).toBe('DiscordProvider');
    });
    it('should throw an error for unsupported providers', () => {
        // Note: AppConfig is a discriminated union, so in TS we can't easily pass a wrong ABC_PROVIDER
        // unless we cast it or use a runtime check if the union expands.
        // Currently Slack and Teams are in the union but might not be implemented.
        const mockConfig = {
            ABC_PROVIDER: 'slack',
            ABC_PROVIDER_TOKEN: 'mock-token',
            AGENT_API_KEY: 'mock-api-key',
        };
        expect(() => createProvider(mockConfig)).toThrow('Provider slack is not yet implemented');
    });
});
