---
id: US-06-SEC-001
title: Authorized User Whitelist
status: DONE
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

- [x] **Scenario 1: Authorized User triggers command**
    - Given a user ID "12345" present in the `AUTHORIZED_USER_IDS` environment variable
    - When the user "12345" sends a slash command
    - Then the command is processed normally
- [x] **Scenario 2: Unauthorized User triggers command**
    - Given a user ID "67890" NOT present in the `AUTHORIZED_USER_IDS` environment variable
    - When the user "67890" sends a slash command
    - Then the bridge replies with an ephemeral "Not authorized" message
    - And the command callback is NOT executed
- [x] **Scenario 3: Empty Whitelist**
    - Given the `AUTHORIZED_USER_IDS` environment variable is empty or not set
    - When ANY user sends a slash command
    - Then the bridge allows the command (Default behavior for ease of initial setup)
    - *Decision: PO confirmed that "Allow All" is acceptable when the variable is missing to avoid blocking users during first-time setup.*

# UI element
- Ephemeral error message in Discord: "You are not authorized to use this command."

# Technical Notes (Architect)
- **Configuration Alignment**: Rename `AUTHORIZED_USERS` to `AUTHORIZED_USER_IDS` in `src/core/config-validator.ts` and `.env.example` to match the Technical Architecture (Section 6.1).
- **Refactoring**: 
    - Extract the authorization logic from `DiscordProvider.onCommand` into a private method `isAuthorized(userId: string): boolean`.
    - This method should be called early in the interaction listener.
- **Implementation Detail**:
    - `isAuthorized` should return `true` if `AUTHORIZED_USER_IDS` is not set or is an empty string (as per Scenario 3).
    - If set, it should split the string by `,`, trim each entry, and check if `userId` exists in the resulting array.
- **Audit Logging**: As per Architecture Section 6.1, log a warning message when an unauthorized user attempts to use a command: `[Security] Unauthorized access attempt by user ID: ${userId}`.
- **Testing Strategy**:
    - Add comprehensive unit tests in `tests/unit/discord-provider.test.ts`.
    - Ensure `loadConfig` tests in `tests/unit/config.test.ts` are updated to reflect the rename.
- **Error Handling**: 
    - Use `interaction.reply({ content: '...', ephemeral: true })` for unauthorized users.
    - Ensure no further logic (like `interaction.deferReply()`) is executed for unauthorized users.

# Reviewer Feedback (Reviewer)
The implementation is 100% compliant with the requirements. The refactoring of `isAuthorized` into a private method makes the code cleaner and easier to test. The security logging and ephemeral responses are correctly implemented. Comprehensive unit tests cover all scenarios, including the "Allow All" default behavior.
