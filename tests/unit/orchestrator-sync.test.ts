import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessOrchestrator } from '@/core/process-orchestrator';
import pm2 from 'pm2';
import { StateStore } from '@/core/state-store';

// Mock pm2
vi.mock('pm2', () => {
  return {
    default: {
      connect: vi.fn(),
      list: vi.fn(),
      disconnect: vi.fn(),
    }
  };
});

// Mock StateStore
vi.mock('@/core/state-store', () => {
  return {
    StateStore: {
      getInstance: vi.fn().mockReturnValue({
        listActiveProjects: vi.fn(),
        deleteMapping: vi.fn(),
        logEvent: vi.fn(),
        getAuditLogs: vi.fn(),
      }),
    },
  };
});

describe('ProcessOrchestrator.syncWithPersistentStore', () => {
  let orchestrator: ProcessOrchestrator;
  let mockStore: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = StateStore.getInstance();
    orchestrator = new ProcessOrchestrator(mockStore);
  });

  it('should sync projects that are in both DB and PM2', async () => {
    // DB has project-1
    mockStore.listActiveProjects.mockReturnValue([
      { projectId: 'project-1', channelId: 'channel-1', pm2Id: 101 }
    ]);

    // PM2 has project-1
    vi.mocked(pm2.connect).mockImplementation((cb: any) => cb(null));
    vi.mocked(pm2.list).mockImplementation((cb: any) => cb(null, [
      {
        pm_id: 101,
        name: 'gcb-project-1',
        pm2_env: { GCB_CHANNEL_ID: 'channel-1', GCB_PROJECT_ID: 'project-1' }
      }
    ]));

    await orchestrator.init(); // init populates from PM2
    await (orchestrator as any).syncWithPersistentStore();

    const info = orchestrator.getProcessInfo('project-1');
    expect(info).toEqual({
      projectId: 'project-1',
      channelId: 'channel-1',
      pm2Id: 101
    });
    expect(mockStore.deleteMapping).not.toHaveBeenCalled();
  });

  it('should mark project as stopped if in DB but missing in PM2', async () => {
    // DB has project-1
    mockStore.listActiveProjects.mockReturnValue([
      { projectId: 'project-1', channelId: 'channel-1', pm2Id: 101 }
    ]);

    // PM2 is empty
    vi.mocked(pm2.connect).mockImplementation((cb: any) => cb(null));
    vi.mocked(pm2.list).mockImplementation((cb: any) => cb(null, []));

    await orchestrator.init();
    await (orchestrator as any).syncWithPersistentStore();

    expect(mockStore.deleteMapping).toHaveBeenCalledWith('project-1');
    expect(() => orchestrator.getProcessInfo('project-1')).toThrow();
  });

  it('should log a warning for orphaned PM2 processes (in PM2 but not in DB)', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // DB is empty
    mockStore.listActiveProjects.mockReturnValue([]);

    // PM2 has an orphan
    vi.mocked(pm2.connect).mockImplementation((cb: any) => cb(null));
    vi.mocked(pm2.list).mockImplementation((cb: any) => cb(null, [
      {
        pm_id: 102,
        name: 'gcb-orphan',
        pm2_env: { GCB_CHANNEL_ID: 'channel-orphan', GCB_PROJECT_ID: 'orphan' }
      }
    ]));

    await orchestrator.init();
    await (orchestrator as any).syncWithPersistentStore();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Orphaned PM2 process found: gcb-orphan'));
    
    // It should still be in memory as init() added it, but maybe we want to remove it?
    // Acceptance criteria says: "log a warning or attempt to re-register the mapping"
    // For now, logging a warning is enough.
  });
});
