---
id: US-07-PERS-002
title: Persist Project and Space Mappings
status: DONE
type: feature
---
# Description
As a System, I want to persist the mapping between projects and their communication spaces (Discord channels) so that I can correctly route messages after a reboot.

# Context Map
- @src/core/state-store.ts
- @src/core/mcp-bridge.ts
- @src/providers/discord-provider.ts

# Acceptance Criteria (DoD)

- [x] **Scenario 1: Save Mapping on Creation**
    - Given a new project is started via Discord
    - When the channel is created and the process spawned
    - Then the `StateStore` should save the `projectId`, `channelId`, and `pm2Id` mapping.
- [x] **Scenario 2: Retrieve Mapping for Routing**
    - Given an incoming MCP notification from an agent
    - When the Bridge looks up the project
    - Then it should retrieve the correct `channelId` from the `StateStore` even if the in-memory cache is empty.
- [x] **Scenario 3: Cleanup on Project Stop**
    - Given the `/stop` command is issued
    - When the project is deleted
    - Then the `StateStore` should mark the project as 'stopped' or remove the mapping.

# Technical Notes (Architect)
- Implement `saveMapping(projectId, channelId, metadata)` and `getMapping(projectId)` in `StateStore`.
- Ensure atomic transactions when updating project status and space mappings.
