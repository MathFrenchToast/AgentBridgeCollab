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
*   **Status:** IN_PROGRESS
*   **Ref:** @specs/01-PRD.md#feature-collaboration-provider-interface

## [Epic 4] PM2 Orchestration Layer
*   **Goal:** Build the `Orchestrator` to spawn and track Gemini CLI processes via PM2.
*   **Status:** BACKLOG
*   **Ref:** @specs/01-PRD.md#feature-process-orchestration-pm2-integration

## [Epic 5] MCP Server & HITL Tools
*   **Goal:** Integrate the MCP TS SDK and implement `notify_user` and `ask_human` tools.
*   **Status:** BACKLOG
*   **Ref:** @specs/01-PRD.md#feature-mcp-tools

## [Epic 6] Security & Validation
*   **Goal:** Implement Zod-based configuration validation and user whitelisting.
*   **Status:** BACKLOG
*   **Ref:** @specs/03-ARCHITECTURE.md#security
