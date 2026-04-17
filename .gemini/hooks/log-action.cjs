#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function getTimestamp() {
  return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

try {
  const inputData = fs.readFileSync(0, 'utf-8');
  if (!inputData) {
    console.log(JSON.stringify({}));
    process.exit(0);
  }
  
  const input = JSON.parse(inputData);
  const toolName = input.tool_name;

  if (!toolName) {
    console.log(JSON.stringify({}));
    process.exit(0);
  }

  const agentName = "aurelius"; 
  const logLine = `[${getTimestamp()}] [${agentName}] Action: ${toolName}\n`;
  
  const logDir = path.join(process.cwd(), 'devlog');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  fs.appendFileSync(path.join(logDir, 'actions.log'), logLine);

  console.log(JSON.stringify({}));
} catch (e) {
  console.log(JSON.stringify({}));
  process.exit(0);
}
