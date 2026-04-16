import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

describe('PM2 Setup Integration', () => {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  it('should have pm2 in dependencies', () => {
    expect(pkg.dependencies).toHaveProperty('pm2');
  });

  it('should have a start script using pm2', () => {
    expect(pkg.scripts).toHaveProperty('start');
    expect(pkg.scripts.start).toContain('pm2');
  });

  it('should have an ecosystem.config.cjs file', () => {
    const ecosystemPath = path.resolve(process.cwd(), 'ecosystem.config.cjs');
    expect(existsSync(ecosystemPath)).toBe(true);
  });
});
