import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn } from 'child_process';
import { startLauncher } from '@/core/launcher';

vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

describe('Launcher Shim', () => {
  let mockChild: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockChild = {
      stdin: {
        write: vi.fn(),
      },
      on: vi.fn(),
      kill: vi.fn(),
    };
    vi.mocked(spawn).mockReturnValue(mockChild);

    // Mock process.exit to prevent the test runner from exiting
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.spyOn(process, 'on');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should spawn the target command with arguments', () => {
    startLauncher(['node', 'launcher.ts', 'target-cmd', 'arg1', 'arg2']);
    expect(spawn).toHaveBeenCalledWith('target-cmd', ['arg1', 'arg2'], expect.objectContaining({
      stdio: ['pipe', 'inherit', 'inherit']
    }));
  });

  it('should exit with error if no command is provided', () => {
    startLauncher(['node', 'launcher.ts']);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalledWith('No command provided');
  });

  it('should forward IPC messages to child stdin', () => {
    startLauncher(['node', 'launcher.ts', 'target-cmd']);
    
    const messageCall = vi.mocked(process.on).mock.calls.find(call => call[0] === 'message');
    expect(messageCall).toBeDefined();
    const messageListener = messageCall![1] as Function;

    const payload = '{"jsonrpc": "2.0", "method": "test"}';
    messageListener({ topic: 'abc:stdin', data: payload });

    expect(mockChild.stdin.write).toHaveBeenCalledWith(payload + '\n');
  });

  it('should exit when child exits', () => {
    startLauncher(['node', 'launcher.ts', 'target-cmd']);
    
    const exitCall = mockChild.on.mock.calls.find((call: any) => call[0] === 'exit');
    expect(exitCall).toBeDefined();
    const exitListener = exitCall![1] as Function;

    exitListener(0);
    expect(process.exit).toHaveBeenCalledWith(0);

    exitListener(127);
    expect(process.exit).toHaveBeenCalledWith(127);
  });

  it('should exit with 1 if child exits without code', () => {
    startLauncher(['node', 'launcher.ts', 'target-cmd']);
    
    const exitCall = mockChild.on.mock.calls.find((call: any) => call[0] === 'exit');
    const exitListener = exitCall![1] as Function;

    exitListener(null);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle child process error', () => {
    startLauncher(['node', 'launcher.ts', 'target-cmd']);
    
    const errorCall = mockChild.on.mock.calls.find((call: any) => call[0] === 'error');
    expect(errorCall).toBeDefined();
    const errorListener = errorCall![1] as Function;

    const error = new Error('Spawn failed');
    errorListener(error);
    
    expect(console.error).toHaveBeenCalledWith('Failed to start child process:', error);
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should forward SIGINT and SIGTERM to child', () => {
    startLauncher(['node', 'launcher.ts', 'target-cmd']);

    const sigintCall = vi.mocked(process.on).mock.calls.find(call => call[0] === 'SIGINT');
    expect(sigintCall).toBeDefined();
    const sigintListener = sigintCall![1] as Function;
    sigintListener();
    expect(mockChild.kill).toHaveBeenCalledWith('SIGINT');

    const sigtermCall = vi.mocked(process.on).mock.calls.find(call => call[0] === 'SIGTERM');
    expect(sigtermCall).toBeDefined();
    const sigtermListener = sigtermCall![1] as Function;
    sigtermListener();
    expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
  });
});
