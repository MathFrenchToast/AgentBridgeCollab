import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpBridge } from '../../src/core/mcp-bridge';
import { ProcessOrchestrator } from '../../src/core/process-orchestrator';
import { ICollaborationProvider } from '../../src/providers/collaboration-provider';

describe('McpBridge Context Extraction', () => {
  let bridge: McpBridge;
  let mockProvider: vi.Mocked<ICollaborationProvider>;
  let mockOrchestrator: vi.Mocked<ProcessOrchestrator>;

  beforeEach(() => {
    mockProvider = {
      sendMessage: vi.fn(),
      waitForInput: vi.fn(),
      createSpace: vi.fn(),
      onCommand: vi.fn(),
    } as any;

    mockOrchestrator = {
      getProcessInfo: vi.fn(),
      listProcesses: vi.fn().mockReturnValue([]),
      on: vi.fn(),
    } as any;

    bridge = new McpBridge(mockProvider, mockOrchestrator);
  });

  it('should extract context from provided projectId', async () => {
    const mockContext = { projectId: 'test-p', channelId: 'test-c', pm2Id: 123 };
    mockOrchestrator.getProcessInfo.mockReturnValue(mockContext);

    // Using internal method via casting for testing
    const context = (bridge as any).getProjectContext('test-p');

    expect(context).toEqual(mockContext);
    expect(mockOrchestrator.getProcessInfo).toHaveBeenCalledWith('test-p');
  });

  it('should extract context from process.env.ABC_PROJECT_ID when projectId is not provided', () => {
    const mockContext = { projectId: 'env-p', channelId: 'env-c', pm2Id: 456 };
    process.env.ABC_PROJECT_ID = 'env-p';
    mockOrchestrator.getProcessInfo.mockReturnValue(mockContext);

    const context = (bridge as any).getProjectContext();

    expect(context).toEqual(mockContext);
    expect(mockOrchestrator.getProcessInfo).toHaveBeenCalledWith('env-p');

    delete process.env.ABC_PROJECT_ID;
  });

  it('should throw error when context cannot be found', () => {
    mockOrchestrator.getProcessInfo.mockImplementation(() => {
      throw new Error('Process with ID unknown not found');
    });

    expect(() => (bridge as any).getProjectContext('unknown')).toThrow('Process with ID unknown not found');
  });

  it('should throw error when ABC_PROJECT_ID is missing and no projectId provided', () => {
    delete process.env.ABC_PROJECT_ID;
    expect(() => (bridge as any).getProjectContext()).toThrow('Project ID missing from call context and environment');
  });
});
