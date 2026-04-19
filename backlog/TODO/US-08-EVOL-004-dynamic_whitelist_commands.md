---
id: US-08-EVOL-004
title: Dynamic Whitelist Management Commands
status: READY
type: feature
---
# Description
As an Admin, I want to manage authorized users at runtime via commands so that I can control access without modifying environment variables or restarting the bridge.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/state-store.ts
> *   @src/providers/discord-provider.ts

# Acceptance Criteria (DoD)

- [ ] **Scenario 1: Adding a user to the whitelist**
    - Given an authorized admin user
    - When they type `/whitelist add @user`
    - Then the user ID should be added to the `StateStore` and they should now be able to run commands.
- [ ] **Scenario 2: Removing a user from the whitelist**
    - Given an authorized admin user
    - When they type `/whitelist remove @user`
    - Then the user ID should be removed from the `StateStore` and they should no longer be able to run commands.
- [ ] **Scenario 3: Persistence across restarts**
    - Given the whitelist has been modified via commands
    - When the bridge is restarted
    - Then the updated whitelist should be loaded from the `StateStore`.

# Technical Notes (Architect)
- Update `StateStore` schema to include an `authorized_users` table.
- Implement command routing for `/whitelist` in `DiscordProvider` (and `SlackProvider`).
- Ensure the initial whitelist from `.env` is seeded into the database if empty.
