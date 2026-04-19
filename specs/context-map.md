# Context Map
> **Note:** This file maps Business Features to Source Code. The Architect updates this when files are added/moved. Use this to find where code lives without searching.

## Feature Map

| Feature / Module | Key Files / Directories | Entry Point |
| :--- | :--- | :--- |
| **Core Orchestration** | `src/core/process-orchestrator.ts`, `src/core/launcher.ts` | `src/core/process-orchestrator.ts` |
| **MCP Bridge** | `src/core/mcp-bridge.ts` | `src/core/mcp-bridge.ts` |
| **Provider Abstraction** | `src/providers/collaboration-provider.ts` | `src/providers/collaboration-provider.ts` |
| **Discord Provider** | `src/providers/discord-provider.ts` | `src/providers/discord-provider.ts` |
| **Slack Provider (Planned)** | `src/providers/slack-provider.ts` | `src/providers/slack-provider.ts` |
| **Config & Validation** | `src/core/config-validator.ts` | `src/core/config-validator.ts` |
| **Security & Authorization** | `src/core/state-store.ts`, `src/providers/discord-provider.ts` | `src/core/state-store.ts` |
| **Persistence** | `src/core/state-store.ts` | `src/core/state-store.ts` |
| **Type Definitions** | `src/types/` | `src/types/index.ts` |

## Dependency Graph
*   `src/core/mcp-bridge.ts` depends on `src/providers/collaboration-provider.ts` (via Dependency Injection) and `src/core/process-orchestrator.ts`.
*   `src/providers/discord-provider.ts` implements `src/providers/collaboration-provider.ts`.
*   `src/core/process-orchestrator.ts` interacts with the host OS via `pm2` and `child_process`.
*   All modules depend on `src/core/config-validator.ts` for validated environment settings.
