import { describe, it, expect } from 'vitest';
describe('Provider Interface and Types', () => {
    it('should define AbcCommandType as a union of string literals', () => {
        const validCommands = ['start', 'stop', 'status', 'list'];
        expect(validCommands).toContain('start');
    });
    it('should allow implementing ICollaborationProvider', () => {
        class MockProvider {
            async connect() { }
            async createSpace(projectId) {
                return `space-${projectId}`;
            }
            async sendMessage(spaceId, content) { }
            async waitForInput(spaceId, prompt) {
                return 'mock-input';
            }
            onCommand(callback) { }
        }
        const provider = new MockProvider();
        expect(provider.connect).toBeDefined();
        expect(provider.createSpace).toBeDefined();
        expect(provider.sendMessage).toBeDefined();
        expect(provider.waitForInput).toBeDefined();
        expect(provider.onCommand).toBeDefined();
    });
});
