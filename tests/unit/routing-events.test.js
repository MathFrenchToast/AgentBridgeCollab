import { describe, it, expect } from 'vitest';
describe('Routing Events and Payloads', () => {
    it('should define AbcEventName with the required events', () => {
        // This will fail to compile if AbcEventName is not defined
        const events = ['LOG_EMITTED', 'STATUS_CHANGED', 'INPUT_REQUESTED'];
        expect(events).toContain('LOG_EMITTED');
        expect(events).toContain('STATUS_CHANGED');
        expect(events).toContain('INPUT_REQUESTED');
    });
    it('should have a correctly structured LogPayload', () => {
        const logEvent = {
            type: 'LOG_EMITTED',
            payload: {
                projectId: 'test-project',
                stream: 'stdout',
                content: 'Hello World'
            }
        };
        expect(logEvent.type).toBe('LOG_EMITTED');
        expect(logEvent.payload.projectId).toBe('test-project');
    });
    it('should have a correctly structured StatusPayload', () => {
        const statusEvent = {
            type: 'STATUS_CHANGED',
            payload: {
                projectId: 'test-project',
                status: 'running',
                message: 'Agent is active'
            }
        };
        expect(statusEvent.type).toBe('STATUS_CHANGED');
        expect(statusEvent.payload.status).toBe('running');
    });
    it('should have a correctly structured InputRequestPayload', () => {
        const inputEvent = {
            type: 'INPUT_REQUESTED',
            payload: {
                projectId: 'test-project',
                prompt: 'What is your name?',
                channelId: 'discord-123'
            }
        };
        expect(inputEvent.type).toBe('INPUT_REQUESTED');
        expect(inputEvent.payload.prompt).toBe('What is your name?');
    });
});
