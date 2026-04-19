import { spawn } from 'child_process';
import { pathToFileURL } from 'url';

/**
 * Launcher Shim for Stdio-to-IPC Bridging.
 * Wraps a target command and bridges PM2 IPC messages to its stdin.
 */
export function startLauncher(argv: string[]): void {
  const [,, command, ...args] = argv;

  if (!command) {
    console.error('No command provided');
    process.exit(1);
    return;
  }

  const child = spawn(command, args, {
    stdio: ['pipe', 'inherit', 'inherit'],
  });

  // Bridge PM2 IPC messages (topic: 'abc:stdin') to child process stdin
  process.on('message', (packet: any) => {
    if (packet && packet.topic === 'abc:stdin') {
      const payload = packet.data || packet.payload;
      if (typeof payload === 'string') {
        child.stdin.write(payload + '\n');
      }
    }
  });

  // Capture child process exit and propagate exit code
  child.on('exit', (code) => {
    process.exit(code ?? 1);
  });

  // Handle spawn errors
  child.on('error', (err) => {
    console.error('Failed to start child process:', err);
    process.exit(1);
  });

  // Forward termination signals for graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((sig) => {
    process.on(sig, () => {
      child.kill(sig);
    });
  });
}

// Entry point if executed directly
const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  startLauncher(process.argv);
}
