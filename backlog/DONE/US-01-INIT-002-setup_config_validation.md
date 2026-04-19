---
id: US-01-INIT-002
title: Environment Configuration and Zod Validation
status: DONE
type: feature
---
# Description
As a developer, I want to implement environment variable loading (dotenv) and runtime validation (zod) so that the application fails fast if the required configuration is missing or malformed.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   `src/core/Config.ts`
> *   `.env.example`

# Acceptance Criteria (DoD)
<!-- 
Must be testable and binary (Pass/Fail).
Include Success, Error, and Edge cases.
-->

- [x] **Scenario 1:** Valid Configuration
    - Given a `.env` file with all required variables (e.g., `ABC_PROVIDER`)
    - When the application configuration is initialized
    - Then `zod` successfully parses and returns a strongly-typed config object.
- [x] **Scenario 2:** Missing Configuration
    - Given an empty or missing `.env` file
    - When the application configuration is initialized
    - Then `zod` throws a descriptive error detailing which variables are missing, and the initialization fails.
- [x] **Scenario 3:** Example File
    - Given the repository root
    - When I look for environment templates
    - Then an `.env.example` file exists containing keys for the required configuration.

# UI element
None.

# Technical Notes (Architect)
- **Validation Strategy:** Use `zod` to define a strict schema for all environment variables.
- **Required Variables:**
    - `ABC_PROVIDER`: Must be one of `discord`, `slack`, or `teams`.
    - `ABC_PROVIDER_TOKEN`: Required string.
    - `AGENT_API_KEY`: Required string (for the bridge to pass to Gemini CLI if needed).
    - **Provider-Specific Validation:** Use Zod's `refine` or `discriminatedUnion` if possible, otherwise simple requirements for now:
        - `DISCORD_GUILD_ID`: Required if `ABC_PROVIDER` is `discord`.
        - `DISCORD_CATEGORY_ID`: Required if `ABC_PROVIDER` is `discord`.
- **Implementation:**
    - Load `.env` using `dotenv` inside `src/core/Config.ts`.
    - Export an `AppConfig` type: `type AppConfig = z.infer<typeof ConfigSchema>`.
    - Implement a `loadConfig()` function that returns the validated object or exits with a clean error message.
- **Security:** Ensure `.env` is in `.gitignore` (should be handled in a separate story or already present).
- **Testing:** Mock `process.env` in tests to verify different validation scenarios.


# Reviewer Feedback (Reviewer)
<!-- If status is REWORK, details on what failed (AT or Code Quality) -->
