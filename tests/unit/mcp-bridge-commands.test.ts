import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpBridge } from '@/core/mcp-bridge';
import { ICollaborationProvider } from '@/providers/collaboration-provider';
import { ProcessOrchestrator } from '@/core/process-orchestrator';
import { GcbCommand } from '@/types';

describe('McpBridge Commands', () => {
  let bridge: McpBridge;
  let mockProvider: any;
  let mockOrchestrator: any;
  let commandCallback: (command: GcbCommand) => Promise<void>;

  beforeEach(() => {
    mockProvider = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
      createSpace: vi.fn().mockResolvedValue('channel-123'),
      onCommand: vi.fn().mockImplementation((cb) => {
        commandCallback = cb;
      }),
    };
    mockOrchestrator = {
      startProcess: vi.fn().mockResolvedValue('test-project'),
      stopProcess: vi.fn().mockResolvedValue(undefined),
      getProcessInfo: vi.fn(),
      getProjectFromChannel: vi.fn(),
      listProcesses: vi.fn().mockReturnValue([]),
      on: vi.fn(),
    };
    bridge = new McpBridge(mockProvider as any, mockOrchestrator as any);
    bridge.listenToProviderCommands();
  });

  it('should handle /start command', async () => {
    const command: GcbCommand = {
      type: 'start',
      projectId: 'my-project',
      userId: 'user-1',
      channelId: 'general',
    };

    await commandCallback(command);

    expect(mockProvider.createSpace).toHaveBeenCalledWith('my-project');
    expect(mockOrchestrator.startProcess).toHaveBeenCalledWith('my-project', 'channel-123');
    expect(mockProvider.sendMessage).toHaveBeenCalledWith('channel-123', expect.stringContaining('Spawned process: test-project'));
  });

  it('should handle /stop command in a project channel', async () => {
    const command: GcbCommand = {
      type: 'stop',
      userId: 'user-1',
      channelId: 'channel-123',
    };

    mockOrchestrator.getProjectFromChannel.mockReturnValue('test-project');

    await commandCallback(command);

    expect(mockOrchestrator.getProjectFromChannel).toHaveBeenCalledWith('channel-123');
    expect(mockOrchestrator.stopProcess).toHaveBeenCalledWith('test-project');
    expect(mockProvider.sendMessage).toHaveBeenCalledWith('channel-123', expect.stringContaining('Process test-project stopped.'));
  });

  it('should handle /status command', async () => {
    const command: GcbCommand = {
      type: 'status',
      userId: 'user-1',
      channelId: 'channel-123',
    };

    mockOrchestrator.getProjectFromChannel.mockReturnValue('test-project');
    mockOrchestrator.getProcessInfo.mockReturnValue({
      projectId: 'test-project',
      channelId: 'channel-123',
      pm2Id: 1
    });

    await commandCallback(command);

    expect(mockOrchestrator.getProcessInfo).toHaveBeenCalledWith('test-project');
    expect(mockProvider.sendMessage).toHaveBeenCalledWith('channel-123', expect.stringContaining('Status for test-project'));
  });

  it('should handle /list command', async () => {
    const command: GcbCommand = {
      type: 'list',
      userId: 'user-1',
      channelId: 'channel-123',
    };

    mockOrchestrator.listProcesses.mockReturnValue([
      { projectId: 'p1', channelId: 'c1', pm2Id: 1 },
      { projectId: 'p2', channelId: 'c2', pm2Id: 2 },
    ]);

    await commandCallback(command);

    expect(mockOrchestrator.listProcesses).toHaveBeenCalled();
    expect(mockProvider.sendMessage).toHaveBeenCalledWith('channel-123', expect.stringContaining('Active processes:'));
    expect(mockProvider.sendMessage).toHaveBeenCalledWith('channel-123', expect.stringContaining('p1'));
    expect(mockProvider.sendMessage).toHaveBeenCalledWith('channel-123', expect.stringContaining('p2'));
  });

  it('should notify user if /start missing projectId', async () => {
    const command: GcbCommand = {
      type: 'start',
      userId: 'user-1',
      channelId: 'general',
    };

    await commandCallback(command);

    expect(mockProvider.sendMessage).toHaveBeenCalledWith('general', expect.stringContaining('Usage: /start <projectId>'));
  });

  it('should notify user if command fails', async () => {
    const command: GcbCommand = {
      type: 'stop',
      userId: 'user-1',
      channelId: 'channel-123',
    };

    mockOrchestrator.getProjectFromChannel.mockReturnValue('test-project');
    mockOrchestrator.stopProcess.mockRejectedValue(new Error('Stop failed'));

    await commandCallback(command);

    expect(mockProvider.sendMessage).toHaveBeenCalledWith('channel-123', expect.stringContaining('Error: Stop failed'));
  });
});
