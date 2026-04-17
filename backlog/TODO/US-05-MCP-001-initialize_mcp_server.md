---
id: US-05-MCP-001
title: Initialize MCP Server with Stdio Transport
status: READY
type: feature
---
# Description
As a Developer, I want to initialize an MCP Server with Stdio transport so that the Gemini CLI can communicate with the bridge using the Model Context Protocol.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   `src/core/mcp-bridge.ts`: Implementation of the McpBridge class.
> *   `src/types/index.ts`: Shared types for GCB events and commands.
> *   `src/providers/collaboration-provider.ts`: Interface for dependency injection.
> *   `src/core/process-orchestrator.ts`: Orchestrator for dependency injection.

# Acceptance Criteria (DoD)
- [ ] **Scenario 1: Successful Initialization**
    - Given the application is starting
    - When the `McpBridge` is instantiated
    - Then it should initialize an `McpServer` instance with the name "Gemini-Collaboration-Bridge"
- [ ] **Scenario 2: Stdio Transport Connection**
    - Given an initialized `McpServer`
    - When the `connect` method is called
    - Then it should use the `StdioServerTransport` for communication

# Technical Notes (Architect)
- **Class Definition**: `McpBridge` must implement the MCP Server lifecycle.
- **Dependency Injection**: The constructor must accept `ICollaborationProvider` and `ProcessOrchestrator` instances.
- **MCP SDK usage**:
    - Use `import { Server } from "@modelcontextprotocol/sdk/server/index.js"`
    - Use `import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"`
- **Initialization**:
    - Initialize `this.server = new Server({ name: 'Gemini-Collaboration-Bridge', version: '1.0.0' }, { capabilities: { tools: {} } })`
- **Connection**:
    - `public async connect(): Promise<void>` should create a new `StdioServerTransport()` and call `this.server.connect(transport)`.
- **Error Handling**: Catch and log any initialization errors using a standardized format.
