---
id: US-06-SEC-001
title: Authorized User Whitelist
status: READY
type: feature
---
# Description
As a System Administrator, I want to restrict bridge command execution to a whitelist of authorized User IDs so that unauthorized users cannot spawn or manage agent processes.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/providers/discord-provider.ts
> *   @src/core/config-validator.ts
> *   @src/providers/collaboration-provider.ts

# Acceptance Criteria (DoD)

- [ ] **Scenario 1: Authorized User triggers command**
    - Given a user ID "12345" present in the `AUTHORIZED_USERS` environment variable
    - When the user "12345" sends a slash command
    - Then the command is processed normally
- [ ] **Scenario 2: Unauthorized User triggers command**
    - Given a user ID "67890" NOT present in the `AUTHORIZED_USERS` environment variable
    - When the user "67890" sends a slash command
    - Then the bridge replies with an ephemeral "Not authorized" message
    - And the command callback is NOT executed
- [ ] **Scenario 3: Empty Whitelist**
    - Given the `AUTHORIZED_USERS` environment variable is empty or not set
    - When ANY user sends a slash command
    - Then the bridge allows the command (Default behavior for ease of initial setup)
    - *Decision: PO confirmed that "Allow All" is acceptable when the variable is missing to avoid blocking users during first-time setup.*

# UI element
- Ephemeral error message in Discord: "You are not authorized to use this command."

# Technical Notes (Architect)
- **Refactoring**: Extract the authorization logic from `DiscordProvider.onCommand` into a private method `isAuthorized(userId: string): boolean`.
- **Configuration Alignment**: Architecture doc mentions `AUTHORIZED_USER_IDS`. We currently use `AUTHORIZED_USERS` in `config-validator.ts`. Keep `AUTHORIZED_USERS` for now but update `config-validator.ts` and `DiscordProvider` to handle the case where it might be undefined gracefully.
- **Implementation Detail**:
    - `isAuthorized` should return `true` if `AUTHORIZED_USERS` is not set or empty.
    - If set, it should split by `,`, trim each ID, and check for inclusion.
- **Testing Strategy**:
    - Add unit tests in `tests/unit/discord-provider.test.ts` mocking the `AppConfig`.
    - Test cases: missing env var, empty env var, single user ID, multiple user IDs (with/without spaces), unauthorized user ID.
- **Error Handling**: Ensure the ephemeral reply is sent before returning from `onCommand` to prevent further processing.

# Reviewer Feedback (Reviewer)
