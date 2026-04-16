import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig } from '@/core/Config';

describe('Config Loader', () => {
  beforeEach(() => {
    vi.stubEnv('GCB_PROVIDER', 'discord');
    vi.stubEnv('GCB_PROVIDER_TOKEN', 'token-abc');
    vi.stubEnv('GEMINI_API_KEY', 'api-xyz');
    vi.stubEnv('DISCORD_GUILD_ID', 'guild-123');
    vi.stubEnv('DISCORD_CATEGORY_ID', 'cat-456');
  });

  it('should successfully load a valid Discord configuration', () => {
    const config = loadConfig();
    expect(config.GCB_PROVIDER).toBe('discord');
    expect(config.GCB_PROVIDER_TOKEN).toBe('token-abc');
    expect(config.DISCORD_GUILD_ID).toBe('guild-123');
  });

  it('should throw an error when GCB_PROVIDER is invalid', () => {
    vi.stubEnv('GCB_PROVIDER', 'invalid-platform');
    expect(() => loadConfig()).toThrow();
  });

  it('should throw an error when required GCB_PROVIDER_TOKEN is missing', () => {
    vi.stubEnv('GCB_PROVIDER_TOKEN', '');
    expect(() => loadConfig()).toThrow();
  });

  it('should throw an error when Discord-specific guild ID is missing for Discord provider', () => {
    vi.stubEnv('DISCORD_GUILD_ID', '');
    expect(() => loadConfig()).toThrow();
  });

  it('should successfully load a valid Slack configuration', () => {
    vi.stubEnv('GCB_PROVIDER', 'slack');
    const config = loadConfig();
    expect(config.GCB_PROVIDER).toBe('slack');
    expect(config.GCB_PROVIDER_TOKEN).toBe('token-abc');
  });
});
