import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessOrchestrator } from '@/core/process-orchestrator';
import pm2 from 'pm2';
import path from 'path';

// Mock pm2
vi.mock('pm2', () => {
  return {
    default: {
      connect: vi.fn(),
      start: vi.fn(),
      disconnect: vi.fn(),
      list: vi.fn(),
      sendDataToProcessId: vi.fn(),
    }
  };
});

describe('ProcessOrchestrator Shim Integration', () => {
  let orchestrator: ProcessOrchestrator;

  beforeEach(() => {
    vi.clearAllMocks();
    orchestrator = new ProcessOrchestrator();
  });

  describe('startProcess() with Shim', () => {
    it('should use launcher shim and pass command as arguments', async () => {
      vi.mocked(pm2.connect).mockImplementation((cb: any) => cb(null));
      vi.mocked(pm2.list).mockImplementation((cb: any) => cb(null, []));
      vi.mocked(pm2.start).mockImplementation((options: any, cb: any) => cb(null, [{ pm_id: 123, name: 'gcb-test' }]));

      const projectName = 'test';
      const channelId = 'channel-1';
      const agentCommand = ['gemini', 'analyze', 'src'];

      await orchestrator.startProcess(projectName, channelId, agentCommand);

      expect(pm2.start).toHaveBeenCalledWith(
        expect.objectContaining({
          script: expect.stringContaining('launcher.ts'),
          args: agentCommand,
        }),
        expect.any(Function)
      );
    });
  });

  describe('sendToProcess()', () => {
    it('should send IPC message with topic gcb:stdin', async () => {
      vi.mocked(pm2.connect).mockImplementation((cb: any) => cb(null));
      vi.mocked(pm2.list).mockImplementation((cb: any) => cb(null, []));
      vi.mocked(pm2.start).mockImplementation((options: any, cb: any) => cb(null, [{ pm_id: 123, name: 'gcb-test' }]));

      await orchestrator.startProcess('test', 'channel-1', ['gemini']);

      vi.mocked(pm2.sendDataToProcessId).mockImplementation((options: any, cb: any) => cb(null, { success: true }));

      await orchestrator.sendToProcess('test', 'Hello agent');

      expect(pm2.sendDataToProcessId).toHaveBeenCalledWith(
        {
          id: 123,
          topic: 'gcb:stdin',
          data: 'Hello agent',
        },
        expect.any(Function)
      );
    });

    it('should throw error if process is not found', async () => {
      await expect(orchestrator.sendToProcess('unknown', 'data')).rejects.toThrow('Process with ID unknown not found');
    });

    it('should throw error if pm2.sendDataToProcessId fails', async () => {
       vi.mocked(pm2.connect).mockImplementation((cb: any) => cb(null));
       vi.mocked(pm2.list).mockImplementation((cb: any) => cb(null, []));
       vi.mocked(pm2.start).mockImplementation((options: any, cb: any) => cb(null, [{ pm_id: 123, name: 'gcb-test' }]));

       await orchestrator.startProcess('test', 'channel-1', ['gemini']);

       vi.mocked(pm2.sendDataToProcessId).mockImplementation((options: any, cb: any) => cb(new Error('IPC Failed')));

       await expect(orchestrator.sendToProcess('test', 'data')).rejects.toThrow('IPC Failed');
    });
  });
});
