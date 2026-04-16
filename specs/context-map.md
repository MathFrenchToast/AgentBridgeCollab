# Context Map
> **Note:** This file maps Business Features to Source Code. The Architect updates this when files are added/moved. Use this to find where code lives without searching.

## Feature Map

| Feature / Module | Key Files / Directories | Entry Point |
| :--- | :--- | :--- |
| **Core Orchestration** | `src/core/process-orchestrator.ts` | `src/core/process-orchestrator.ts` |
| **MCP Bridge** | `src/core/mcp-bridge.ts` | `src/core/mcp-bridge.ts` |
| **Provider Abstraction** | `src/providers/collaboration-provider.ts` | `src/providers/collaboration-provider.ts` |
| **Discord Provider** | `src/providers/discord-provider.ts` | `src/providers/discord-provider.ts` |
| **Config & Validation** | `src/core/config-validator.ts` | `src/core/config-validator.ts` |
| **Type Definitions** | `src/types/` | `src/types/index.ts` |

## Dependency Graph
*   `src/core/mcp-bridge.ts` depends on `src/providers/collaboration-provider.ts` (via Dependency Injection) and `src/core/process-orchestrator.ts`.
*   `src/providers/discord-provider.ts` implements `src/providers/collaboration-provider.ts`.
*   `src/core/process-orchestrator.ts` interacts with the host OS via `pm2` and `child_process`.
*   All modules depend on `src/core/config-validator.ts` for validated environment settings.
