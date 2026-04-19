import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscordProvider } from '@/providers/discord-provider';
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
        setColor(color) {
            mockSetColor(color);
            return this;
        }
        setTitle(title) {
            mockSetTitle(title);
            return this;
        }
        setDescription(desc) {
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
    let mockConfig;
    beforeEach(() => {
        vi.resetAllMocks(); // Resets implementations as well
        mockConfig = {
            GCB_PROVIDER: 'discord',
            GCB_PROVIDER_TOKEN: 'valid-token',
            GEMINI_API_KEY: 'mock-api-key',
            DISCORD_GUILD_ID: 'guild-123',
            DISCORD_CATEGORY_ID: 'category-123',
            AUTHORIZED_USER_IDS: 'auth-user-123,another-user',
            GCB_ASK_TIMEOUT: 1800000,
        };
    });
    describe('isAuthorized()', () => {
        it('should return true if AUTHORIZED_USER_IDS is not set', () => {
            delete mockConfig.AUTHORIZED_USER_IDS;
            const provider = new DiscordProvider(mockConfig);
            expect(provider.isAuthorized('any-user')).toBe(true);
        });
        it('should return true if AUTHORIZED_USER_IDS is an empty string', () => {
            mockConfig.AUTHORIZED_USER_IDS = '';
            const provider = new DiscordProvider(mockConfig);
            expect(provider.isAuthorized('any-user')).toBe(true);
        });
        it('should return true if user is in the whitelist', () => {
            mockConfig.AUTHORIZED_USER_IDS = 'user1, user2 ,user3';
            const provider = new DiscordProvider(mockConfig);
            expect(provider.isAuthorized('user2')).toBe(true);
        });
        it('should return false if user is NOT in the whitelist', () => {
            mockConfig.AUTHORIZED_USER_IDS = 'user1, user2';
            const provider = new DiscordProvider(mockConfig);
            expect(provider.isAuthorized('user3')).toBe(false);
        });
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
            clientInstance.guilds = mockGuilds;
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
            clientInstance.guilds = mockGuilds;
            await expect(provider.createSpace('test-project')).rejects.toThrow('Guild with ID guild-123 not found');
        });
    });
    describe('sendMessage()', () => {
        it('should send a blue embed message for info type', async () => {
            const provider = new DiscordProvider(mockConfig);
            const clientInstance = vi.mocked(Client).mock.instances[0];
            const mockSend = vi.fn().mockResolvedValue({});
            const mockChannels = {
                cache: {
                    get: vi.fn().mockReturnValue({ send: mockSend })
                }
            };
            clientInstance.channels = mockChannels;
            await provider.sendMessage('channel-123', 'Hello world', 'info');
            expect(mockSetColor).toHaveBeenCalledWith('#0099ff');
        });
        it('should send a red embed message for error type', async () => {
            const provider = new DiscordProvider(mockConfig);
            const clientInstance = vi.mocked(Client).mock.instances[0];
            const mockSend = vi.fn().mockResolvedValue({});
            const mockChannels = {
                cache: {
                    get: vi.fn().mockReturnValue({ send: mockSend })
                }
            };
            clientInstance.channels = mockChannels;
            await provider.sendMessage('channel-123', 'Error occurred', 'error');
            expect(mockSetColor).toHaveBeenCalledWith('#ff0000');
        });
        it('should send a green embed message for success type', async () => {
            const provider = new DiscordProvider(mockConfig);
            const clientInstance = vi.mocked(Client).mock.instances[0];
            const mockSend = vi.fn().mockResolvedValue({});
            const mockChannels = {
                cache: {
                    get: vi.fn().mockReturnValue({ send: mockSend })
                }
            };
            clientInstance.channels = mockChannels;
            await provider.sendMessage('channel-123', 'Task completed', 'success');
            expect(mockSetColor).toHaveBeenCalledWith('#00ff00');
        });
        it('should throw an error if channel is not found', async () => {
            const provider = new DiscordProvider(mockConfig);
            const clientInstance = vi.mocked(Client).mock.instances[0];
            const mockChannels = {
                cache: {
                    get: vi.fn().mockReturnValue(undefined)
                }
            };
            clientInstance.channels = mockChannels;
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
            clientInstance.channels = mockChannels;
            clientInstance.user = { id: 'bot-123' };
            const response = await provider.waitForInput('channel-123', 'Prompt question');
            expect(mockChannels.cache.get).toHaveBeenCalledWith('channel-123');
            expect(mockSetColor).toHaveBeenCalledWith('#ffff00');
            expect(mockSetTitle).toHaveBeenCalledWith('WAITING FOR INPUT');
            expect(mockSetDescription).toHaveBeenCalledWith('Prompt question');
            expect(mockSend).toHaveBeenCalledWith({ embeds: [expect.any(EmbedBuilder)] });
            expect(mockAwaitMessages).toHaveBeenCalledWith({
                filter: expect.any(Function),
                max: 1,
                time: mockConfig.GCB_ASK_TIMEOUT,
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
            clientInstance.channels = mockChannels;
            clientInstance.user = { id: 'bot-123' };
            await expect(provider.waitForInput('channel-123', 'Prompt question')).rejects.toThrow('Timeout waiting for user input');
        });
    });
    describe('onCommand()', () => {
        it('should parse chat input commands and invoke the callback if user is authorized', async () => {
            const provider = new DiscordProvider(mockConfig);
            const clientInstance = vi.mocked(Client).mock.instances[0];
            const mockCallback = vi.fn().mockResolvedValue(undefined);
            provider.onCommand(mockCallback);
            const interactionHandler = vi.mocked(clientInstance.on).mock.calls.find(call => call[0] === 'interactionCreate')?.[1];
            expect(interactionHandler).toBeDefined();
            const mockInteraction = {
                isChatInputCommand: () => true,
                commandName: 'start',
                options: {
                    getString: vi.fn().mockReturnValue('project-123')
                },
                user: { id: 'auth-user-123' },
                channelId: 'channel-123',
                deferReply: vi.fn().mockResolvedValue(undefined),
            };
            await interactionHandler(mockInteraction);
            expect(mockInteraction.deferReply).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith({
                type: 'start',
                projectId: 'project-123',
                args: [],
                userId: 'auth-user-123',
                channelId: 'channel-123',
            });
        });
        it('should reject the command if user is not authorized', async () => {
            const provider = new DiscordProvider(mockConfig);
            const clientInstance = vi.mocked(Client).mock.instances[0];
            const mockCallback = vi.fn().mockResolvedValue(undefined);
            provider.onCommand(mockCallback);
            const interactionHandler = vi.mocked(clientInstance.on).mock.calls.find(call => call[0] === 'interactionCreate')?.[1];
            const mockInteraction = {
                isChatInputCommand: () => true,
                commandName: 'start',
                options: {
                    getString: vi.fn().mockReturnValue('project-123')
                },
                user: { id: 'unauthorized-user' },
                channelId: 'channel-123',
                reply: vi.fn().mockResolvedValue(undefined),
            };
            await interactionHandler(mockInteraction);
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'You are not authorized to use this command.',
                ephemeral: true,
            });
            expect(mockCallback).not.toHaveBeenCalled();
        });
        it('should allow the command if whitelist is empty', async () => {
            delete mockConfig.AUTHORIZED_USER_IDS;
            const provider = new DiscordProvider(mockConfig);
            const clientInstance = vi.mocked(Client).mock.instances[0];
            const mockCallback = vi.fn().mockResolvedValue(undefined);
            provider.onCommand(mockCallback);
            const interactionHandler = vi.mocked(clientInstance.on).mock.calls.find(call => call[0] === 'interactionCreate')?.[1];
            const mockInteraction = {
                isChatInputCommand: () => true,
                commandName: 'start',
                options: {
                    getString: vi.fn().mockReturnValue('project-123')
                },
                user: { id: 'any-user' },
                channelId: 'channel-123',
                deferReply: vi.fn().mockResolvedValue(undefined),
            };
            await interactionHandler(mockInteraction);
            expect(mockInteraction.deferReply).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalled();
        });
        it('should ignore non-chat input commands', async () => {
            const provider = new DiscordProvider(mockConfig);
            const clientInstance = vi.mocked(Client).mock.instances[0];
            const mockCallback = vi.fn().mockResolvedValue(undefined);
            provider.onCommand(mockCallback);
            const interactionHandler = vi.mocked(clientInstance.on).mock.calls.find(call => call[0] === 'interactionCreate')?.[1];
            const mockInteraction = {
                isChatInputCommand: () => false,
            };
            await interactionHandler(mockInteraction);
            expect(mockCallback).not.toHaveBeenCalled();
        });
    });
});
