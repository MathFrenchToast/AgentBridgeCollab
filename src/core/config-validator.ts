import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

const DISCORD_TOKEN_REGEX = /^[M-Q][a-zA-Z0-9_-]{23}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{27,38}$/;
const AGENT_API_KEY_REGEX = /^AIza[a-zA-Z0-9_-]{35}$/;
const DISCORD_USER_ID_REGEX = /^\d{17,19}$/;

const BaseSchema = z.object({
  ABC_PROVIDER_TOKEN: z.string().min(1, 'ABC_PROVIDER_TOKEN is required'),
  AGENT_API_KEY: z.string().regex(AGENT_API_KEY_REGEX, 'Invalid Agent API key format').optional(),
  AUTHORIZED_USER_IDS: z.string().optional(),
  ABC_ASK_TIMEOUT: z.coerce.number().default(1800000), // Default: 30 minutes
  ABC_RESTART_DELAY: z.coerce.number().default(3000), // Default: 3 seconds
  DATABASE_PATH: z.string().default('./abc.sqlite'),
});

const DiscordSchema = BaseSchema.extend({
  ABC_PROVIDER: z.literal('discord'),
  ABC_PROVIDER_TOKEN: z.string().regex(DISCORD_TOKEN_REGEX, 'Invalid token format for Discord'),
  AUTHORIZED_USER_IDS: z.string().optional()
    .refine((val) => {
      if (!val) return true;
      return val.split(',').every(id => DISCORD_USER_ID_REGEX.test(id.trim()));
    }, 'Invalid user ID format. Must be a comma-separated list of 17-19 digit strings.'),
  DISCORD_GUILD_ID: z.string().min(1, 'DISCORD_GUILD_ID is required for Discord provider'),
  DISCORD_CATEGORY_ID: z.string().min(1, 'DISCORD_CATEGORY_ID is required for Discord provider'),
});

const SlackSchema = BaseSchema.extend({
  ABC_PROVIDER: z.literal('slack'),
  ABC_PROVIDER_TOKEN: z.string().regex(/^xoxb-/, 'Invalid token format for Slack (must start with xoxb-)'),
  SLACK_APP_TOKEN: z.string().regex(/^xapp-/, 'Invalid SLACK_APP_TOKEN format (must start with xapp-)'),
  SLACK_CHANNEL_ID: z.string().min(1, 'SLACK_CHANNEL_ID is required for Slack provider'),
  AUTHORIZED_USER_IDS: z.string().optional()
    .refine((val) => {
      if (!val) return true;
      return val.split(',').every(id => /^[UW][A-Z0-9]+$/.test(id.trim()));
    }, 'Invalid user ID format for Slack. Must be a comma-separated list of Slack User IDs (e.g., U12345678).'),
});

const TeamsSchema = BaseSchema.extend({
  ABC_PROVIDER: z.literal('teams'),
});

const ConfigSchema = z.discriminatedUnion('ABC_PROVIDER', [
  DiscordSchema,
  SlackSchema,
  TeamsSchema,
]);

/**
 * Validated Application Configuration Type
 */
export type AppConfig = z.infer<typeof ConfigSchema>;

/**
 * Loads and validates the application configuration from environment variables.
 * @throws {Error} if the configuration is invalid.
 */
export const loadConfig = (): AppConfig => {
  const result = ConfigSchema.safeParse(process.env);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    throw new Error(`Configuration validation failed: ${errorMessages}`);
  }

  return result.data;
};
