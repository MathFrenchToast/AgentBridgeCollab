import pm2 from 'pm2';
import { ProcessMetadata } from '@/types';
import { EventEmitter } from 'events';
import { sanitizeProjectName } from './utils.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { StateStore } from './state-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class ProcessOrchestrator extends EventEmitter {
  private processes: Map<string, ProcessMetadata> = new Map();
  private store: StateStore;

  constructor(store?: StateStore) {
    super();
    this.store = store || StateStore.getInstance();
  }

  /**
   * Initializes the orchestrator by connecting to PM2 and recovering state.
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      pm2.connect((connectErr) => {
        if (connectErr) {
          return reject(connectErr);
        }

        pm2.list((listErr, list) => {
          if (listErr) {
            return reject(listErr);
          }

          for (const proc of list) {
            if (proc.name?.startsWith('gcb-') && proc.pm2_env) {
              const projectId = proc.pm2_env.GCB_PROJECT_ID || proc.name.replace('gcb-', '');
              const channelId = proc.pm2_env.GCB_CHANNEL_ID;

              if (projectId && channelId && proc.pm_id !== undefined) {
                this.processes.set(projectId, {
                  pm2Id: proc.pm_id,
                  projectId,
                  channelId,
                });
              }
            }
          }
          resolve();
        });
      });
    });
  }

  /**
   * Synchronizes the internal state with the persistent store and PM2.
   */
  async syncWithPersistentStore(): Promise<void> {
    const activeProjects = this.store.listActiveProjects();
    const pm2Projects = new Set(this.processes.keys());

    // 1. Handle Missing PM2 Processes (In DB but not in PM2)
    for (const project of activeProjects) {
      if (!pm2Projects.has(project.projectId)) {
        console.warn(`Project ${project.projectId} marked as running in DB but missing in PM2. Updating DB status to stopped.`);
        this.store.deleteMapping(project.projectId);
      }
    }

    // 2. Handle Orphaned PM2 Processes (In PM2 but not in DB)
    for (const projectId of pm2Projects) {
      const dbProject = activeProjects.find(p => p.projectId === projectId);
      if (!dbProject) {
        console.warn(`Orphaned PM2 process found: gcb-${projectId}. It is running but not tracked as 'running' in the persistent store.`);
      }
    }
  }

  /**
   * Starts tailing logs and monitoring lifecycle events for all managed processes.
   */
  async startLogTailing(): Promise<void> {
    return new Promise((resolve, reject) => {
      pm2.launchBus((err, bus) => {
        if (err) {
          return reject(err);
        }

        bus.on('log:out', (packet) => {
          this.handleLog(packet, 'stdout');
        });

        bus.on('log:err', (packet) => {
          this.handleLog(packet, 'stderr');
        });

        bus.on('process:event', (packet) => {
          this.handleProcessEvent(packet);
        });

        bus.on('process:exception', (packet) => {
          this.handleException(packet);
        });

        resolve();
      });
    });
  }

  private handleException(packet: any): void {
    const pm2Name = packet.process?.name;
    if (!pm2Name || !pm2Name.startsWith('gcb-')) {
      return;
    }

    const projectId = pm2Name.replace('gcb-', '');
    this.store.logEvent({
      userId: 'system',
      action: 'process:exception',
      projectId: projectId
    });
  }

  private handleProcessEvent(packet: any): void {
    const pm2Name = packet.process?.name;
    if (!pm2Name || !pm2Name.startsWith('gcb-')) {
      return;
    }

    const projectId = pm2Name.replace('gcb-', '');
    const info = this.processes.get(projectId);

    if (!info) {
      return;
    }

    switch (packet.event) {
      case 'online':
        this.emit('PROCESS_ONLINE', { projectId, channelId: info.channelId });
        break;
      case 'exit':
        if (packet.process.exit_code === 0) {
          this.emit('PROCESS_EXITED', { projectId, channelId: info.channelId });
        } else {
          this.emit('PROCESS_CRASHED', { projectId, channelId: info.channelId });
          this.store.logEvent({
            userId: 'system',
            action: 'process:crash',
            projectId: projectId
          });
        }
        break;
      case 'restart':
        this.store.logEvent({
          userId: 'system',
          action: 'process:restart',
          projectId: projectId
        });
        break;
    }
  }

  private handleLog(packet: any, type: 'stdout' | 'stderr'): void {
    const pm2Name = packet.process?.name;
    if (!pm2Name || !pm2Name.startsWith('gcb-')) {
      return;
    }

    const projectId = pm2Name.replace('gcb-', '');
    const info = this.processes.get(projectId);

    if (info) {
      const content = packet.data ? packet.data.toString().trim() : '';
      if (content) {
        this.emit('LOG_EMITTED', {
          projectId,
          channelId: info.channelId,
          content,
          type,
        });
      }
    }
  }

  /**
   * Spawns a new PM2 process for a project.
   */
  async startProcess(
    projectName: string, 
    channelId: string, 
    agentArgs: string[] = ['gemini'],
    ownerId: string = 'system'
  ): Promise<string> {
    const projectId = sanitizeProjectName(projectName);
    const pm2Name = `gcb-${projectId}`;
    
    // In development we use tsx to run the launcher.ts shim.
    // In production, this would point to the compiled launcher.js.
    const launcherPath = path.resolve(__dirname, 'launcher.ts');

    return new Promise((resolve, reject) => {
      pm2.connect((connectErr) => {
        if (connectErr) {
          return reject(connectErr);
        }

        pm2.start(
          {
            name: pm2Name,
            script: launcherPath,
            args: agentArgs,
            interpreter: 'tsx', // Using tsx for development
            autorestart: true,
            stop_exit_codes: [0],
            env: {
              GCB_CHANNEL_ID: channelId,
              GCB_PROJECT_ID: projectId,
            },
          },
          (startErr, apps) => {
            if (startErr) {
              return reject(startErr);
            }
            
            const app = apps?.[0];
            if (app && app.pm_id !== undefined) {
              const metadata = {
                pm2Id: app.pm_id,
                projectId,
                channelId,
              };
              this.processes.set(projectId, metadata);
              
              // Persist mapping
              this.store.saveMapping(projectId, channelId, { 
                pm2Id: app.pm_id, 
                ownerId 
              });
            }

            resolve(projectId);
          }
        );
      });
    });
  }

  /**
   * Sends data to a process's stdin via PM2 IPC.
   */
  async sendToProcess(projectId: string, data: string): Promise<void> {
    const info = this.getProcessInfo(projectId);

    return new Promise((resolve, reject) => {
      pm2.sendDataToProcessId(
        {
          id: info.pm2Id,
          topic: 'gcb:stdin',
          data: data,
        },
        (err, res) => {
          if (err) {
            return reject(err);
          }
          resolve();
        }
      );
    });
  }

  /**
   * Retrieves process metadata by projectId.
   */
  getProcessInfo(projectId: string): ProcessMetadata {
    let info = this.processes.get(projectId);
    
    if (!info) {
      // Try to recover from persistent store
      const mapping = this.store.getMapping(projectId);
      if (mapping) {
        info = {
          pm2Id: mapping.pm2Id,
          projectId: mapping.projectId,
          channelId: mapping.channelId,
        };
        // Restore to in-memory map
        this.processes.set(projectId, info);
      }
    }

    if (!info) {
      throw new Error(`Process with ID ${projectId} not found`);
    }
    return info;
  }

  /**
   * Gracefully stops and deletes a PM2 process.
   */
  async stopProcess(projectId: string): Promise<void> {
    const pm2Name = `gcb-${projectId}`;

    const isNotFoundError = (err: any) => 
      err && (err.message?.includes('process name not found') || err.message?.includes('process not found'));

    return new Promise((resolve, reject) => {
      pm2.connect((connectErr) => {
        if (connectErr) {
          return reject(connectErr);
        }

        // 1. Try to stop
        pm2.stop(pm2Name, (stopErr) => {
          if (stopErr && !isNotFoundError(stopErr)) {
            return reject(stopErr);
          }

          // 2. Try to delete
          pm2.delete(pm2Name, (deleteErr) => {
            if (deleteErr && !isNotFoundError(deleteErr)) {
              return reject(deleteErr);
            }

            // 3. Always remove from internal map and persist
            this.processes.delete(projectId);
            this.store.deleteMapping(projectId);
            resolve();
          });
        });
      });
    });
  }

  /**
   * Finds a projectId associated with a given channelId.
   */
  getProjectFromChannel(channelId: string): string | undefined {
    for (const [projectId, info] of this.processes.entries()) {
      if (info.channelId === channelId) {
        return projectId;
      }
    }
    
    // Try to recover from persistent store
    const mapping = this.store.getProjectByChannel(channelId);
    if (mapping) {
      // Restore to in-memory map
      this.processes.set(mapping.projectId, {
        pm2Id: mapping.pm2Id,
        projectId: mapping.projectId,
        channelId: mapping.channelId,
      });
      return mapping.projectId;
    }

    return undefined;
  }

  /**
   * Returns a list of all managed processes.
   */
  listProcesses(): ProcessMetadata[] {
    return Array.from(this.processes.values());
  }

  /**
   * Disconnects from PM2.
   */
  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      pm2.disconnect();
      resolve();
    });
  }
}
