---
id: US-03-DISC-003
title: Implement Discord Messaging and Input Polling
status: READY
type: feature
---
# Description
As a Developer, I want the Discord Provider to send messages to project channels and wait for human input so that agents can output logs and ask for HITL intervention.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   `src/providers/discord-provider.ts`

# Acceptance Criteria (DoD)
- [ ] **Scenario 1: Send Message**
    - Given a valid `spaceId` (channel ID) and a text `content`
    - When `sendMessage(spaceId, content)` is called
    - Then the message should be successfully posted to the corresponding Discord channel using a blue Embed for info.
- [ ] **Scenario 2: Wait For Input (Happy Path)**
    - Given a valid `spaceId` and a `prompt`
    - When `waitForInput(spaceId, prompt)` is called
    - Then the bot should post the prompt in a Yellow Embed with "WAITING FOR INPUT".
    - And it should pause execution until a user replies in that specific channel.
    - And it should return the user's message content.
- [ ] **Scenario 3: Wait For Input Timeout**
    - Given a `waitForInput` call
    - When no user replies within a default configured timeout (e.g., 30 minutes)
    - Then the method should reject/throw a timeout error to prevent hanging indefinitely.

# UI element
- **Information/Logs:** Blue sidebar Embeds.
- **HITL Request:** Yellow sidebar Embed with a "WAITING FOR INPUT" header.

# Technical Notes (Architect)
- **Messaging:** Use `TextChannel.send({ embeds: [...] })`.
- **Embeds:** Use `EmbedBuilder` from `discord.js`. Map info/logs to blue (`#0099ff`), warnings/errors to red (`#ff0000`), and HITL requests to yellow (`#ffff00`).
- **Input Polling:** Use `TextChannel.awaitMessages()` for `waitForInput()`.
- **Filter:** The filter for `awaitMessages` MUST verify `m.author.id !== client.user.id` to prevent the bot from responding to itself.
- **Timeout:** Set the `time` option in `awaitMessages` (e.g., `30 * 60 * 1000` ms) and handle the `Collection` size being 0 as a Timeout Error.

# Reviewer Feedback (Reviewer)
<!-- If status is REWORK, details on what failed (AT or Code Quality) -->
