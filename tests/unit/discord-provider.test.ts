import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscordProvider } from '@/providers/discord-provider';
import { AppConfig } from '@/core/config-validator';
import { Client, GatewayIntentBits, ChannelType, EmbedBuilder } from 'discord.js';

const mockSetColor = vi.fn();
const mockSetTitle = vi.fn();
const mockSetDescription = vi.fn();
const mockEmbedBuilderConstructor = vi.fn();

vi.mock('discord.js', () => {
  const Client = vi.fn();
  Client.prototype.login = vi.fn();
  Client.prototype.on = vi.fn();

  class MockEmbedBuilder {
    constructor() {
      mockEmbedBuilderConstructor();
    }
    setColor(color: string) {
      mockSetColor(color);
      return this;
    }
    setTitle(title: string) {
      mockSetTitle(title);
      return this;
    }
    setDescription(desc: string) {
      mockSetDescription(desc);
      return this;
    }
  }

  return { 
    Client, 
    GatewayIntentBits: { Guilds: 1, GuildMessages: 2 },
    ChannelType: { GuildText: 0 },
    EmbedBuilder: MockEmbedBuilder
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

  describe('sendMessage()', () => {
    it('should send a blue embed message to the correct channel', async () => {
      const provider = new DiscordProvider(mockConfig);
      const clientInstance = vi.mocked(Client).mock.instances[0];

      const mockSend = vi.fn().mockResolvedValue({});
      const mockChannels = {
        cache: {
          get: vi.fn().mockReturnValue({ send: mockSend })
        }
      };
      (clientInstance as any).channels = mockChannels;

      await provider.sendMessage('channel-123', 'Hello world');

      expect(mockChannels.cache.get).toHaveBeenCalledWith('channel-123');
      expect(mockEmbedBuilderConstructor).toHaveBeenCalled();
      expect(mockSetColor).toHaveBeenCalledWith('#0099ff');
      expect(mockSetDescription).toHaveBeenCalledWith('Hello world');
      expect(mockSend).toHaveBeenCalledWith({ embeds: [expect.any(EmbedBuilder)] });
    });

    it('should throw an error if channel is not found', async () => {
      const provider = new DiscordProvider(mockConfig);
      const clientInstance = vi.mocked(Client).mock.instances[0];

      const mockChannels = {
        cache: {
          get: vi.fn().mockReturnValue(undefined)
        }
      };
      (clientInstance as any).channels = mockChannels;

      await expect(provider.sendMessage('invalid-channel', 'msg')).rejects.toThrow('Channel with ID invalid-channel not found');
    });
  });

  describe('waitForInput()', () => {
    it('should send a yellow embed prompt and wait for a reply', async () => {
      const provider = new DiscordProvider(mockConfig);
      const clientInstance = vi.mocked(Client).mock.instances[0];

      const mockSend = vi.fn().mockResolvedValue({});
      const mockAwaitMessages = vi.fn().mockResolvedValue({
        first: () => ({ content: 'User response' })
      });
      const mockChannel = { 
        send: mockSend,
        awaitMessages: mockAwaitMessages
      };
      const mockChannels = {
        cache: {
          get: vi.fn().mockReturnValue(mockChannel)
        }
      };
      (clientInstance as any).channels = mockChannels;
      clientInstance.user = { id: 'bot-123' } as any;

      const response = await provider.waitForInput('channel-123', 'Prompt question');

      expect(mockChannels.cache.get).toHaveBeenCalledWith('channel-123');
      expect(mockSetColor).toHaveBeenCalledWith('#ffff00');
      expect(mockSetTitle).toHaveBeenCalledWith('WAITING FOR INPUT');
      expect(mockSetDescription).toHaveBeenCalledWith('Prompt question');
      expect(mockSend).toHaveBeenCalledWith({ embeds: [expect.any(EmbedBuilder)] });
      
      expect(mockAwaitMessages).toHaveBeenCalledWith({
        filter: expect.any(Function),
        max: 1,
        time: 30 * 60 * 1000,
        errors: ['time']
      });

      // Test the filter function manually
      const filterFn = mockAwaitMessages.mock.calls[0][0].filter;
      expect(filterFn({ author: { id: 'bot-123' } })).toBe(false);
      expect(filterFn({ author: { id: 'user-456' } })).toBe(true);

      expect(response).toBe('User response');
    });

    it('should throw a timeout error if no one replies', async () => {
      const provider = new DiscordProvider(mockConfig);
      const clientInstance = vi.mocked(Client).mock.instances[0];

      const mockSend = vi.fn().mockResolvedValue({});
      const mockAwaitMessages = vi.fn().mockRejectedValue(new Map()); // Simulating Collection with 0 items on timeout
      
      const mockChannel = { 
        send: mockSend,
        awaitMessages: mockAwaitMessages
      };
      const mockChannels = {
        cache: {
          get: vi.fn().mockReturnValue(mockChannel)
        }
      };
      (clientInstance as any).channels = mockChannels;
      clientInstance.user = { id: 'bot-123' } as any;

      await expect(provider.waitForInput('channel-123', 'Prompt question')).rejects.toThrow('Timeout waiting for user input');
    });
  });
});
