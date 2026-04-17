import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessOrchestrator } from '@/core/process-orchestrator';
import pm2 from 'pm2';

// Mock pm2
vi.mock('pm2', () => {
  return {
    default: {
      connect: vi.fn(),
      start: vi.fn(),
      disconnect: vi.fn(),
      list: vi.fn(),
    }
  };
});

describe('ProcessOrchestrator', () => {
  let orchestrator: ProcessOrchestrator;

  beforeEach(() => {
    vi.clearAllMocks();
    orchestrator = new ProcessOrchestrator();
  });

  describe('init()', () => {
    it('should connect to PM2 and recover state from existing gcb- processes', async () => {
      vi.mocked(pm2.connect).mockImplementation((cb: any) => cb(null));
      const mockProcessList = [
        {
          pm_id: 1,
          name: 'gcb-project-1',
          pm2_env: { GCB_CHANNEL_ID: 'channel-1', GCB_PROJECT_ID: 'project-1' }
        },
        {
          pm_id: 2,
          name: 'other-process',
          pm2_env: { GCB_CHANNEL_ID: 'channel-2', GCB_PROJECT_ID: 'project-2' }
        }
      ];
      vi.mocked(pm2.list).mockImplementation((cb: any) => cb(null, mockProcessList));

      await orchestrator.init();

      expect(pm2.connect).toHaveBeenCalled();
      expect(pm2.list).toHaveBeenCalled();
      
      const info = orchestrator.getProcessInfo('project-1');
      expect(info).toEqual({
        pm2Id: 1,
        projectId: 'project-1',
        channelId: 'channel-1'
      });

      expect(() => orchestrator.getProcessInfo('project-2')).toThrow();
    });
  });

  describe('startProcess()', () => {
    it('should sanitize the project name, connect to PM2, and start the process', async () => {
      const projectName = 'My Awesome Project!';
      const channelId = 'channel-123';
      const expectedProjectId = 'my-awesome-project';
      const expectedPm2Name = 'gcb-my-awesome-project';

      // Mock pm2.connect and list (init)
      vi.mocked(pm2.connect).mockImplementation((cb: any) => cb(null));
      vi.mocked(pm2.list).mockImplementation((cb: any) => cb(null, []));

      // Mock pm2.start to call the callback with no error and some mock apps
      vi.mocked(pm2.start).mockImplementation((options: any, cb: any) => cb(null, [{ pm_id: 123, name: expectedPm2Name }]));

      const projectId = await orchestrator.startProcess(projectName, channelId);

      expect(projectId).toBe(expectedProjectId);
      
      const info = orchestrator.getProcessInfo(expectedProjectId);
      expect(info).toEqual({
        pm2Id: 123,
        projectId: expectedProjectId,
        channelId: channelId
      });
    });

    it('should throw an error if pm2 connection fails', async () => {
      vi.mocked(pm2.connect).mockImplementation((cb: any) => cb(new Error('PM2 Connect Fail')));

      await expect(orchestrator.startProcess('test', '123')).rejects.toThrow('PM2 Connect Fail');
    });

    it('should throw an error if pm2 start fails', async () => {
      vi.mocked(pm2.connect).mockImplementation((cb: any) => cb(null));
      vi.mocked(pm2.list).mockImplementation((cb: any) => cb(null, []));
      vi.mocked(pm2.start).mockImplementation((options: any, cb: any) => cb(new Error('PM2 Start Fail')));

      await expect(orchestrator.startProcess('test', '123')).rejects.toThrow('PM2 Start Fail');
    });
  });

  describe('getProcessInfo()', () => {
    it('should throw Error when process is not found', () => {
      expect(() => orchestrator.getProcessInfo('unknown')).toThrow('Process with ID unknown not found');
    });
  });

  describe('sanitization', () => {
    it('should correctly sanitize names to follow kebab-case alphanumeric', async () => {
       // This can be a public method if we want to test it separately or internal
       // Testing it via startProcess for now as it's the only entry point
       vi.mocked(pm2.connect).mockImplementation((cb: any) => cb(null));
       vi.mocked(pm2.list).mockImplementation((cb: any) => cb(null, []));
       vi.mocked(pm2.start).mockImplementation((options: any, cb: any) => cb(null, [{ pm_id: 1, name: 'mock' }]));

       const testCases = [
         { input: 'My Project', expected: 'my-project' },
         { input: 'PROJECT_123', expected: 'project-123' },
         { input: '---Special !!! Characters---', expected: 'special-characters' },
         { input: '123-abc-XYZ', expected: '123-abc-xyz' }
       ];

       for (const { input, expected } of testCases) {
         const projectId = await orchestrator.startProcess(input, '123');
         expect(projectId).toBe(expected);
       }
    });
  });
});
