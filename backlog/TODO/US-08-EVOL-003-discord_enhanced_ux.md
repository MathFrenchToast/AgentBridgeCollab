---
id: US-08-EVOL-003
title: Enhanced Discord UX with Buttons/Menus
status: READY
type: feature
---
# Description
As a User, I want to interact with my agent via Discord buttons and menus so that I can perform common actions (stop, restart, HITL) without typing commands.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/providers/discord-provider.ts

# Acceptance Criteria (DoD)

- [ ] **Scenario 1: Interactive buttons for project management**
    - Given an active project channel
    - When a status or log message is sent
    - Then it should include buttons for "Stop" and "Restart".
- [ ] **Scenario 2: HITL acknowledgment via buttons**
    - Given the bridge triggers `ask_human`
    - When the prompt is sent to Discord
    - Then it should include interactive elements (e.g., "Confirm", "Cancel") if applicable to the prompt context.
- [ ] **Scenario 3: Action handling**
    - Given a user clicks a "Stop" button
    - When the interaction is received by ABC
    - Then it should trigger the same logic as the `/stop` command.

# Technical Notes (Architect)
- Use `discord.js` `ActionRowBuilder`, `ButtonBuilder`, and `StringSelectMenuBuilder`.
- Ensure interaction listeners are correctly registered and mapped to project IDs.
