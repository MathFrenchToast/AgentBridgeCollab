import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpBridge } from '@/core/mcp-bridge.js';
import { PassThrough } from 'stream';

describe('McpBridge Bidirectional Routing', () => {
  let bridge: McpBridge;
  let mockProvider: any;
  let mockOrchestrator: any;

  beforeEach(() => {
    mockProvider = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
      waitForInput: vi.fn(),
      onCommand: vi.fn(),
      createSpace: vi.fn(),
    };
    mockOrchestrator = {
      getProcessInfo: vi.fn(),
      on: vi.fn(),
      sendToProcess: vi.fn().mockResolvedValue(undefined),
      listProcesses: vi.fn().mockReturnValue([]),
    };
    bridge = new McpBridge(mockProvider as any, mockOrchestrator as any);
  });

  it('should route outbound MCP messages from server to agent via orchestrator.sendToProcess', async () => {
    const projectId = 'test-project';
    await bridge.initializeProjectServer(projectId);
    
    // Get the output stream for this project
    const output = bridge['outputs'].get(projectId);
    expect(output).toBeDefined();

    const mcpMessage = JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {}
    });

    // Simulate server writing to output
    output!.write(mcpMessage);

    // We need to wait a bit for the 'data' event to be processed
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockOrchestrator.sendToProcess).toHaveBeenCalledWith(projectId, mcpMessage);
  });

  it('should handle multiple projects independently', async () => {
    const p1 = 'project-1';
    const p2 = 'project-2';
    
    await bridge.initializeProjectServer(p1);
    await bridge.initializeProjectServer(p2);
    
    const output1 = bridge['outputs'].get(p1);
    const output2 = bridge['outputs'].get(p2);

    const msg1 = '{"jsonrpc":"2.0","method":"m1"}';
    const msg2 = '{"jsonrpc":"2.0","method":"m2"}';

    output1!.write(msg1);
    output2!.write(msg2);

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockOrchestrator.sendToProcess).toHaveBeenCalledWith(p1, msg1);
    expect(mockOrchestrator.sendToProcess).toHaveBeenCalledWith(p2, msg2);
  });

  it('should initialize servers for existing processes on bridge creation', async () => {
    const existingProjects = [
      { projectId: 'p1', channelId: 'c1', pm2Id: 1 },
      { projectId: 'p2', channelId: 'c2', pm2Id: 2 },
    ];
    mockOrchestrator.listProcesses = vi.fn().mockReturnValue(existingProjects);
    
    // Create a new bridge instance to trigger initialization logic
    const newBridge = new McpBridge(mockProvider as any, mockOrchestrator as any);
    
    // initializeProjectServer is async, so we might need a small delay or to wait for promises
    // In our implementation it will probably be fire-and-forget in constructor or we need to handle it.
    // Let's check how we implement it.
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(newBridge['servers'].has('p1')).toBe(true);
    expect(newBridge['servers'].has('p2')).toBe(true);
  });
});
