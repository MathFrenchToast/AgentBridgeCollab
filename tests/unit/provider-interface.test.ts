import { describe, it, expect } from 'vitest';
import type { ICollaborationProvider, AbcCommand } from '@/providers/collaboration-provider';
import type { AbcCommandType } from '@/types';

describe('Provider Interface and Types', () => {
  it('should define AbcCommandType as a union of string literals', () => {
    const validCommands: AbcCommandType[] = ['start', 'stop', 'status', 'list'];
    expect(validCommands).toContain('start');
  });

  it('should allow implementing ICollaborationProvider', () => {
    class MockProvider implements ICollaborationProvider {
      async connect(): Promise<void> {}
      async createSpace(projectId: string): Promise<string> {
        return `space-${projectId}`;
      }
      async sendMessage(spaceId: string, content: string): Promise<void> {}
      async waitForInput(spaceId: string, prompt: string): Promise<string> {
        return 'mock-input';
      }
      onCommand(callback: (command: AbcCommand) => Promise<void>): void {}
    }

    const provider = new MockProvider();
    expect(provider.connect).toBeDefined();
    expect(provider.createSpace).toBeDefined();
    expect(provider.sendMessage).toBeDefined();
    expect(provider.waitForInput).toBeDefined();
    expect(provider.onCommand).toBeDefined();
  });
});
