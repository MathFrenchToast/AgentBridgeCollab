---
id: US-05-MCP-011
title: Bidirectional MCP Routing
status: DONE
type: feature
---
# Description
As a Bridge, I want to route MCP JSON-RPC messages between the Gemini CLI and the internal MCP Server instances so that the agent can call tools and receive responses over the stdio-to-IPC bridge.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/core/mcp-bridge.ts: Main entry point for MCP Server multiplexing.
> *   @src/core/process-orchestrator.ts: Provides the `sendToProcess` method and log streaming.
> *   @src/core/launcher.ts: Receives IPC messages (topic `abc:stdin`) and writes to agent `stdin`.
> *   @specs/03-ARCHITECTURE.md (Section 4.5): Architectural blueprint for bidirectional communication.

# Acceptance Criteria (DoD)
- [x] **Scenario 1: Inbound Path (Agent to Bridge)**
    - Given a Gemini CLI process managed by ABC
    - When the agent writes an MCP JSON-RPC message to its `stdout`
    - Then the `ProcessOrchestrator` should capture it as a log line
    - And the `McpBridge` should detect it as a JSON-RPC message
    - And route it to the `handleMessage` method of the corresponding `McpServer` instance.
- [x] **Scenario 2: Outbound Path (Bridge to Agent)**
    - Given an `McpServer` instance processing a request
    - When the server generates a JSON-RPC response or notification
    - Then the `McpBridge` should capture the output
    - And call `orchestrator.sendToProcess(projectId, data)` to forward it to the agent via IPC.
- [x] **Scenario 3: Protocol Filtering**
    - Given standard `stdout` from the agent (not MCP protocol)
    - When the bridge processes logs
    - Then it should continue to route them to the collaboration platform (as per US-05-MCP-006) without passing them to the MCP Server.
- [x] **Scenario 4: Project Context Routing**
    - Given multiple project processes are running
    - When an MCP message is received from a process
    - Then the bridge should ensure it is routed to the server instance specifically associated with that `projectId`.

# Technical Notes (Architect)
- **JSON-RPC Detection**: Implement a robust detection mechanism in `McpBridge`. Any log line that is valid JSON and contains `"jsonrpc": "2.0"` should be intercepted.
- **Custom Transport**: Implement `IpcTransport` (or similar name) extending `@modelcontextprotocol/sdk`'s `Transport`.
    - `send(message)`: Calls `orchestrator.sendToProcess(projectId, JSON.stringify(message))`.
    - `onData`: Triggered when `McpBridge` parses an inbound JSON-RPC message.
- **IPC Topic**: Ensure the communication uses the `abc:stdin` topic as defined in Architecture Section 4.5.
- **Multiplexing**: The `McpBridge` must maintain a `Map<string, McpServer>` to ensure strict isolation between project sessions.
- **Lifecycle Management**:
    - `McpServer` instances should be created upon project start.
    - Resources must be cleaned up (closed/destroyed) when a project is stopped or the process exits.
- **Error Handling**: Log failures to parse JSON or send IPC messages without crashing the main bridge process.
