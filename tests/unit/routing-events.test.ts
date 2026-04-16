import { describe, it, expect } from 'vitest';
import { GcbEventName, GcbEvent } from '@/types';

describe('Routing Events and Payloads', () => {
  it('should define GcbEventName with the required events', () => {
    // This will fail to compile if GcbEventName is not defined
    const events: GcbEventName[] = ['LOG_EMITTED', 'STATUS_CHANGED', 'INPUT_REQUESTED'];
    expect(events).toContain('LOG_EMITTED');
    expect(events).toContain('STATUS_CHANGED');
    expect(events).toContain('INPUT_REQUESTED');
  });

  it('should have a correctly structured LogPayload', () => {
    const logEvent: GcbEvent = {
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
    const statusEvent: GcbEvent = {
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
    const inputEvent: GcbEvent = {
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
