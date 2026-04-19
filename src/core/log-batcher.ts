export interface LogBatcherOptions {
  maxBatchSize?: number;
  flushIntervalMs?: number;
  maxMessageLength?: number;
}

type LogType = 'stdout' | 'stderr';

interface Batch {
  channelId: string;
  type: LogType;
  lines: string[];
  timer: NodeJS.Timeout | null;
}

export class LogBatcher {
  private batches: Map<string, Batch> = new Map();
  private maxBatchSize: number;
  private flushIntervalMs: number;
  private maxMessageLength: number;

  constructor(
    private onFlush: (channelId: string, type: LogType, content: string) => Promise<void>,
    options: LogBatcherOptions = {}
  ) {
    this.maxBatchSize = options.maxBatchSize || 10;
    this.flushIntervalMs = options.flushIntervalMs || 1000;
    this.maxMessageLength = options.maxMessageLength || 1900; // Leave some room for formatting
  }

  public addLog(projectId: string, channelId: string, type: LogType, content: string): void {
    // 1. Filter out MCP JSON-RPC messages
    if (LogBatcher.isJsonRpc(content)) {
      return;
    }

    const key = `${projectId}:${type}`;
    let batch = this.batches.get(key);

    if (!batch) {
      batch = {
        channelId,
        type,
        lines: [],
        timer: null,
      };
      this.batches.set(key, batch);
    }

    batch.lines.push(content);

    // 2. Check if we should flush immediately due to length or batch size
    const currentLength = batch.lines.join('\n').length;

    if (batch.lines.length >= this.maxBatchSize || currentLength >= this.maxMessageLength) {
      this.flush(key);
    } else if (!batch.timer) {
      batch.timer = setTimeout(() => this.flush(key), this.flushIntervalMs);
    }
  }

  private flush(key: string): void {
    const batch = this.batches.get(key);
    if (!batch || batch.lines.length === 0) return;

    if (batch.timer) {
      clearTimeout(batch.timer);
      batch.timer = null;
    }

    const content = batch.lines.join('\n');
    batch.lines = [];
    
    // We don't await here to avoid blocking
    this.onFlush(batch.channelId, batch.type, content).catch((err) => {
      console.error(`[LogBatcher] Error flushing logs for ${key}:`, err);
    });
  }

  public static isJsonRpc(content: string): boolean {
    const trimmed = content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const json = JSON.parse(trimmed);
        return json.jsonrpc === '2.0';
      } catch {
        return false;
      }
    }
    return false;
  }
}
