import { describe, it, expect, beforeEach } from 'vitest';
import { StateStore } from '../../src/core/state-store';

describe('StateStore Audit Log', () => {
  beforeEach(() => {
    StateStore.resetInstance();
  });

  it('should log an event and retrieve it', () => {
    const store = StateStore.getInstance(':memory:');
    const entry = {
      userId: 'user-123',
      action: 'test-action',
      projectId: 'project-456'
    };

    store.logEvent(entry);

    const logs = store.getAuditLogs('project-456');
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      userId: 'user-123',
      action: 'test-action',
      projectId: 'project-456'
    });
    expect(logs[0].timestamp).toBeDefined();
  });

  it('should retrieve logs for all projects if no projectId is provided', () => {
    const store = StateStore.getInstance(':memory:');
    
    store.logEvent({ userId: 'u1', action: 'a1', projectId: 'p1' });
    store.logEvent({ userId: 'u2', action: 'a2', projectId: 'p2' });

    const logs = store.getAuditLogs();
    expect(logs).toHaveLength(2);
    expect(logs.map(l => l.projectId)).toContain('p1');
    expect(logs.map(l => l.projectId)).toContain('p2');
  });

  it('should return logs in chronological order', async () => {
    const store = StateStore.getInstance(':memory:');
    
    store.logEvent({ userId: 'u1', action: 'first', projectId: 'p1' });
    // SQLite CURRENT_TIMESTAMP has 1s precision, but we can rely on AUTOINCREMENT id for order if timestamps are same
    // or just assume they will be in order of insertion.
    store.logEvent({ userId: 'u1', action: 'second', projectId: 'p1' });

    const logs = store.getAuditLogs('p1');
    expect(logs).toHaveLength(2);
    expect(logs[0].action).toBe('first');
    expect(logs[1].action).toBe('second');
  });
});
