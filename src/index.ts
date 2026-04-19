import { loadConfig } from '@/core/config-validator';
import { createProvider } from '@/providers/provider-factory';
import { ProcessOrchestrator } from '@/core/process-orchestrator';
import { McpBridge } from '@/core/mcp-bridge';
import { StateStore } from '@/core/state-store';

/**
 * Application Entry point setup function.
 * Bootstraps the bridge, providers, and orchestrator.
 */
export const setup = async (): Promise<boolean> => {
  try {
    // 1. Validate environment variables
    const config = loadConfig();

    // 2. Initialize StateStore
    const store = StateStore.getInstance(config.DATABASE_PATH);

    // 3. Initialize the CollaborationProvider
    const provider = createProvider(config);
    await provider.connect();

    // 4. Initialize ProcessOrchestrator
    const orchestrator = new ProcessOrchestrator(store);
    await orchestrator.init();
    await orchestrator.syncWithPersistentStore();
    await orchestrator.startLogTailing();

    // 5. Initialize McpBridge and start listening
    const bridge = new McpBridge(provider, orchestrator, config);
    bridge.listenToProviderCommands();

    console.log('🚀 Gemini Collaboration Bridge is running!');
    
    // Register graceful shutdown
    setupGracefulShutdown(provider, orchestrator);

    return true;
  } catch (error) {
    console.error('❌ Failed to bootstrap application:', error);
    throw error;
  }
};

/**
 * Sets up listeners for SIGINT and SIGTERM for graceful shutdown.
 */
function setupGracefulShutdown(provider: any, orchestrator: any) {
  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    try {
      await orchestrator.disconnect();
      await provider.disconnect();
      console.log('✅ Graceful shutdown complete.');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Start the application if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setup().catch(() => process.exit(1));
}
