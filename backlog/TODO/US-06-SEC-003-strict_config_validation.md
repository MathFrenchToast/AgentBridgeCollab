---
id: US-06-SEC-003
title: Strict Configuration Validation
status: READY
type: feature
---
# Description
As a Developer, I want stricter validation for environment variables so that the application fails fast if sensitive configuration is missing or malformed.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/config-validator.ts

# Acceptance Criteria (DoD)

- [ ] **Scenario 1: Valid Discord Token**
    - Given a `GCB_PROVIDER_TOKEN` that matches a Discord token format
    - When `loadConfig` is called
    - Then it returns the validated config
- [ ] **Scenario 2: Invalid Token Format**
    - Given a `GCB_PROVIDER_TOKEN` that is clearly not a token (e.g., "too-short")
    - When `loadConfig` is called
    - Then it throws a validation error
- [ ] **Scenario 3: Malformed AUTHORIZED_USERS**
    - Given `AUTHORIZED_USERS` containing non-numeric characters (for Discord)
    - When `loadConfig` is called
    - Then it throws a validation error

# UI element
- None (Console error on startup)

# Technical Notes (Architect)
- Use Zod's `.regex()` to validate token formats if possible.
- For `AUTHORIZED_USERS`, validate it's a comma-separated string of numbers when `GCB_PROVIDER` is 'discord'.
- Ensure `GEMINI_API_KEY` also has basic format validation.

# Reviewer Feedback (Reviewer)
