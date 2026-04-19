import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpBridge } from '@/core/mcp-bridge';
import { EventEmitter } from 'events';
describe('McpBridge Lifecycle Notifications', () => {
    let bridge;
    let mockProvider;
    let mockOrchestrator;
    beforeEach(() => {
        mockProvider = {
            sendMessage: vi.fn().mockResolvedValue(undefined),
            onCommand: vi.fn(),
        };
        mockOrchestrator = new EventEmitter();
        // Add required methods that McpBridge calls in constructor
        mockOrchestrator.getProcessInfo = vi.fn();
        bridge = new McpBridge(mockProvider, mockOrchestrator);
    });
    it('should send a notification when PROCESS_ONLINE is emitted', () => {
        const projectId = 'test-project';
        const channelId = 'channel-123';
        mockOrchestrator.emit('PROCESS_ONLINE', { projectId, channelId });
        expect(mockProvider.sendMessage).toHaveBeenCalledWith(channelId, '🚀 Agent started and connected.', 'info');
    });
    it('should send a notification when PROCESS_EXITED is emitted', () => {
        const projectId = 'test-project';
        const channelId = 'channel-123';
        mockOrchestrator.emit('PROCESS_EXITED', { projectId, channelId });
        expect(mockProvider.sendMessage).toHaveBeenCalledWith(channelId, '✅ Agent completed its task and shut down gracefully.', 'info');
    });
    it('should send a notification when PROCESS_CRASHED is emitted', () => {
        const projectId = 'test-project';
        const channelId = 'channel-123';
        mockOrchestrator.emit('PROCESS_CRASHED', { projectId, channelId });
        expect(mockProvider.sendMessage).toHaveBeenCalledWith(channelId, '⚠️ Agent crashed unexpectedly. PM2 is attempting a restart...', 'error');
    });
});
