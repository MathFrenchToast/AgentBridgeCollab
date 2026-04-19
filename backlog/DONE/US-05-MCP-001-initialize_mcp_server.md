---
id: US-05-MCP-001
title: Initialize MCP Server with Multi-client Support
status: DONE
type: feature
---
# Description
As a Developer, I want to initialize an MCP Server so that multiple Gemini CLI instances can communicate with the bridge using the Model Context Protocol.

# Context Map
- `src/core/mcp-bridge.ts`: Main implementation of the McpBridge and server management logic.
- `src/types/index.ts`: Shared types for ABC events and commands.
- `specs/03-ARCHITECTURE.md`: Technical reference for MCP flow.

# Acceptance Criteria (DoD)
- [x] **Scenario 1: Successful Server Initialization**
    - Given the application is starting
    - When the `McpBridge` is instantiated
    - Then it should be ready to create `McpServer` instances with name "Gemini-Collaboration-Bridge" and version "1.0.0"
- [x] **Scenario 2: Capability Registration**
    - Given an initialized `McpServer`
    - When capabilities are checked
    - Then it should have `tools` capability enabled
- [x] **Scenario 3: Transport Flexibility**
    - Given a new Gemini CLI process is spawned
    - When the bridge connects to it
    - Then it should be able to handle separate Stdio streams for each process (multiplexing or multiple transports)

# Technical Notes (Architect)
- Use `@modelcontextprotocol/sdk` (version 0.6.0+).
- Implement `McpBridge` as a manager for multiple `Server` instances.
- For each project (`projectId`), instantiate a new `Server` from the SDK.
- Use `StdioServerTransport` to communicate with the spawned Gemini CLI processes.
- The `McpBridge` must provide a way to register tools (like `notify_user` and `ask_human`) to all server instances.
- Ensure proper lifecycle management: when a process stops, its corresponding MCP server and transport must be cleaned up.
- Reference `specs/03-ARCHITECTURE.md` section 4.3 for tool definitions.
