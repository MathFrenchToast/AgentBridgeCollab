import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setup } from '@/index';
import { loadConfig } from '@/core/config-validator';
import { createProvider } from '@/providers/provider-factory';
import { ProcessOrchestrator } from '@/core/process-orchestrator';
import { McpBridge } from '@/core/mcp-bridge';
vi.mock('@/core/config-validator');
vi.mock('@/providers/provider-factory');
vi.mock('@/core/process-orchestrator');
vi.mock('@/core/mcp-bridge');
describe('Application Bootstrap', () => {
    const mockConfig = {
        GCB_PROVIDER: 'discord',
        GCB_PROVIDER_TOKEN: 'token',
        GEMINI_API_KEY: 'key',
        DISCORD_GUILD_ID: 'guild',
        DISCORD_CATEGORY_ID: 'category',
    };
    const mockProvider = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
    };
    const mockOrchestrator = {
        init: vi.fn().mockResolvedValue(undefined),
        startLogTailing: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
    };
    const mockBridge = {
        listenToProviderCommands: vi.fn(),
    };
    beforeEach(() => {
        vi.clearAllMocks();
        loadConfig.mockReturnValue(mockConfig);
        createProvider.mockReturnValue(mockProvider);
        ProcessOrchestrator.mockImplementation(() => mockOrchestrator);
        McpBridge.mockImplementation(() => mockBridge);
    });
    it('should bootstrap the application successfully', async () => {
        const result = await setup();
        expect(result).toBe(true);
        expect(loadConfig).toHaveBeenCalled();
        expect(createProvider).toHaveBeenCalledWith(mockConfig);
        expect(mockProvider.connect).toHaveBeenCalled();
        expect(mockOrchestrator.init).toHaveBeenCalled();
        expect(mockOrchestrator.startLogTailing).toHaveBeenCalled();
        expect(McpBridge).toHaveBeenCalledWith(mockProvider, mockOrchestrator, mockConfig);
        expect(mockBridge.listenToProviderCommands).toHaveBeenCalled();
    });
    it('should handle errors during bootstrap', async () => {
        loadConfig.mockImplementation(() => {
            throw new Error('Config error');
        });
        await expect(setup()).rejects.toThrow('Config error');
    });
    describe('Graceful Shutdown', () => {
        it('should register SIGINT and SIGTERM handlers', async () => {
            const processOnSpy = vi.spyOn(process, 'on').mockImplementation(() => process);
            await setup();
            expect(processOnSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
            expect(processOnSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
        });
        it('should disconnect orchestrator and provider on SIGINT', async () => {
            let sigintHandler = () => { };
            vi.spyOn(process, 'on').mockImplementation((event, handler) => {
                if (event === 'SIGINT')
                    sigintHandler = handler;
                return process;
            });
            const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined);
            await setup();
            await sigintHandler();
            expect(mockOrchestrator.disconnect).toHaveBeenCalled();
            expect(mockProvider.disconnect).toHaveBeenCalled();
            expect(processExitSpy).toHaveBeenCalledWith(0);
        });
    });
});
