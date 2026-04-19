import { describe, it, expect, beforeEach } from 'vitest';
import { StateStore } from '../../src/core/state-store';

describe('StateStore Mappings', () => {
  let store: StateStore;

  beforeEach(() => {
    StateStore.resetInstance();
    store = StateStore.getInstance(':memory:');
  });

  it('should save and retrieve project mapping', () => {
    const projectId = 'test-project';
    const channelId = '123456789';
    const pm2Id = 42;
    const ownerId = 'user-1';

    store.saveMapping(projectId, channelId, { pm2Id, ownerId });

    const mapping = store.getMapping(projectId);
    expect(mapping).toBeDefined();
    expect(mapping?.projectId).toBe(projectId);
    expect(mapping?.channelId).toBe(channelId);
    expect(mapping?.pm2Id).toBe(pm2Id);

    const mappingByChannel = store.getProjectByChannel(channelId);
    expect(mappingByChannel?.projectId).toBe(projectId);
  });

  it('should return null for non-existent mapping', () => {
    const mapping = store.getMapping('ghost');
    expect(mapping).toBeNull();
  });

  it('should update mapping if it already exists', () => {
    const projectId = 'test-project';
    store.saveMapping(projectId, 'channel-1', { pm2Id: 1, ownerId: 'user-1' });
    store.saveMapping(projectId, 'channel-2', { pm2Id: 2, ownerId: 'user-1' });

    const mapping = store.getMapping(projectId);
    expect(mapping?.channelId).toBe('channel-2');
    expect(mapping?.pm2Id).toBe(2);
  });

  it('should delete mapping (mark as stopped)', () => {
    const projectId = 'test-project';
    store.saveMapping(projectId, 'channel-1', { pm2Id: 1, ownerId: 'user-1' });
    
    store.deleteMapping(projectId);

    const mapping = store.getMapping(projectId);
    expect(mapping).toBeNull();
  });
});
