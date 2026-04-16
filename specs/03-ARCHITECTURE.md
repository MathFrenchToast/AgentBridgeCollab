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
1.  **Process Spawning:** Calling `pm2.start()` with sanitized environment variables (e.g., `GCB_CHANNEL_ID`).
2.  **Log Streaming:** Capturing `stdout/stderr` from PM2 and routing it through the `Bridge` to the `Provider`.
3.  **Process Monitoring:** Detecting if a Gemini CLI process crashes and notifying the user.

### 4.3 Dependency Injection
The `McpBridge` class should be initialized by injecting a concrete provider:
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

