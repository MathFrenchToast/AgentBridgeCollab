import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig } from '@/core/config-validator';

describe('Strict Config Validation', () => {
  beforeEach(() => {
    vi.stubEnv('ABC_PROVIDER', 'discord');
    // Valid Discord Token (Matches regex in Technical Notes)
    vi.stubEnv('ABC_PROVIDER_TOKEN', 'M12345678901234567890123.abcdef.123456789012345678901234567');
    // Valid Gemini API Key (Matches regex in Technical Notes)
    vi.stubEnv('AGENT_API_KEY', 'AIza01234567890123456789012345678901234');
    vi.stubEnv('DISCORD_GUILD_ID', '123456789012345678');
    vi.stubEnv('DISCORD_CATEGORY_ID', '123456789012345678');
    vi.stubEnv('AUTHORIZED_USER_IDS', '123456789012345678,123456789012345679');
  });

  describe('Scenario 1: Valid Discord Token', () => {
    it('should successfully load a valid Discord configuration with a proper token', () => {
      const config = loadConfig();
      expect(config.ABC_PROVIDER_TOKEN).toBe('M12345678901234567890123.abcdef.123456789012345678901234567');
    });
  });

  describe('Scenario 2: Invalid Token Format', () => {
    it('should throw an error when ABC_PROVIDER_TOKEN is malformed (too short)', () => {
      vi.stubEnv('ABC_PROVIDER_TOKEN', 'too-short');
      expect(() => loadConfig()).toThrow(/invalid token format/i);
    });

    it('should throw an error when AGENT_API_KEY is malformed', () => {
      vi.stubEnv('AGENT_API_KEY', 'invalid-key');
      expect(() => loadConfig()).toThrow(/Invalid Agent API key format/i);
    });
  });

  describe('Scenario 3: Malformed AUTHORIZED_USER_IDS', () => {
    it('should throw an error when AUTHORIZED_USER_IDS contains non-numeric characters', () => {
      vi.stubEnv('AUTHORIZED_USER_IDS', '123456789012345678,abc123456789012345');
      expect(() => loadConfig()).toThrow(/invalid user id format/i);
    });

    it('should throw an error when AUTHORIZED_USER_IDS contains IDs that are too short', () => {
      vi.stubEnv('AUTHORIZED_USER_IDS', '123,456');
      expect(() => loadConfig()).toThrow(/invalid user id format/i);
    });
  });

  describe('Scenario 4: ABC_RESTART_DELAY', () => {
    it('should default to 3000ms when ABC_RESTART_DELAY is missing', () => {
      // @ts-ignore
      delete process.env.ABC_RESTART_DELAY;
      const config = loadConfig();
      // @ts-ignore - ABC_RESTART_DELAY might not be in the type yet
      expect(config.ABC_RESTART_DELAY).toBe(3000);
    });

    it('should coerce string to number for ABC_RESTART_DELAY', () => {
      vi.stubEnv('ABC_RESTART_DELAY', '5000');
      const config = loadConfig();
      // @ts-ignore
      expect(config.ABC_RESTART_DELAY).toBe(5000);
    });
  });
});
