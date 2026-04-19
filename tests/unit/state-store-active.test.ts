import { describe, it, expect, beforeEach } from 'vitest';
import { StateStore } from '../../src/core/state-store';

describe('StateStore.listActiveProjects', () => {
  beforeEach(() => {
    StateStore.resetInstance();
  });

  it('should return all projects with status "running"', () => {
    const store = StateStore.getInstance(':memory:');
    
    store.saveMapping('project-1', 'channel-1', { pm2Id: 1, ownerId: 'user-1' });
    store.saveMapping('project-2', 'channel-2', { pm2Id: 2, ownerId: 'user-2' });
    store.deleteMapping('project-2'); // Set status to 'stopped'
    store.saveMapping('project-3', 'channel-3', { pm2Id: 3, ownerId: 'user-3' });

    const activeProjects = store.listActiveProjects();
    
    expect(activeProjects).toHaveLength(2);
    expect(activeProjects).toContainEqual(expect.objectContaining({ projectId: 'project-1', channelId: 'channel-1', pm2Id: 1 }));
    expect(activeProjects).toContainEqual(expect.objectContaining({ projectId: 'project-3', channelId: 'channel-3', pm2Id: 3 }));
    expect(activeProjects).not.toContainEqual(expect.objectContaining({ projectId: 'project-2' }));
  });

  it('should return an empty array if no active projects', () => {
    const store = StateStore.getInstance(':memory:');
    expect(store.listActiveProjects()).toEqual([]);
  });
});
