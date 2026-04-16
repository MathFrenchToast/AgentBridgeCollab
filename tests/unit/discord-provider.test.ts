import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscordProvider } from '@/providers/discord-provider';
import { AppConfig } from '@/core/config-validator';
import { Client, GatewayIntentBits, ChannelType } from 'discord.js';

vi.mock('discord.js', () => {
  const Client = vi.fn();
  Client.prototype.login = vi.fn();
  Client.prototype.on = vi.fn();
  return { 
    Client, 
    GatewayIntentBits: { Guilds: 1, GuildMessages: 2 },
    ChannelType: { GuildText: 0 }
  };
});

describe('DiscordProvider', () => {
  let mockConfig: AppConfig;

  beforeEach(() => {
    vi.resetAllMocks(); // Resets implementations as well
    mockConfig = {
      GCB_PROVIDER: 'discord',
      GCB_PROVIDER_TOKEN: 'valid-token',
      GEMINI_API_KEY: 'mock-api-key',
      DISCORD_GUILD_ID: 'guild-123',
      DISCORD_CATEGORY_ID: 'category-123',
    };
  });

  describe('connect()', () => {
    it('should authenticate and resolve when ready', async () => {
      const provider = new DiscordProvider(mockConfig);
      const clientInstance = vi.mocked(Client).mock.instances[0];

      // Mock login to resolve successfully
      vi.mocked(clientInstance.login).mockResolvedValue('valid-token');
      
      // Mock on('ready') to execute callback to resolve connect() promise
      vi.mocked(clientInstance.on).mockImplementation((event, callback) => {
        if (event === 'ready') {
          callback(); // trigger ready
        }
        return clientInstance;
      });

      await expect(provider.connect()).resolves.toBeUndefined();

      expect(Client).toHaveBeenCalledWith({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
      });
      expect(clientInstance.login).toHaveBeenCalledWith('valid-token');
    });

    it('should throw an error on invalid credentials', async () => {
      const provider = new DiscordProvider(mockConfig);
      const clientInstance = vi.mocked(Client).mock.instances[0];

      // Reset 'on' implementation so it doesn't immediately resolve
      vi.mocked(clientInstance.on).mockImplementation(() => clientInstance);

      // Mock login to reject
      vi.mocked(clientInstance.login).mockRejectedValue(new Error('Invalid token'));

      await expect(provider.connect()).rejects.toThrow('Invalid token');
    });
  });

  describe('createSpace()', () => {
    it('should create a text channel and return its ID', async () => {
      const provider = new DiscordProvider(mockConfig);
      const clientInstance = vi.mocked(Client).mock.instances[0];

      const mockChannel = { id: 'new-channel-123' };
      const mockCreate = vi.fn().mockResolvedValue(mockChannel);
      const mockGuilds = {
        cache: {
          get: vi.fn().mockReturnValue({
            channels: { create: mockCreate }
          })
        }
      };

      // Set the mock guilds on the client instance
      (clientInstance as any).guilds = mockGuilds;

      const spaceId = await provider.createSpace('test-project');

      expect(mockGuilds.cache.get).toHaveBeenCalledWith('guild-123');
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'test-project',
        type: ChannelType.GuildText,
        parent: 'category-123'
      });
      expect(spaceId).toBe('new-channel-123');
    });

    it('should throw an error if guild is not found', async () => {
      const provider = new DiscordProvider(mockConfig);
      const clientInstance = vi.mocked(Client).mock.instances[0];

      const mockGuilds = {
        cache: {
          get: vi.fn().mockReturnValue(undefined)
        }
      };
      (clientInstance as any).guilds = mockGuilds;

      await expect(provider.createSpace('test-project')).rejects.toThrow('Guild with ID guild-123 not found');
    });
  });
});
