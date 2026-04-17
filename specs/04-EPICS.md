# Product Epics: Gemini Collaboration Bridge (GCB)

## [Epic 1] Project Initialization & Tooling
*   **Goal:** Set up Node.js/TypeScript environment, `tsconfig.json`, and basic PM2 scripts.
*   **Status:** DONE
*   **Ref:** @specs/03-ARCHITECTURE.md#tech-stack

## [Epic 2] Core Provider Interface
*   **Goal:** Define the `ICollaborationProvider` interface and the platform-agnostic event routing logic.
*   **Status:** DONE
*   **Ref:** @specs/01-PRD.md#feature-collaboration-provider-interface

## [Epic 3] Discord Platform Implementation
*   **Goal:** Fully implement the Discord provider using `discord.js` for channel creation and command handling.
*   **Status:** DONE
*   **Ref:** @specs/01-PRD.md#feature-collaboration-provider-interface

## [Epic 4] PM2 Orchestration Layer
*   **Goal:** Build the `Orchestrator` to spawn and track Gemini CLI processes via PM2.
*   **Status:** DONE
*   **Ref:** @specs/01-PRD.md#feature-process-orchestration-pm2-integration

## [Epic 5] MCP Server & Bridge Logic
*   **Goal:** Implement the `McpBridge` class to integrate the MCP TS SDK, register tools (`notify_user`, `ask_human`), and wire up the provider and orchestrator.
*   **Sub-tasks:**
    *   Initialize MCP Server with Stdio transport.
    *   Register `notify_user` and `ask_human` tools.
    *   Implement logic to extract `projectId` from environment context.
    *   Implement the bridge between Provider commands and Orchestrator actions.
    *   Create the main application entry point (`src/index.ts`).
*   **Status:** IN_PROGRESS
*   **Ref:** @specs/01-PRD.md#feature-mcp-tools

## [Epic 6] Security & Validation
*   **Goal:** Implement Zod-based configuration validation and user whitelisting.
*   **Sub-tasks:**
    *   Implement User ID whitelist check in `DiscordProvider`.
    *   Add project name sanitization in `ProcessOrchestrator`.
    *   Enhance `ConfigValidator` with stricter rules for tokens.
*   **Status:** IN_PROGRESS
*   **Ref:** @specs/03-ARCHITECTURE.md#security
