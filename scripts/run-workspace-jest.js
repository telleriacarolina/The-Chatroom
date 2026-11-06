#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const TEST_FILE_PATTERN = /\.(test|spec)\.[cm]?[jt]sx?$/i;
const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'coverage', '.git']);

function collectTestFiles(dir, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue;
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectTestFiles(fullPath, acc);
      continue;
    }

    if (TEST_FILE_PATTERN.test(entry.name)) {
      acc.push(fullPath);
    }
  }

  return acc;
}

function run() {
  const cwd = process.cwd();
  const testFiles = collectTestFiles(cwd);
  const workspace = path.basename(cwd);

  if (testFiles.length === 0) {
    console.log(`[${workspace}] No test files found. Skipping (classified as workspace without automated tests yet).`);
    process.exit(0);
  }

  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(npxCommand, ['--no-install', 'jest'], {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });

  if (typeof result.status === 'number') {
    process.exit(result.status);
  }

  process.exit(1);
}

run();
