import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessOrchestrator } from '@/core/process-orchestrator';
import pm2 from 'pm2';
import { EventEmitter } from 'events';
import { StateStore } from '@/core/state-store';

// Mock pm2
vi.mock('pm2', () => {
  return {
    default: {
      connect: vi.fn(),
      start: vi.fn(),
      disconnect: vi.fn(),
      list: vi.fn(),
      stop: vi.fn(),
      delete: vi.fn(),
      launchBus: vi.fn(),
      sendDataToProcessId: vi.fn(),
    }
  };
});

// Mock StateStore
vi.mock('@/core/state-store', () => {
  return {
    StateStore: {
      getInstance: vi.fn().mockReturnValue({
        saveMapping: vi.fn(),
        getMapping: vi.fn(),
        getProjectByChannel: vi.fn(),
        deleteMapping: vi.fn(),
        listActiveProjects: vi.fn(),
        logEvent: vi.fn(),
      }),
    },
  };
});

describe('ProcessOrchestrator Audit Logging', () => {
  let orchestrator: ProcessOrchestrator;
  let mockStore: any;
  let mockBus: EventEmitter;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockStore = StateStore.getInstance();
    orchestrator = new ProcessOrchestrator(mockStore);

    mockBus = new EventEmitter();
    vi.mocked(pm2.launchBus).mockImplementation((cb: any) => cb(null, mockBus));
    vi.mocked(pm2.connect).mockImplementation((cb: any) => cb(null));
    vi.mocked(pm2.list).mockImplementation((cb: any) => cb(null, []));
    vi.mocked(pm2.start).mockImplementation((options: any, cb: any) => cb(null, [{ pm_id: 123, name: 'abc-test-project' }]));

    await orchestrator.startProcess('test-project', 'channel-123');
    await orchestrator.startLogTailing();
  });

  it('should log an event when a process crashes', () => {
    mockBus.emit('process:event', {
      event: 'exit',
      process: { 
        name: 'abc-test-project',
        exit_code: 1 
      }
    });

    expect(mockStore.logEvent).toHaveBeenCalledWith({
      userId: 'system',
      action: 'process:crash',
      projectId: 'test-project'
    });
  });

  it('should log an event when a process restarts', () => {
    mockBus.emit('process:event', {
      event: 'restart',
      process: { name: 'abc-test-project' }
    });

    expect(mockStore.logEvent).toHaveBeenCalledWith({
      userId: 'system',
      action: 'process:restart',
      projectId: 'test-project'
    });
  });

  it('should log an event when a process throws an exception', () => {
    mockBus.emit('process:exception', {
      process: { name: 'abc-test-project' },
      data: { message: 'Uncaught Error' }
    });

    expect(mockStore.logEvent).toHaveBeenCalledWith({
      userId: 'system',
      action: 'process:exception',
      projectId: 'test-project'
    });
  });

  it('should not log crash when exit code is 0', () => {
    mockBus.emit('process:event', {
      event: 'exit',
      process: { 
        name: 'abc-test-project',
        exit_code: 0 
      }
    });

    expect(mockStore.logEvent).not.toHaveBeenCalledWith(expect.objectContaining({
      action: 'process:crash'
    }));
  });
});
