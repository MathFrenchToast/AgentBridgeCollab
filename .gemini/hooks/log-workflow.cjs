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
  const response = input.prompt_response || "";

  // Split into lines and only look at the last 10 lines to find the footer
  const allLines = response.split(/\r?\n/);
  const footerLines = allLines.slice(-10);
  
  let summary = "N/A";
  let nextStep = "NONE";
  let found = false;

  for (const line of footerLines) {
    const trimmed = line.trim();
    if (trimmed.toUpperCase().startsWith("[SUMMARY]:")) {
      summary = trimmed.substring(10).trim();
      found = true;
    } else if (trimmed.toUpperCase().startsWith("[NEXT_STEP]:")) {
      nextStep = trimmed.substring(12).trim();
      found = true;
    }
  }

  if (!found) {
    console.log(JSON.stringify({}));
    process.exit(0);
  }
  
  const logLine = `[${getTimestamp()}] SUMMARY: ${summary}\n[${getTimestamp()}] NEXT_STEP: ${nextStep}\n---\n`;
  
  const logDir = path.join(process.cwd(), 'devlog');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  fs.appendFileSync(path.join(logDir, 'workflow.log'), logLine);

  console.log(JSON.stringify({}));
} catch (e) {
  console.log(JSON.stringify({}));
  process.exit(0);
}
