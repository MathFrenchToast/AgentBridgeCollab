import { randomUUID } from 'crypto';

/**
 * Sanitizes a project name to kebab-case alphanumeric.
 * If the resulting name is empty, returns a random UUID.
 */
export function sanitizeProjectName(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return sanitized || randomUUID();
}
