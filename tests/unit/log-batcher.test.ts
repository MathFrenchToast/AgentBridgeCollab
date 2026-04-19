import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LogBatcher } from '@/core/log-batcher';

describe('LogBatcher', () => {
  let batcher: LogBatcher;
  let mockCallback: any;

  beforeEach(() => {
    vi.useFakeTimers();
    mockCallback = vi.fn().mockResolvedValue(undefined);
    batcher = new LogBatcher(mockCallback, {
      maxBatchSize: 3,
      flushIntervalMs: 1000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should batch logs and flush when maxBatchSize is reached', () => {
    batcher.addLog('p1', 'channel1', 'stdout', 'log 1');
    batcher.addLog('p1', 'channel1', 'stdout', 'log 2');
    expect(mockCallback).not.toHaveBeenCalled();

    batcher.addLog('p1', 'channel1', 'stdout', 'log 3');
    expect(mockCallback).toHaveBeenCalledWith('channel1', 'stdout', 'log 1\nlog 2\nlog 3');
  });

  it('should flush after interval even if batch size is not reached', () => {
    batcher.addLog('p1', 'channel1', 'stdout', 'log 1');
    vi.advanceTimersByTime(999);
    expect(mockCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(mockCallback).toHaveBeenCalledWith('channel1', 'stdout', 'log 1');
  });

  it('should filter out JSON-RPC messages', () => {
    batcher.addLog('p1', 'channel1', 'stdout', '{"jsonrpc": "2.0", "method": "test"}');
    batcher.addLog('p1', 'channel1', 'stdout', 'normal log');
    
    vi.advanceTimersByTime(1000);
    expect(mockCallback).toHaveBeenCalledWith('channel1', 'stdout', 'normal log');
  });

  it('should handle multiple projects separately', () => {
    batcher.addLog('p1', 'channel1', 'stdout', 'p1 log');
    batcher.addLog('p2', 'channel2', 'stdout', 'p2 log');
    
    vi.advanceTimersByTime(1000);
    expect(mockCallback).toHaveBeenCalledWith('channel1', 'stdout', 'p1 log');
    expect(mockCallback).toHaveBeenCalledWith('channel2', 'stdout', 'p2 log');
  });

  it('should handle different log types (stdout/stderr) separately', () => {
    batcher.addLog('p1', 'channel1', 'stdout', 'out');
    batcher.addLog('p1', 'channel1', 'stderr', 'err');
    
    vi.advanceTimersByTime(1000);
    expect(mockCallback).toHaveBeenCalledWith('channel1', 'stdout', 'out');
    expect(mockCallback).toHaveBeenCalledWith('channel1', 'stderr', 'err');
  });

  it('should enforce Discord character limit (roughly)', () => {
    const longLog = 'a'.repeat(2000);
    batcher.addLog('p1', 'channel1', 'stdout', longLog);
    // It should flush immediately if a single log is too long, or at least handle it.
    // For now, let's just ensure it flushes.
    expect(mockCallback).toHaveBeenCalled();
  });
});
