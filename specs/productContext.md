# Product Context

## 1. Project Identity
*   **Name:** Gemini Collaboration Bridge (GCB)
*   **Core Value:** Provide a secure, observable, and remote-controllable interface for autonomous Gemini CLI agents via standard collaboration platforms (Discord, Slack, Teams).
*   **Target Audience:** DevOps engineers, AI researchers, and developers running autonomous agents in sandboxed environments.

## 2. High-Level Architecture
*   **Type:** MCP Server / Orchestration Bridge (Node.js/TypeScript)
*   **Tech Stack:**
    *   **Runtime:** Node.js 20+ (LTS)
    *   **Language:** TypeScript
    *   **MCP SDK:** @modelcontextprotocol/sdk
    *   **Platforms:** discord.js (Initial Provider)
    *   **Process Manager:** PM2 (Standard process lifecycle & logging)
*   **Key Patterns:**
    *   **Provider Pattern:** Decoupling the collaboration platform (Discord/Slack) from the core MCP logic.
    *   **Clean Architecture:** Using Interfaces and Dependency Injection for platform-specific implementations.
    *   **Event-Driven:** Using Node.js `EventEmitter` for real-time status routing.

## 3. Core Domain Flows
1.  **Project Initiation:** User sends `/start <name> <prompt>` in Discord -> GCB creates a project-specific channel -> GCB spawns a PM2 process running Gemini CLI -> Gemini connects back to GCB via MCP stdio.
2.  **Human-in-the-Loop (HITL):** Gemini calls `ask_human` tool -> GCB pauses execution -> GCB pings the user in the project channel -> User replies -> GCB returns the input to Gemini via standard JSON-RPC.
3.  **Real-time Observability:** Gemini emits logs to stdout/stderr -> PM2 captures logs -> GCB streams them to the corresponding platform channel/thread.
