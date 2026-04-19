import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StateStore } from '../../src/core/state-store';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

describe('StateStore', () => {
  beforeEach(() => {
    StateStore.resetInstance();
  });

  it('should be a singleton', () => {
    const instance1 = StateStore.getInstance(':memory:');
    const instance2 = StateStore.getInstance(':memory:');
    expect(instance1).toBe(instance2);
  });

  it('should initialize tables on creation', () => {
    const db = StateStore.getInstance(':memory:').getDatabase();
    
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const tableNames = tables.map(t => t.name);
    
    expect(tableNames).toContain('projects');
    expect(tableNames).toContain('spaces');
    expect(tableNames).toContain('audit_log');
  });

  it('should have the correct schema for projects', () => {
    const db = StateStore.getInstance(':memory:').getDatabase();
    const info = db.prepare("PRAGMA table_info(projects)").all() as any[];
    
    const columns = info.map(c => ({ name: c.name, type: c.type }));
    expect(columns).toContainEqual({ name: 'id', type: 'TEXT' });
    expect(columns).toContainEqual({ name: 'name', type: 'TEXT' });
    expect(columns).toContainEqual({ name: 'status', type: 'TEXT' });
    expect(columns).toContainEqual({ name: 'created_at', type: 'DATETIME' });
    expect(columns).toContainEqual({ name: 'owner_id', type: 'TEXT' });
  });

  it('should have the correct schema for spaces', () => {
    const db = StateStore.getInstance(':memory:').getDatabase();
    const info = db.prepare("PRAGMA table_info(spaces)").all() as any[];
    
    const columns = info.map(c => ({ name: c.name, type: c.type }));
    expect(columns).toContainEqual({ name: 'project_id', type: 'TEXT' });
    expect(columns).toContainEqual({ name: 'provider_type', type: 'TEXT' });
    expect(columns).toContainEqual({ name: 'space_id', type: 'TEXT' });
  });

  it('should have the correct schema for audit_log', () => {
    const db = StateStore.getInstance(':memory:').getDatabase();
    const info = db.prepare("PRAGMA table_info(audit_log)").all() as any[];
    
    const columns = info.map(c => ({ name: c.name, type: c.type }));
    expect(columns).toContainEqual({ name: 'id', type: 'INTEGER' });
    expect(columns).toContainEqual({ name: 'timestamp', type: 'DATETIME' });
    expect(columns).toContainEqual({ name: 'user_id', type: 'TEXT' });
    expect(columns).toContainEqual({ name: 'action', type: 'TEXT' });
    expect(columns).toContainEqual({ name: 'project_id', type: 'TEXT' });
  });

  it('should handle existing database with missing tables', () => {
    // Manually create a DB with one missing table
    const dbPath = path.join(process.cwd(), 'test-incomplete.sqlite');
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    
    const db = new Database(dbPath);
    db.exec("CREATE TABLE projects (id TEXT PRIMARY KEY)");
    db.close();

    // Now initialize StateStore with this DB
    const instance = StateStore.getInstance(dbPath);
    const checkedDb = instance.getDatabase();
    
    const tables = checkedDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const tableNames = tables.map(t => t.name);
    
    expect(tableNames).toContain('projects');
    expect(tableNames).toContain('spaces');
    expect(tableNames).toContain('audit_log');
    
    StateStore.resetInstance();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  });

  describe('listActiveProjects', () => {
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
});

