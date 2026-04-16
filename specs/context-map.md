# Context Map
> **Note:** This file maps Business Features to Source Code. The Architect updates this when files are added/moved. Use this to find where code lives without searching.

## Feature Map

| Feature / Module | Key Files / Directories | Entry Point |
| :--- | :--- | :--- |
| **Core Orchestration** | `src/core/Orchestrator.ts` | `src/core/Orchestrator.ts` |
| **MCP Bridge** | `src/core/Bridge.ts` | `src/core/Bridge.ts` |
| **Provider Abstraction** | `src/providers/IProvider.ts` | `src/providers/IProvider.ts` |
| **Discord Provider** | `src/providers/Discord.ts` | `src/providers/Discord.ts` |
| **Config & Validation** | `src/core/Config.ts` | `src/core/Config.ts` |
| **Type Definitions** | `src/types/` | `src/types/index.ts` |

## Dependency Graph
*   `src/core/Bridge.ts` depends on `src/providers/IProvider.ts` (via Dependency Injection) and `src/core/Orchestrator.ts`.
*   `src/providers/Discord.ts` implements `src/providers/IProvider.ts`.
*   `src/core/Orchestrator.ts` interacts with the host OS via `pm2` and `child_process`.
*   All modules depend on `src/core/Config.ts` for validated environment settings.
