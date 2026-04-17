import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

const BaseSchema = z.object({
  GCB_PROVIDER_TOKEN: z.string().min(1, 'GCB_PROVIDER_TOKEN is required'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  AUTHORIZED_USERS: z.string().optional(),
  GCB_ASK_TIMEOUT: z.coerce.number().default(1800000), // Default: 30 minutes
});

const DiscordSchema = BaseSchema.extend({
  GCB_PROVIDER: z.literal('discord'),
  DISCORD_GUILD_ID: z.string().min(1, 'DISCORD_GUILD_ID is required for Discord provider'),
  DISCORD_CATEGORY_ID: z.string().min(1, 'DISCORD_CATEGORY_ID is required for Discord provider'),
});

const SlackSchema = BaseSchema.extend({
  GCB_PROVIDER: z.literal('slack'),
});

const TeamsSchema = BaseSchema.extend({
  GCB_PROVIDER: z.literal('teams'),
});

const ConfigSchema = z.discriminatedUnion('GCB_PROVIDER', [
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
