import pm2 from 'pm2';
import { ProcessMetadata } from '@/types';

export class ProcessOrchestrator {
  private processes: Map<string, ProcessMetadata> = new Map();

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
   * Disconnects from PM2.
   */
  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      pm2.disconnect();
      resolve();
    });
  }
}
