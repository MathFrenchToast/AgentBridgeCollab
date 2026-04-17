import pm2 from 'pm2';
import { ProcessMetadata } from '@/types';
import { EventEmitter } from 'events';

export class ProcessOrchestrator extends EventEmitter {
  private processes: Map<string, ProcessMetadata> = new Map();

  constructor() {
    super();
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
   * Starts tailing logs for all managed processes.
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

        resolve();
      });
    });
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
   * Sanitizes a project name to kebab-case alphanumeric.
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Spawns a new PM2 process for a project.
   */
  async startProcess(projectName: string, channelId: string): Promise<string> {
    const projectId = this.sanitizeName(projectName);
    const pm2Name = `gcb-${projectId}`;

    return new Promise((resolve, reject) => {
      pm2.connect((connectErr) => {
        if (connectErr) {
          return reject(connectErr);
        }

        pm2.start(
          {
            name: pm2Name,
            script: 'gemini', // Placeholder script as per architect's note
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
              this.processes.set(projectId, {
                pm2Id: app.pm_id,
                projectId,
                channelId,
              });
            }

            resolve(projectId);
          }
        );
      });
    });
  }

  /**
   * Retrieves process metadata by projectId.
   */
  getProcessInfo(projectId: string): ProcessMetadata {
    const info = this.processes.get(projectId);
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

            // 3. Always remove from internal map
            this.processes.delete(projectId);
            resolve();
          });
        });
      });
    });
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
