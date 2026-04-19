import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig } from '@/core/config-validator';

describe('Slack Config Validation', () => {
  beforeEach(() => {
    vi.stubEnv('GCB_PROVIDER', 'slack');
    vi.stubEnv('GCB_PROVIDER_TOKEN', 'xoxb-1234567890-1234567890-abcdef');
    vi.stubEnv('SLACK_APP_TOKEN', 'xapp-1-A12345678-12345678-abcdef');
    vi.stubEnv('SLACK_CHANNEL_ID', 'C12345678');
    vi.stubEnv('GEMINI_API_KEY', 'AIza01234567890123456789012345678901234');
  });

  it('should successfully load a valid Slack configuration', () => {
    const config = loadConfig();
    expect(config.GCB_PROVIDER).toBe('slack');
    expect(config.GCB_PROVIDER_TOKEN).toBe('xoxb-1234567890-1234567890-abcdef');
    // @ts-ignore
    expect(config.SLACK_APP_TOKEN).toBe('xapp-1-A12345678-12345678-abcdef');
    // @ts-ignore
    expect(config.SLACK_CHANNEL_ID).toBe('C12345678');
  });

  it('should throw an error when SLACK_APP_TOKEN is missing', () => {
    vi.stubEnv('SLACK_APP_TOKEN', '');
    expect(() => loadConfig()).toThrow(/SLACK_APP_TOKEN/);
  });

  it('should throw an error when SLACK_CHANNEL_ID is missing', () => {
    vi.stubEnv('SLACK_CHANNEL_ID', '');
    expect(() => loadConfig()).toThrow(/SLACK_CHANNEL_ID/);
  });

  it('should throw an error when GCB_PROVIDER_TOKEN does not start with xoxb-', () => {
    vi.stubEnv('GCB_PROVIDER_TOKEN', 'invalid-token');
    expect(() => loadConfig()).toThrow(/Invalid token format for Slack/);
  });
});
