import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpBridge } from '@/core/mcp-bridge';
import { ICollaborationProvider } from '@/providers/collaboration-provider';
import { ProcessOrchestrator } from '@/core/process-orchestrator';

describe('McpBridge', () => {
  let bridge: McpBridge;
  let mockProvider: any;
  let mockOrchestrator: any;

  beforeEach(() => {
    mockProvider = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
      waitForInput: vi.fn().mockResolvedValue('user response'),
    };
    mockOrchestrator = {
      getProcessInfo: vi.fn(),
      listProcesses: vi.fn().mockReturnValue([]),
      on: vi.fn(),
    };
    bridge = new McpBridge(mockProvider as any, mockOrchestrator as any);
  });

  it('should be able to initialize a server for a project', async () => {
    const projectId = 'test-project';
    await bridge.initializeProjectServer(projectId);
    
    // Check if it's registered internally (we might need a getter for testing or check behavior)
    // For now, let's just ensure it doesn't throw.
  });

  it('should register tool handlers and be able to call them', async () => {
    const projectId = 'test-project';
    await bridge.initializeProjectServer(projectId);

    const mockHandler = vi.fn().mockResolvedValue({ success: true });
    bridge.registerTool({
      name: 'test_tool',
      description: 'A test tool',
      inputSchema: { type: 'object', properties: {} },
      handler: mockHandler,
    });

    // We can't easily call the request handler directly without exposing the server
    // but we can check if it's stored in the bridge's tools
    expect(bridge['tools']).toContainEqual(expect.objectContaining({ name: 'test_tool' }));
  });

  it('should forward stdout logs to the correct project server if it is JSON-RPC', async () => {
    const projectId = 'test-project';
    await bridge.initializeProjectServer(projectId);
    
    // Get the on handler
    const onCall = mockOrchestrator.on.mock.calls.find((call: any) => call[0] === 'LOG_EMITTED');
    const handler = onCall[1];
    
    const input = bridge['inputs'].get(projectId);
    const writeSpy = vi.spyOn(input!, 'write');
    
    const jsonRpc = '{"jsonrpc": "2.0", "method": "test"}';
    handler({ projectId, type: 'stdout', content: jsonRpc, channelId: 'c1' });
    
    expect(writeSpy).toHaveBeenCalledWith(jsonRpc + '\n');
  });

  it('should forward non-JSON stdout logs to logBatcher', async () => {
    const projectId = 'test-project';
    const channelId = 'channel-123';
    await bridge.initializeProjectServer(projectId);
    
    const addLogSpy = vi.spyOn(bridge['logBatcher'], 'addLog');
    
    const onCall = mockOrchestrator.on.mock.calls.find((call: any) => call[0] === 'LOG_EMITTED');
    const handler = onCall[1];
    
    handler({ projectId, type: 'stdout', content: 'plain log', channelId });
    
    expect(addLogSpy).toHaveBeenCalledWith(projectId, channelId, 'stdout', 'plain log');
  });

  it('should forward stderr logs to logBatcher', async () => {
    const projectId = 'test-project';
    const channelId = 'channel-123';
    await bridge.initializeProjectServer(projectId);
    
    const addLogSpy = vi.spyOn(bridge['logBatcher'], 'addLog');
    
    const onCall = mockOrchestrator.on.mock.calls.find((call: any) => call[0] === 'LOG_EMITTED');
    const handler = onCall[1];
    
    handler({ projectId, type: 'stderr', content: 'error log', channelId });
    
    expect(addLogSpy).toHaveBeenCalledWith(projectId, channelId, 'stderr', 'error log');
  });

  it('should register default tools on construction', () => {
    // Check if notify_user is present in bridge tools
    const notifyUserTool = bridge['tools'].find(t => t.name === 'notify_user');
    expect(notifyUserTool).toBeDefined();
    expect(notifyUserTool?.description).toBe('Sends a non-blocking notification to the user');

    const askHumanTool = bridge['tools'].find(t => t.name === 'ask_human');
    expect(askHumanTool).toBeDefined();
    expect(askHumanTool?.description).toBe('Sends a prompt to the user and waits for a reply');
  });

  it('should call provider.waitForInput when ask_human is called', async () => {
    const projectId = 'test-project';
    const channelId = 'channel-123';
    const prompt = 'What is your name?';
    const userResponse = 'John Doe';

    mockOrchestrator.getProcessInfo.mockReturnValue({
      projectId,
      channelId,
      pm2Id: 1
    });

    mockProvider.waitForInput.mockResolvedValue(userResponse);

    const askHumanTool = bridge['tools'].find(t => t.name === 'ask_human');
    const result = await askHumanTool?.handler({ prompt }, projectId);

    expect(result).toEqual({ response: userResponse });
    expect(mockOrchestrator.getProcessInfo).toHaveBeenCalledWith(projectId);
    expect(mockProvider.waitForInput).toHaveBeenCalledWith(channelId, prompt);
  });

  it('should return error if ask_human times out', async () => {
    const projectId = 'test-project';
    const channelId = 'channel-123';
    const prompt = 'Confirm deployment?';

    mockOrchestrator.getProcessInfo.mockReturnValue({
      projectId,
      channelId,
      pm2Id: 1
    });

    // Mock waitForInput to never resolve or delay significantly
    mockProvider.waitForInput.mockImplementation(() => new Promise(() => {}));

    // Use a very short timeout for testing if we can control it via process.env
    process.env.ABC_ASK_TIMEOUT = '100';

    const askHumanTool = bridge['tools'].find(t => t.name === 'ask_human');
    
    // We expect it to return an error object after timeout
    const result = await askHumanTool?.handler({ prompt }, projectId);

    expect(result).toEqual({ 
      error: 'Timeout waiting for user input',
      code: -32603
    });
  });

  it('should return success: false if projectId is not found', async () => {
    const projectId = 'unknown-project';
    mockOrchestrator.getProcessInfo.mockImplementation(() => {
      throw new Error(`Process with ID ${projectId} not found`);
    });

    const notifyUserTool = bridge['tools'].find(t => t.name === 'notify_user');
    const result = await notifyUserTool?.handler({ message: 'test' }, projectId);

    expect(result).toEqual({ 
      success: false, 
      error: `Process with ID ${projectId} not found` 
    });
  });

  describe('lifecycle notifications', () => {
    it('should send a notification when PROCESS_ONLINE is emitted', () => {
      const projectId = 'test-project';
      const channelId = 'channel-123';

      mockOrchestrator.on.mock.calls.find((call: any) => call[0] === 'PROCESS_ONLINE')[1]({ projectId, channelId });

      expect(mockProvider.sendMessage).toHaveBeenCalledWith(
        channelId,
        '🚀 Agent started and connected.',
        'info'
      );
    });

    it('should send a notification when PROCESS_EXITED is emitted', () => {
      const projectId = 'test-project';
      const channelId = 'channel-123';

      mockOrchestrator.on.mock.calls.find((call: any) => call[0] === 'PROCESS_EXITED')[1]({ projectId, channelId });

      expect(mockProvider.sendMessage).toHaveBeenCalledWith(
        channelId,
        '✅ Agent completed its task and shut down gracefully.',
        'info'
      );
    });

    it('should send a notification when PROCESS_CRASHED is emitted', () => {
      const projectId = 'test-project';
      const channelId = 'channel-123';

      mockOrchestrator.on.mock.calls.find((call: any) => call[0] === 'PROCESS_CRASHED')[1]({ projectId, channelId });

      expect(mockProvider.sendMessage).toHaveBeenCalledWith(
        channelId,
        '⚠️ Agent crashed unexpectedly. PM2 is attempting a restart...',
        'error'
      );
    });
  });
});
