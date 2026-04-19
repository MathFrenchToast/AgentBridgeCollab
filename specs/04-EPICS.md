# Product Epics: Agent Bridge Collaboration (ABC)

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
*   **Goal:** Build the `Orchestrator` to spawn and track agent processes via PM2.
*   **Status:** DONE
*   **Ref:** @specs/01-PRD.md#feature-process-orchestration-pm2-integration

## [Epic 5] MCP Server & Bridge Logic
*   **Goal:** Implement the `McpBridge` class to integrate the MCP TS SDK, register tools (`notify_user`, `ask_human`), and wire up the provider and orchestrator.
*   **Sub-tasks:**
    *   Initialize MCP Server with Stdio transport.
    *   Register `notify_user` and `ask_human` tools.
    *   Implement logic to extract `projectId` from environment context.
    *   Implement the bridge between Provider commands and Orchestrator actions.
    *   Implement Stdio Bridge (Launcher Shim) for bidirectional communication.
    *   Create the main application entry point (`src/index.ts`).
*   **Status:** DONE
*   **Ref:** @specs/01-PRD.md#feature-mcp-tools

## [Epic 6] Security & Validation
*   **Goal:** Implement Zod-based configuration validation and user whitelisting.
*   **Sub-tasks:**
    *   Implement User ID whitelist check in `DiscordProvider`.
    *   Add project name sanitization in `ProcessOrchestrator`.
    *   Enhance `ConfigValidator` with stricter rules for tokens.
*   **Status:** DONE
*   **Ref:** @specs/03-ARCHITECTURE.md#security

## [Epic 7] Persistence & State Management
*   **Goal:** Move beyond PM2 as the sole source of truth and implement a lightweight persistence layer for session tracking and multi-provider mapping.
*   **Sub-tasks:**
    *   Implement a `StateStore` abstraction (e.g., using SQLite or Lowdb).
    *   Persist project-to-channel mappings and user metadata.
    *   Track session start/end times and command history.
    *   Refactor `ProcessOrchestrator` to sync with the `StateStore` on startup.
*   **Status:** DONE
*   **Ref:** @specs/03-ARCHITECTURE.md#persistence-layer

## [Epic 8] Maintenance & Evolution
*   **Goal:** Enhance platform support, improve developer experience, and refine the security model.
*   **Sub-tasks:**
    *   **Slack Provider Implementation:** Implement `SlackProvider` using the Bolt SDK to support multi-platform requirements.
    *   **Test Suite Migration:** Migrate all remaining `.js` test files to `.ts` and remove redundant JS tests to ensure a unified TypeScript testing environment.
    *   **Enhanced Discord UX:** Integrate Discord Buttons and Select Menus for common actions (e.g., stop, restart, HITL acknowledgment) to improve interactivity.
    *   **Dynamic Authorization Management:** Add administrative commands (e.g., `/whitelist add/remove`) to manage authorized users at runtime, persisting changes in `StateStore`.
    *   **Agent Health Monitoring:** Implement heartbeat checks and auto-detection of hung processes in the `ProcessOrchestrator`.
    *   **Onboarding & Documentation:** Create comprehensive guides for Discord server setup, bot installation, and first-step procedures as defined in PRD.
*   **Status:** IN_PROGRESS
*   **Ref:** @specs/01-PRD.md#feature-advanced-orchestration-security
