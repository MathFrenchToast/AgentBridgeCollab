import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig } from '@/core/config-validator';
describe('Config Loader', () => {
    beforeEach(() => {
        vi.stubEnv('ABC_PROVIDER', 'discord');
        // Valid Discord Token
        vi.stubEnv('ABC_PROVIDER_TOKEN', 'M12345678901234567890123.abcdef.123456789012345678901234567');
        // Valid Gemini API Key
        vi.stubEnv('AGENT_API_KEY', 'AIza01234567890123456789012345678901234');
        vi.stubEnv('DISCORD_GUILD_ID', '123456789012345678');
        vi.stubEnv('DISCORD_CATEGORY_ID', '123456789012345678');
        vi.stubEnv('AUTHORIZED_USER_IDS', '');
    });
    it('should successfully load a valid Discord configuration', () => {
        const config = loadConfig();
        expect(config.ABC_PROVIDER).toBe('discord');
        expect(config.ABC_PROVIDER_TOKEN).toBe('M12345678901234567890123.abcdef.123456789012345678901234567');
        expect(config.DISCORD_GUILD_ID).toBe('123456789012345678');
    });
    it('should throw an error when ABC_PROVIDER is invalid', () => {
        vi.stubEnv('ABC_PROVIDER', 'invalid-platform');
        expect(() => loadConfig()).toThrow();
    });
    it('should throw an error when required ABC_PROVIDER_TOKEN is missing', () => {
        vi.stubEnv('ABC_PROVIDER_TOKEN', '');
        expect(() => loadConfig()).toThrow();
    });
    it('should throw an error when Discord-specific guild ID is missing for Discord provider', () => {
        vi.stubEnv('DISCORD_GUILD_ID', '');
        expect(() => loadConfig()).toThrow();
    });
    it('should successfully load a valid Slack configuration', () => {
        vi.stubEnv('ABC_PROVIDER', 'slack');
        const config = loadConfig();
        expect(config.ABC_PROVIDER).toBe('slack');
        expect(config.ABC_PROVIDER_TOKEN).toBe('M12345678901234567890123.abcdef.123456789012345678901234567');
    });
    describe('Strict Validation Rules', () => {
        it('should throw an error when Discord token format is invalid', () => {
            vi.stubEnv('ABC_PROVIDER_TOKEN', 'too-short');
            expect(() => loadConfig()).toThrow(/invalid token format/i);
        });
        it('should throw an error when Gemini API key format is invalid', () => {
            vi.stubEnv('AGENT_API_KEY', 'invalid-key');
            expect(() => loadConfig()).toThrow(/invalid gemini api key/i);
        });
        it('should throw an error when Discord AUTHORIZED_USER_IDS format is invalid', () => {
            vi.stubEnv('AUTHORIZED_USER_IDS', 'abc,123');
            expect(() => loadConfig()).toThrow(/invalid user id format/i);
        });
        it('should default ABC_RESTART_DELAY to 3000', () => {
            // @ts-ignore
            delete process.env.ABC_RESTART_DELAY;
            const config = loadConfig();
            expect(config.ABC_RESTART_DELAY).toBe(3000);
        });
        it('should coerce ABC_RESTART_DELAY to number', () => {
            vi.stubEnv('ABC_RESTART_DELAY', '5000');
            const config = loadConfig();
            expect(config.ABC_RESTART_DELAY).toBe(5000);
        });
    });
    it('should rename AUTHORIZED_USERS to AUTHORIZED_USER_IDS', () => {
        vi.stubEnv('AUTHORIZED_USER_IDS', '123456789012345678,123456789012345679');
        const config = loadConfig();
        // @ts-ignore - checking renamed property
        expect(config.AUTHORIZED_USER_IDS).toBe('123456789012345678,123456789012345679');
        // @ts-ignore - checking that old property is gone
        expect(config.AUTHORIZED_USERS).toBeUndefined();
    });
});
