import { describe, it, expect } from 'vitest';
import { sanitizeProjectName } from '@/core/utils';

describe('sanitizeProjectName', () => {
  it('should convert to lowercase and replace non-alphanumeric with hyphens', () => {
    expect(sanitizeProjectName('My Project 123')).toBe('my-project-123');
  });

  it('should remove leading and trailing hyphens', () => {
    expect(sanitizeProjectName('---My Project---')).toBe('my-project');
  });

  it('should handle malicious command injection attempts', () => {
    expect(sanitizeProjectName('test; rm -rf /')).toBe('test-rm-rf');
  });

  it('should handle special characters', () => {
    expect(sanitizeProjectName('Project @#$%^&*()!')).toBe('project');
  });

  it('should return a fallback UUID if result is empty', () => {
    const result = sanitizeProjectName('!!!');
    expect(result).toMatch(/^[0-9a-f-]{36}$/); // UUID v4 format
  });

  it('should handle multiple spaces and special characters', () => {
    expect(sanitizeProjectName('  My   Awesome   Project  ')).toBe('my-awesome-project');
  });
});
