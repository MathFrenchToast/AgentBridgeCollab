---
id: US-03-DISC-004
title: Implement Discord Slash Command Handling
status: READY
type: feature
---
# Description
As a Developer, I want the Discord Provider to listen for slash commands and route them to the bridge so that users can control agent processes.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   `src/providers/discord-provider.ts`

# Acceptance Criteria (DoD)
- [ ] **Scenario 1: Command Routing**
    - Given the Discord Provider is connected
    - When a user triggers a registered slash command (e.g., `/start <id> <prompt>`)
    - Then the provider should parse the interaction and invoke the callback registered via `onCommand()`.
    - And the payload must match the `GcbCommand` interface structure.
- [ ] **Scenario 2: Unauthorized User (Provider-Level Check)**
    - Given a whitelist of authorized users or a mechanism to forward the `userId`
    - When an unauthorized user triggers a command
    - Then the command should be rejected and an error should be returned to the user indicating lack of permissions.

# UI element
None.

# Technical Notes (Architect)
- **Event Listener:** Use `Client.on('interactionCreate', ...)` to intercept slash commands.
- **Check Type:** Ensure `interaction.isChatInputCommand()` before processing.
- **Payload Mapping:** Map Discord's `CommandInteraction` to `GcbCommand`:
  - `type`: Map `interaction.commandName` (start, stop, status, list).
  - `projectId`: Extract from `interaction.options.getString('id')`.
  - `args`: Extract the prompt or other options as needed.
  - `userId`: `interaction.user.id`.
  - `channelId`: `interaction.channelId`.
- **Response:** Command interactions MUST be acknowledged (e.g., `interaction.reply()` or `interaction.deferReply()`) to prevent Discord from showing "The application did not respond".

# Reviewer Feedback (Reviewer)
<!-- If status is REWORK, details on what failed (AT or Code Quality) -->
