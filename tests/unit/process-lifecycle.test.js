import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessOrchestrator } from '@/core/process-orchestrator';
import pm2 from 'pm2';
import { EventEmitter } from 'events';
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
        }
    };
});
describe('ProcessOrchestrator Lifecycle Events', () => {
    let orchestrator;
    let mockBus;
    beforeEach(async () => {
        vi.clearAllMocks();
        orchestrator = new ProcessOrchestrator();
        mockBus = new EventEmitter();
        vi.mocked(pm2.launchBus).mockImplementation((cb) => cb(null, mockBus));
        vi.mocked(pm2.connect).mockImplementation((cb) => cb(null));
        vi.mocked(pm2.list).mockImplementation((cb) => cb(null, []));
        vi.mocked(pm2.start).mockImplementation((options, cb) => cb(null, [{ pm_id: 123, name: 'abc-test-project' }]));
        await orchestrator.startProcess('test-project', 'channel-123');
        await orchestrator.startLogTailing();
    });
    it('should emit PROCESS_ONLINE when a managed process goes online', () => {
        const onlineSpy = vi.fn();
        orchestrator.on('PROCESS_ONLINE', onlineSpy);
        mockBus.emit('process:event', {
            event: 'online',
            process: { name: 'abc-test-project' }
        });
        expect(onlineSpy).toHaveBeenCalledWith({
            projectId: 'test-project',
            channelId: 'channel-123'
        });
    });
    it('should emit PROCESS_EXITED when a managed process exits with code 0', () => {
        const exitSpy = vi.fn();
        orchestrator.on('PROCESS_EXITED', exitSpy);
        mockBus.emit('process:event', {
            event: 'exit',
            process: {
                name: 'abc-test-project',
                status: 'stopped',
                exit_code: 0
            }
        });
        expect(exitSpy).toHaveBeenCalledWith({
            projectId: 'test-project',
            channelId: 'channel-123'
        });
    });
    it('should emit PROCESS_CRASHED when a managed process exits with non-zero code', () => {
        const crashSpy = vi.fn();
        orchestrator.on('PROCESS_CRASHED', crashSpy);
        mockBus.emit('process:event', {
            event: 'exit',
            process: {
                name: 'abc-test-project',
                status: 'errored',
                exit_code: 1
            }
        });
        expect(crashSpy).toHaveBeenCalledWith({
            projectId: 'test-project',
            channelId: 'channel-123'
        });
    });
    it('should ignore events from unmanaged processes', () => {
        const onlineSpy = vi.fn();
        orchestrator.on('PROCESS_ONLINE', onlineSpy);
        mockBus.emit('process:event', {
            event: 'online',
            process: { name: 'other-process' }
        });
        expect(onlineSpy).not.toHaveBeenCalled();
    });
});
