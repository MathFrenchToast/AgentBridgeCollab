import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PassThrough } from "stream";
import { ICollaborationProvider } from "../providers/collaboration-provider.js";
import { ProcessOrchestrator } from "./process-orchestrator.js";
import { AppConfig } from "./config-validator.js";

export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: any, projectId: string) => Promise<any>;
}

export class McpBridge {
  private servers: Map<string, Server> = new Map();
  private transports: Map<string, StdioServerTransport> = new Map();
  private inputs: Map<string, PassThrough> = new Map();
  private outputs: Map<string, PassThrough> = new Map();
  private tools: McpTool[] = [];

  constructor(
    private provider: ICollaborationProvider,
    private orchestrator: ProcessOrchestrator,
    private config?: AppConfig
  ) {
    this.setupLogForwarding();
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    this.registerTool({
      name: "notify_user",
      description: "Sends a non-blocking notification to the user",
      inputSchema: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
        required: ["message"],
      },
      handler: async (args, projectId) => {
        try {
          const info = this.orchestrator.getProcessInfo(projectId);
          // Fire and forget
          this.provider.sendMessage(info.channelId, args.message).catch((err) => {
            console.error(`[McpBridge] Error sending notification for ${projectId}:`, err);
          });
          return { success: true };
        } catch (error) {
          console.error(`[McpBridge] Failed to handle notify_user for ${projectId}:`, error);
          return { success: false, error: (error as Error).message };
        }
      },
    });

    this.registerTool({
      name: "ask_human",
      description: "Sends a prompt to the user and waits for a reply",
      inputSchema: {
        type: "object",
        properties: {
          prompt: { type: "string" },
        },
        required: ["prompt"],
      },
      handler: async (args, projectId) => {
        try {
          const info = this.orchestrator.getProcessInfo(projectId);
          const timeoutMs = this.config?.GCB_ASK_TIMEOUT || parseInt(process.env.GCB_ASK_TIMEOUT || "1800000", 10);

          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout waiting for user input")), timeoutMs);
          });

          const response = await Promise.race([
            this.provider.waitForInput(info.channelId, args.prompt),
            timeoutPromise,
          ]);

          return { response };
        } catch (error) {
          const message = (error as Error).message;
          if (message === "Timeout waiting for user input") {
            return { error: message, code: -32603 };
          }
          console.error(`[McpBridge] Failed to handle ask_human for ${projectId}:`, error);
          return { error: message };
        }
      },
    });
  }

  private setupLogForwarding() {
    this.orchestrator.on('LOG_EMITTED', (log) => {
      if (log.type === 'stdout') {
        const input = this.inputs.get(log.projectId);
        if (input) {
          input.write(log.content + '\n');
        }
      }
    });
  }

  /**
   * Listen for commands from the provider and bridge them to orchestrator actions.
   */
  listenToProviderCommands() {
    this.provider.onCommand(async (command) => {
      try {
        switch (command.type) {
          case 'start': {
            if (!command.projectId) {
              await this.provider.sendMessage(command.channelId, "Usage: /start <projectId>");
              return;
            }
            const channelId = await this.provider.createSpace(command.projectId);
            const spawnedId = await this.orchestrator.startProcess(command.projectId, channelId);
            await this.initializeProjectServer(spawnedId);
            await this.provider.sendMessage(channelId, `🚀 Spawned process: ${spawnedId}. You can now interact with Gemini here.`);
            break;
          }

          case 'stop': {
            const projectId = this.orchestrator.getProjectFromChannel(command.channelId);
            if (!projectId) {
              await this.provider.sendMessage(command.channelId, "❌ Error: This channel is not associated with any active process.");
              return;
            }
            await this.orchestrator.stopProcess(projectId);
            await this.cleanupProjectServer(projectId);
            await this.provider.sendMessage(command.channelId, `⏹️ Process ${projectId} stopped.`);
            break;
          }

          case 'status': {
            const projectId = this.orchestrator.getProjectFromChannel(command.channelId);
            if (!projectId) {
              await this.provider.sendMessage(command.channelId, "❌ Error: This channel is not associated with any active process.");
              return;
            }
            const info = this.orchestrator.getProcessInfo(projectId);
            await this.provider.sendMessage(command.channelId, `ℹ️ Status for ${projectId}: Running (PM2 ID: ${info.pm2Id})`);
            break;
          }

          case 'list': {
            const processes = this.orchestrator.listProcesses();
            if (processes.length === 0) {
              await this.provider.sendMessage(command.channelId, "📝 No active processes.");
              return;
            }
            const list = processes.map(p => `- ${p.projectId} (Channel: ${p.channelId})`).join('\n');
            await this.provider.sendMessage(command.channelId, `📝 Active processes:\n${list}`);
            break;
          }
        }
      } catch (error) {
        console.error(`[McpBridge] Error handling command ${command.type}:`, error);
        await this.provider.sendMessage(command.channelId, `❌ Error: ${(error as Error).message}`);
      }
    });
  }

  /**
   * Register a tool that will be available to all MCP servers.
   */
  registerTool(tool: McpTool) {
    this.tools.push(tool);
    // Note: In a real implementation, we might want to update existing servers too.
    // For now, new servers will get the tools.
    for (const server of this.servers.values()) {
      this.registerToolsToServer(server, Array.from(this.servers.entries()).find(([_, s]) => s === server)?.[0] || '');
    }
  }

  private registerToolsToServer(server: Server, projectId: string) {
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.tools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = this.tools.find(t => t.name === request.params.name);
      if (!tool) {
        throw new Error(`Tool ${request.params.name} not found`);
      }
      const result = await tool.handler(request.params.arguments, projectId);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    });
  }

  /**
   * Initialize a new MCP server for a specific project.
   */
  async initializeProjectServer(projectId: string): Promise<void> {
    if (this.servers.has(projectId)) {
      return;
    }

    const server = new Server(
      {
        name: "Gemini-Collaboration-Bridge",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    const input = new PassThrough();
    const output = new PassThrough();

    // In a real scenario, we would need to connect 'output' to the child process's stdin.
    // For now we just track them.
    this.inputs.set(projectId, input);
    this.outputs.set(projectId, output);

    const transport = new StdioServerTransport(input, output);
    
    output.on('data', (chunk) => {
      // TODO: Implement actual piping to child process stdin via Orchestrator/PM2
      console.log(`[McpBridge] Sending to ${projectId} stdin: ${chunk.toString()}`);
    });

    this.registerToolsToServer(server, projectId);

    await server.connect(transport);
    
    this.servers.set(projectId, server);
    this.transports.set(projectId, transport);

    console.log(`MCP Server initialized for project: ${projectId}`);
  }

  /**
   * Cleanup a server when a project stops.
   */
  async cleanupProjectServer(projectId: string): Promise<void> {
    const server = this.servers.get(projectId);
    const transport = this.transports.get(projectId);

    if (server) {
      await server.close();
      this.servers.delete(projectId);
    }

    if (transport) {
      // transport doesn't have a close method in some versions but server.close() handles it usually
      this.transports.delete(projectId);
    }

    this.inputs.delete(projectId);
    this.outputs.delete(projectId);
    
    console.log(`MCP Server cleaned up for project: ${projectId}`);
  }
}
