# Technical Architecture: Gemini Collaboration Bridge (GCB)

## 1. Tech Stack
*   **Runtime:** Node.js 20+ (LTS)
*   **Language:** TypeScript 5.4+
*   **MCP SDK:** `@modelcontextprotocol/sdk`
*   **Discord SDK:** `discord.js`
*   **Process Manager:** `pm2` (via `@pm2/io` or direct CLI interaction)
*   **Configuration:** `dotenv` + `zod` for validation.
*   **Tooling:** `tsx` for development, `vitest` for testing.

## 2. Directory Structure & Modules
```
/src
├── providers/              # Platform-specific logic (Discord, Slack, Teams)
│   ├── collaboration-provider.ts # Generic Provider Interface
│   └── discord-provider.ts       # Discord-specific implementation
├── core/
│   ├── mcp-bridge.ts       # MCP Server initialization & tool registration
│   ├── process-orchestrator.ts # PM2 process management logic
│   └── config-validator.ts # Zod-validated environment settings
├── types/                  # Shared TypeScript interfaces & types
│   └── index.ts
├── index.ts                # Application Entry point
└── tests/                  # Vitest suite
```

## 3. Naming Conventions
*   **Classes/Interfaces:** PascalCase (`DiscordProvider`, `IMcpBridge`)
*   **Functions/Variables:** camelCase (`requestInput`, `activePid`)
*   **Constants:** SCREAMING_SNAKE_CASE (`DISCORD_TOKEN`)
*   **Files:** kebab-case (`discord-provider.ts`, `process-orchestrator.ts`)
*   **Interfaces:** Prefix with `I` (`ICollaborationProvider`)

## 4. Patterns & Standards

### 4.1 ICollaborationProvider Interface
Every platform (Discord, Slack, etc.) MUST implement this interface to ensure the Bridge Core remains platform-agnostic:
```typescript
export type GcbCommandType = 'start' | 'stop' | 'status' | 'list';

export interface GcbCommand {
  type: GcbCommandType;
  projectId?: string;
  args?: string[];
  userId: string;
  channelId: string;
}

export interface ICollaborationProvider {
  /** Initialize connection to the platform */
  connect(): Promise<void>;
  /** Gracefully disconnect from the platform */
  disconnect(): Promise<void>;
  /** Create a dedicated space for a project (e.g., Discord Channel or Slack Thread) */
  createSpace(projectId: string): Promise<string>;
  /** Post a message to a specific space */
  sendMessage(spaceId: string, content: string): Promise<void>;
  /** Blocking call to wait for human input in a specific space */
  waitForInput(spaceId: string, prompt: string): Promise<string>;
  /** Listen for slash commands or mentions from users */
  onCommand(callback: (command: GcbCommand) => Promise<void>): void;
}
```

### 4.2 PM2 Orchestrator Lifecycle
The `Orchestrator` acts as a wrapper around the PM2 programmatic API. It is responsible for:
1.  **Process Spawning:** Calling `pm2.start()` with sanitized environment variables (e.g., `GCB_CHANNEL_ID`) and naming the process `gcb-[projectId]`.
2.  **Process Management:** Handling graceful shutdown (`pm2.stop` and `pm2.delete`) via the `/stop` command.
3.  **Process Monitoring & Recovery:** Detecting if a Gemini CLI process crashes. Configuring PM2 for automatic restarts unless the process exits with code 0 (success).
4.  **Log Tailing:** Capturing `stdout/stderr` from PM2 via `pm2.launchBus()` and routing it through the `Bridge` to the `Provider`.

### 4.3 McpBridge Logic & Tooling
The `McpBridge` implements the MCP Server protocol. It bridges the gap between the Gemini CLI (running as a PM2 process) and the Collaboration Provider (Discord).

#### MCP Tools Definition
1.  **`notify_user`**:
    *   **Description**: Sends a non-blocking notification to the user in the project channel.
    *   **Arguments**: `{ "message": "string" }`
2.  **`ask_human`**:
    *   **Description**: Sends a prompt to the user and waits for a reply.
    *   **Arguments**: `{ "prompt": "string" }`

#### Flow: Tool Execution
1.  Gemini CLI calls a tool via MCP stdio.
2.  `McpBridge` receives the tool call.
3.  `McpBridge` identifies the `projectId` (from the environment variables of the calling process).
4.  `McpBridge` calls the corresponding method on the `ICollaborationProvider`.
5.  `McpBridge` returns the result back to Gemini CLI.

### 4.4 Dependency Injection
The `McpBridge` class should be initialized by injecting a concrete provider and the orchestrator:
```typescript
const provider = new DiscordProvider(config);
const orchestrator = new ProcessOrchestrator(pm2);
const bridge = new McpBridge(provider, orchestrator);
```

## 5. Coding Standards & Best Practices
*   **Error Handling:** Use a `Result<T, E>` pattern or standardized custom Error classes (e.g., `ProviderError`, `OrchestrationError`).
*   **PM2 Best Practices:**
    *   Set `restart_delay` to avoid rapid crash loops.
    *   Use `max_memory_restart` to prevent memory leaks in agents.
    *   Each process must be named using the `projectId` for easy identification.
*   **Sanitization:** Strict shell command sanitization for PM2 process names using a whitelist of allowed characters (a-z, 0-9, dash).

## 6. Security & Infrastructure

### 6.1 User Authorization (Whitelist)
To prevent unauthorized use, the `DiscordProvider` must implement a mandatory whitelist check:
- **`AUTHORIZED_USER_IDS`**: A comma-separated list of Discord User IDs in the `.env` file.
- **Validation**: Any command received via `onCommand` MUST be dropped if the `userId` is not present in the whitelist.
- **Audit**: Log unauthorized attempts with the user's tag and ID for audit purposes.

### 6.2 Sanitization & Injection Prevention
The `ProcessOrchestrator` is responsible for sanitizing all user-provided strings before passing them to the PM2 API or shell:
- **`projectId`**: MUST only contain alphanumeric characters and hyphens. Use a regex to enforce this: `/^[a-z0-9-]+$/`.
- **`args`**: Any user-provided arguments must be treated as strings and escaped if used in a shell context.

### 6.3 Configuration Integrity
The `ConfigValidator` (using Zod) must ensure the following:
- **Presence of Tokens**: `DISCORD_TOKEN` and `GEMINI_API_KEY` must be non-empty.
- **Format**: `DISCORD_TOKEN` should match the expected Discord token format.
- **Defaults**: Sensible defaults for `RESTART_DELAY` (e.g., 3000ms) to prevent rapid crash loops.

