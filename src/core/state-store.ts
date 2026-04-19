import Database from 'better-sqlite3';
import { Database as SqliteDatabase } from 'better-sqlite3';
import { AuditEntry } from '../types';

export class StateStore {
  private static instance: StateStore | null = null;
  private db: SqliteDatabase;

  private constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  public static getInstance(dbPath: string = './abc.sqlite'): StateStore {
    if (!StateStore.instance) {
      StateStore.instance = new StateStore(dbPath);
    }
    return StateStore.instance;
  }

  /**
   * Only for testing purposes to reset the singleton.
   */
  public static resetInstance(): void {
    if (StateStore.instance) {
      StateStore.instance.db.close();
      StateStore.instance = null;
    }
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT,
        status TEXT,
        created_at DATETIME,
        owner_id TEXT,
        pm2_id INTEGER
      );

      CREATE TABLE IF NOT EXISTS spaces (
        project_id TEXT,
        provider_type TEXT,
        space_id TEXT,
        FOREIGN KEY(project_id) REFERENCES projects(id)
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT,
        action TEXT,
        project_id TEXT
      );
    `);
  }

  public saveMapping(projectId: string, channelId: string, metadata: { pm2Id: number; ownerId: string }): void {
    const { pm2Id, ownerId } = metadata;
    
    const upsertProject = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO projects (id, status, created_at, owner_id, pm2_id)
        VALUES (?, 'running', CURRENT_TIMESTAMP, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          status = 'running',
          pm2_id = excluded.pm2_id
      `).run(projectId, ownerId, pm2Id);

      this.db.prepare(`
        INSERT INTO spaces (project_id, provider_type, space_id)
        VALUES (?, 'discord', ?)
        ON CONFLICT DO NOTHING
      `).run(projectId, channelId);
      
      // Update space_id if project already existed but space changed (rare but possible)
      this.db.prepare(`
        UPDATE spaces SET space_id = ? WHERE project_id = ? AND provider_type = 'discord'
      `).run(channelId, projectId);
    });

    upsertProject();
  }

  public getMapping(projectId: string): { projectId: string; channelId: string; pm2Id: number } | null {
    const row = this.db.prepare(`
      SELECT p.id as projectId, s.space_id as channelId, p.pm2_id as pm2Id
      FROM projects p
      JOIN spaces s ON p.id = s.project_id
      WHERE p.id = ? AND p.status = 'running'
    `).get(projectId) as { projectId: string; channelId: string; pm2Id: number } | undefined;

    return row || null;
  }

  public getProjectByChannel(channelId: string): { projectId: string; channelId: string; pm2Id: number } | null {
    const row = this.db.prepare(`
      SELECT p.id as projectId, s.space_id as channelId, p.pm2_id as pm2Id
      FROM projects p
      JOIN spaces s ON p.id = s.project_id
      WHERE s.space_id = ? AND p.status = 'running'
    `).get(channelId) as { projectId: string; channelId: string; pm2Id: number } | undefined;

    return row || null;
  }

  public deleteMapping(projectId: string): void {
    this.db.prepare(`
      UPDATE projects SET status = 'stopped', pm2_id = NULL WHERE id = ?
    `).run(projectId);
  }

  public listActiveProjects(): { projectId: string; channelId: string; pm2Id: number }[] {
    const rows = this.db.prepare(`
      SELECT p.id as projectId, s.space_id as channelId, p.pm2_id as pm2Id
      FROM projects p
      JOIN spaces s ON p.id = s.project_id
      WHERE p.status = 'running'
    `).all() as { projectId: string; channelId: string; pm2Id: number }[];

    return rows;
  }

  public getDatabase(): SqliteDatabase {
    return this.db;
  }

  public logEvent(entry: AuditEntry): void {
    const { userId, action, projectId } = entry;
    this.db.prepare(`
      INSERT INTO audit_log (user_id, action, project_id)
      VALUES (?, ?, ?)
    `).run(userId, action, projectId || null);
  }

  public getAuditLogs(projectId?: string): AuditEntry[] {
    let query = `
      SELECT user_id as userId, action, project_id as projectId, timestamp
      FROM audit_log
    `;
    const params: any[] = [];

    if (projectId) {
      query += ` WHERE project_id = ?`;
      params.push(projectId);
    }

    query += ` ORDER BY id ASC`;

    const rows = this.db.prepare(query).all(...params) as AuditEntry[];
    return rows;
  }
}
