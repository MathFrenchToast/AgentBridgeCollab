import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Onboarding Documentation', () => {
  const docsDir = path.resolve(__dirname, '../../docs/onboarding');

  it('should have a quick-start.md guide', () => {
    const filePath = path.join(docsDir, 'quick-start.md');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('# Quick Start Guide');
    expect(content).toContain('## Prerequisites');
    expect(content).toContain('## Installation');
    expect(content).toContain('## Environment Configuration');
    expect(content).toContain('## Troubleshooting');
  });

  it('should have a discord-setup.md guide', () => {
    const filePath = path.join(docsDir, 'discord-setup.md');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('# Discord Setup Guide');
    expect(content).toContain('## Step 1: Create Application');
    expect(content).toContain('## Step 2: Bot Configuration');
    expect(content).toContain('Message Content Intent');
  });

  it('should have a slack-setup.md guide', () => {
    const filePath = path.join(docsDir, 'slack-setup.md');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('# Slack Setup Guide');
    expect(content).toContain('## Step 1: Create App');
    expect(content).toContain('Socket Mode');
    expect(content).toContain('xapp-');
    expect(content).toContain('xoxb-');
  });

  it('should update README.md with onboarding links', () => {
    const readmePath = path.resolve(__dirname, '../../README.md');
    expect(fs.existsSync(readmePath)).toBe(true);
    const content = fs.readFileSync(readmePath, 'utf-8');
    expect(content).toContain('docs/onboarding/quick-start.md');
  });
});
