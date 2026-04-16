---
id: US-03-DISC-002
title: Implement Discord Channel Creation (createSpace)
status: DONE
type: feature
---
# Description
As a Developer, I want the Discord Provider to create dedicated project channels under a specific category so that agent interactions are properly isolated.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   `src/providers/discord-provider.ts`

# Acceptance Criteria (DoD)
- [x] **Scenario 1: Successful Channel Creation**
    - Given a valid `projectId` and an active Discord connection
    - When `createSpace(projectId)` is called
    - Then a new text channel named after the `projectId` must be created under the Category ID defined in the configuration.
    - And the method should return the new channel's ID.
- [x] **Scenario 2: Missing Category Config**
    - Given that `DISCORD_CATEGORY_ID` is invalid or the category doesn't exist
    - When `createSpace(projectId)` is called
    - Then an error should be thrown indicating the category could not be found.

# UI element
None.

# Technical Notes (Architect)
- **Discord API:** Use `Guild.channels.create()` from `discord.js`.
- **Channel Type:** Ensure the created channel is a `ChannelType.GuildText`.
- **Parent ID:** Set the `parent` property in the create options to `config.DISCORD_CATEGORY_ID`.
- **Sanitization:** The `projectId` should be used directly as the channel name. Discord automatically converts channel names to kebab-case (e.g., `Project Name` becomes `project-name`).
- **Testing:** Mock the `Guild.channels.create` method and verify the parameters passed to it.

# Reviewer Feedback (Reviewer)
<!-- If status is REWORK, details on what failed (AT or Code Quality) -->
