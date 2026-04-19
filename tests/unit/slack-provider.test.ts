import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SlackProvider } from '@/providers/slack-provider';
import { AppConfig } from '@/core/config-validator';

// Mock @slack/bolt
const mockApp = {
  start: vi.fn().mockResolvedValue({}),
  stop: vi.fn().mockResolvedValue({}),
  command: vi.fn(),
  message: vi.fn(),
  client: {
    chat: {
      postMessage: vi.fn().mockResolvedValue({ ok: true, ts: '12345.678' }),
    },
    conversations: {
        replies: vi.fn().mockResolvedValue({ ok: true, messages: [] })
    }
  },
};

vi.mock('@slack/bolt', () => {
  return {
    default: {
      App: vi.fn(() => mockApp),
    },
    App: vi.fn(() => mockApp),
  };
});

describe('SlackProvider', () => {
  let provider: SlackProvider;
  const config: AppConfig = {
    GCB_PROVIDER: 'slack',
    GCB_PROVIDER_TOKEN: 'xoxb-bot-token',
    SLACK_APP_TOKEN: 'xapp-app-token',
    SLACK_CHANNEL_ID: 'C12345',
    GEMINI_API_KEY: 'AIzaSy-api-key',
    GCB_ASK_TIMEOUT: 1000,
    GCB_RESTART_DELAY: 3000,
    DATABASE_PATH: ':memory:',
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new SlackProvider(config);
  });

  it('should connect to Slack and retrieve botUserId', async () => {
    mockApp.client.auth = {
      test: vi.fn().mockResolvedValue({ ok: true, user_id: 'BOT_ID', user: 'bot-user' })
    } as any;
    
    await provider.connect();
    expect(mockApp.start).toHaveBeenCalled();
    expect(mockApp.client.auth.test).toHaveBeenCalled();
    expect((provider as any).botUserId).toBe('BOT_ID');
  });

  it('should disconnect from Slack', async () => {
    await provider.disconnect();
    expect(mockApp.stop).toHaveBeenCalled();
  });

  it('should create a space (thread)', async () => {
    const spaceId = await provider.createSpace('test-project');
    expect(mockApp.client.chat.postMessage).toHaveBeenCalledWith({
      channel: 'C12345',
      text: 'Project test-project started',
    });
    expect(spaceId).toBe('12345.678');
  });

  it('should send a message to a thread', async () => {
    await provider.sendMessage('12345.678', 'Hello world', 'info');
    expect(mockApp.client.chat.postMessage).toHaveBeenCalledWith({
      channel: 'C12345',
      text: 'Hello world',
      thread_ts: '12345.678',
    });
  });

  it('should wait for human input in a thread', async () => {
    // Capture the message listener
    const messageListener = mockApp.message.mock.calls[0][0];
    
    // Set botUserId to avoid ignoring our own messages in the test
    (provider as any).botUserId = 'BOT_ID';

    const promise = provider.waitForInput('12345.678', 'What is your name?');
    
    // Simulate user message
    await messageListener({
        message: {
            thread_ts: '12345.678',
            text: 'My name is Gemini',
            user: 'USER_ID'
        }
    });

    const result = await promise;
    expect(result).toBe('My name is Gemini');
  });

  it('should register slash commands', () => {
    const callback = vi.fn();
    provider.onCommand(callback);
    
    expect(mockApp.command).toHaveBeenCalledWith('/start', expect.any(Function));
    expect(mockApp.command).toHaveBeenCalledWith('/stop', expect.any(Function));
    expect(mockApp.command).toHaveBeenCalledWith('/status', expect.any(Function));
    expect(mockApp.command).toHaveBeenCalledWith('/list', expect.any(Function));
  });

  it('should timeout if no input is received', async () => {
    vi.useFakeTimers();
    const promise = provider.waitForInput('12345.678', 'What is your name?');
    
    vi.advanceTimersByTime(2000000); // More than GCB_ASK_TIMEOUT
    
    await expect(promise).rejects.toThrow('Timeout waiting for user input');
    vi.useRealTimers();
  });
});
