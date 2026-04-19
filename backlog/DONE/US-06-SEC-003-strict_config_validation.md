---
id: US-06-SEC-003
title: Strict Configuration Validation
status: DONE
type: feature
---
# Description
As a Developer, I want stricter validation for environment variables so that the application fails fast if sensitive configuration is missing or malformed.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/config-validator.ts

# Acceptance Criteria (DoD)

- [x] **Scenario 1: Valid Discord Token**
    - Given a `ABC_PROVIDER_TOKEN` that matches a Discord token format
    - When `loadConfig` is called
    - Then it returns the validated config
- [x] **Scenario 2: Invalid Token Format**
    - Given a `ABC_PROVIDER_TOKEN` that is clearly not a token (e.g., "too-short")
    - When `loadConfig` is called
    - Then it throws a validation error
- [x] **Scenario 3: Malformed AUTHORIZED_USER_IDS**
    - Given `AUTHORIZED_USER_IDS` containing non-numeric characters (for Discord)
    - When `loadConfig` is called
    - Then it throws a validation error
- [x] **Scenario 4: Missing RESTART_DELAY**
    - Given no `ABC_RESTART_DELAY` in environment
    - When `loadConfig` is called
    - Then it returns a default value of 3000ms

# UI element
- None (Console error on startup)

# Technical Notes (Architect)
- **Discord Token Regex**: Use `/^[M-Q][a-zA-Z0-9_-]{23}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{27,38}$/` for `ABC_PROVIDER_TOKEN` when `ABC_PROVIDER` is `discord`.
- **Gemini API Key**: Use `/^AIza[a-zA-Z0-9_-]{35}$/` for `AGENT_API_KEY`.
- **Authorized Users**: For Discord, `AUTHORIZED_USER_IDS` should be a comma-separated list of 17-19 digit strings. Use `.refine()` or a regex to validate the individual IDs after splitting.
- **Restart Delay**: Add `ABC_RESTART_DELAY` with `z.coerce.number().default(3000)`.
- **Naming Consistency**: The architecture doc mentions `DISCORD_TOKEN`, but current implementation uses `ABC_PROVIDER_TOKEN`. We will continue using `ABC_PROVIDER_TOKEN` for consistency with existing `.env.example` but apply the Discord-specific regex validation in the `DiscordSchema`.

# Reviewer Feedback (Reviewer)
The implementation is correct and follows all specifications. Strict regex validation for Discord tokens and Gemini API keys is implemented. `AUTHORIZED_USER_IDS` correctly validates Discord Snowflake IDs. `ABC_RESTART_DELAY` defaults to 3000ms and supports coercion. Tests are comprehensive and pass.
